import cv2
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import tensorflow as tf
import requests
from io import BytesIO

# model = load_model('../image_classifier.h5')
class_names = ['нормальные фото', 'обнаженные_фото', 'сексуальные_цены', 'сцены_насилия']

def predict(image, model):
  print("predict")
  image = cv2.resize(image, (180, 180))
  image = img_to_array(image)
  image = np.expand_dims(image, axis=0)
  image = image

  predictions = model.predict(image)
  score = tf.nn.softmax(predictions[0])
  class_name = class_names[np.argmax(score)]
  confidence = 100 * np.max(score)
  return class_name, confidence

def extract_frames(video_path, skip_frames=30):
  video = cv2.VideoCapture(video_path)
  print("extract_frames")
  frames = []
  frame_idx = 0
  while True:
      ret, frame = video.read()
      if not ret:
          break
      if frame_idx % skip_frames == 0:
          frames.append(frame)
      frame_idx += 1
  video.release()
  return frames


def classify_frames(frames, model):
  print("classify_frames")
  results = []
  for frame in frames:
      frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
      class_name, confidence = predict(frame_rgb, model)
      normal = False
      if class_name == "нормальные фото":
          if confidence > 50:
              print(f"нормальное фото {confidence:.2f}%")
              normal = True
          else:
              print("спам")
              print({"confidence": confidence, "class_name": class_name, "normal": normal})
              return False
      else:
          if confidence >= 30:
              print(f"Спам, {class_name}, {confidence:.2f}%")
              return False
          else:
              return False
              

      results.append({"confidence": confidence, "class_name": class_name, "normal": normal})
      if cv2.waitKey(25) & 0xFF == ord('q'): 
          break
  cv2.destroyAllWindows()
  return results

def classify(video, model):
  good_video = True
  frames = extract_frames(video, skip_frames=5)
  result = classify_frames(frames,model)

  if str(result)=="False":
      good_video=False

  return good_video