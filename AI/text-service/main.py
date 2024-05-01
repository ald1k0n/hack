from flask import Flask, jsonify, request
from joblib import load
from sklearn.feature_extraction.text import TfidfVectorizer
import tensorflow.keras.backend as K
import numpy as np
import tensorflow as tf
tfidf_vectorizer = load("tfidf_vectorizer.joblib") 
from keras.losses import SparseCategoricalCrossentropy
from PIL import Image

def custom_sparse_categorical_crossentropy():
    return SparseCategoricalCrossentropy(from_logits=True)

custom_objects = {
    'SparseCategoricalCrossentropy': custom_sparse_categorical_crossentropy
}
# Load the saved model with custom objects
loaded_model_image = tf.keras.models.load_model('image_classifier.h5', custom_objects=custom_objects)



app = Flask(__name__)

loaded_model = load('text_classifier.joblib')

@app.route('/classify', methods=['POST'])
def classify_text():
    data = request.get_json()
    text = data['text']

    print(text)

    # Assuming tfidf_vectorizer is already initialized
    new_X = tfidf_vectorizer.transform([text])

    # Use the loaded model for prediction
    prediction = loaded_model.predict(new_X)
    prediction_label = bool(prediction[0])

    return jsonify({"result": prediction_label})


class_names = ['нормальные фото', 'обнаженные_фото', 'сексуальные_цены', 'сцены_насилия']

@app.route('/predict', methods=['POST'])
def predict():
  if 'file' not in request.files:
    return jsonify({"error": "No file part"})

  file = request.files['file']
  image = Image.open(file)
  image = image.resize((180, 180))  # Adjust dimensions as per your model

  img_array = tf.keras.utils.img_to_array(image)
  # img_array = tf.expand_dims(img_array, 0)
  image_array = np.array(image) 

  predictions = loaded_model_image.predict(np.expand_dims(image_array, axis=0))
  score = tf.nn.softmax(predictions[0])

  class_name = class_names[np.argmax(score)]
  confidence = 100 * np.max(score)

  if class_name == "нормальные фото":
    if confidence > 50:
      print(f"нормальное фото {confidence}")
    else:
      print(f"спам")
  else:
    if confidence >= 30:
      print(f"Спам, {class_name}, {confidence:.2f}%")
    else:
      print(f"нормальное фото, {class_name}, {confidence:.2f}%")
  return "hello"

  # return jsonify(image_array)

if __name__ == '__main__':
    app.run(debug=True)
