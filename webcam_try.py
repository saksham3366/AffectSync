import os
import time
from collections import Counter
# Force Keras backend to match training
os.environ["KERAS_BACKEND"] = "torch"

import cv2
import numpy as np
import keras

# 1. Load Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# 2. Load the trained emotion recognition model
model_path = 'emotion_model.keras'
print(f"Loading model from {model_path}...")
model = keras.models.load_model(model_path)
print("Model loaded successfully!")

# 3. Define emotion classes (alphabetical order matching training)
classes = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# 4. Preprocessing function for the RTX 3050 GPU-trained model
def preprocess_face(face_img):
    # Resize to 128x128 (matching model's input shape)
    face = cv2.resize(face_img, (128, 128))
    
    # Convert grayscale (1 channel) to RGB (3 channels)
    face_rgb = cv2.cvtColor(face, cv2.COLOR_GRAY2RGB)
    
    # Normalize (optional, model's built-in scaling is handled, but let's match input type)
    face_rgb = face_rgb.astype(np.float32)
    
    # Add batch dimension (1, 128, 128, 3)
    face_batch = np.expand_dims(face_rgb, axis=0)
    return face_batch

# 5. Emotion prediction
def predict_emotion(face_img):
    processed = preprocess_face(face_img)
    prediction = model.predict(processed, verbose=0)
    class_idx = np.argmax(prediction)
    confidence = prediction[0][class_idx]
    return classes[class_idx], confidence

# 6. Start webcam video capture
print("Starting webcam. Analyzing face for 7 seconds...")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam. Make sure your camera is connected and not in use.")

detected_emotions = []
start_time = time.time()
duration_seconds = 7.0

while cap.isOpened():
    # Check if time limit reached
    elapsed_time = time.time() - start_time
    if elapsed_time > duration_seconds:
        break

    ret, frame = cap.read()
    if not ret:
        break

    # Convert frame to grayscale for Haar Cascade face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=7, minSize=(30, 30))

    # Show remaining time on window
    remaining_time = max(0.0, duration_seconds - elapsed_time)
    cv2.putText(frame, f"Scanning: {remaining_time:.1f}s left", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    for (x, y, w, h) in faces:
        # Crop face from the grayscale frame
        face_gray = gray[y:y+h, x:x+w]
        
        try:
            # Predict emotion
            label, confidence = predict_emotion(face_gray)
            detected_emotions.append(label)
            
            # Format display string
            display_text = f"{label} ({confidence*100:.1f}%)"

            # Draw bounding box and text
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, display_text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        except Exception as e:
            pass

    # Display the live video frame
    cv2.imshow('Webcam Emotion Detection (Keras 3 + PyTorch)', frame)

    # Press 'q' to quit early
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up
cap.release()
cv2.destroyAllWindows()
print("Webcam closed.")

# Calculate and output final result
if detected_emotions:
    final_emotion = Counter(detected_emotions).most_common(1)[0][0]
else:
    final_emotion = "Neutral"

# Print the clean label to stdout for external backend parsing
print(final_emotion)
