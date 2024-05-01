from flask import Flask, jsonify, request
from joblib import load
from sklearn.feature_extraction.text import TfidfVectorizer


tfidf_vectorizer = load("tfidf_vectorizer.joblib") 

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

if __name__ == '__main__':
    app.run(debug=True)
