"""
AffectSync Emotion Detection API
Flask server wrapping the Keras emotion model.
Accepts base64-encoded webcam frames, returns detected emotion.
"""
import os
import base64
import sys

# Force Keras backend to PyTorch (matching training)
os.environ["KERAS_BACKEND"] = "torch"

import cv2
import numpy as np
import keras
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:4173",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:4173",
])

# ── Load model once at startup ──────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "emotion_model.keras")
print(f"[EmotionAPI] Loading model from {MODEL_PATH}...")
model = keras.models.load_model(MODEL_PATH)
print("[EmotionAPI] Model loaded successfully!")

# Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# 7-class labels (alphabetical, matching training order)
CLASSES = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]


def preprocess_face(face_img):
    """Resize to 128x128 RGB and prepare for model input."""
    face = cv2.resize(face_img, (128, 128))
    face_rgb = cv2.cvtColor(face, cv2.COLOR_GRAY2RGB)
    face_rgb = face_rgb.astype(np.float32)
    face_batch = np.expand_dims(face_rgb, axis=0)
    return face_batch


def decode_base64_image(b64_string):
    """Decode a base64-encoded image string to a numpy array."""
    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img


def predict_single_frame(frame):
    """Run emotion prediction on a single frame. Returns (emotion, confidence, faces_found)."""
    if frame is None:
        return "Neutral", 0.5, 0

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=7, minSize=(30, 30)
    )

    if len(faces) == 0:
        return "Neutral", 0.5, 0

    # Use the largest face detected
    areas = [w * h for (x, y, w, h) in faces]
    best_idx = np.argmax(areas)
    x, y, w, h = faces[best_idx]

    face_gray = gray[y : y + h, x : x + w]
    processed = preprocess_face(face_gray)
    prediction = model.predict(processed, verbose=0)
    class_idx = int(np.argmax(prediction))
    confidence = float(prediction[0][class_idx])

    return CLASSES[class_idx], confidence, len(faces)


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON: { "image": "<base64 encoded image>" }
    Returns JSON: { "emotion": "Happy", "confidence": 0.87 }
    """
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "Missing 'image' field in request body"}), 400

    try:
        frame = decode_base64_image(data["image"])
        emotion, confidence, faces_found = predict_single_frame(frame)

        return jsonify({
            "emotion": emotion,
            "confidence": round(confidence, 4),
            "faces_found": faces_found,
        })

    except Exception as e:
        print(f"[EmotionAPI] Error: {e}", file=sys.stderr)
        return jsonify({"emotion": "Neutral", "confidence": 0.0, "error": str(e)}), 500


@app.route("/scan", methods=["POST"])
def scan():
    """
    Multi-frame scan endpoint.
    Accepts JSON: { "frames": ["<base64>", "<base64>", ...] }
    Returns the most common emotion across all frames.
    """
    data = request.get_json(silent=True)
    if not data or "frames" not in data:
        return jsonify({"error": "Missing 'frames' field"}), 400

    frames = data["frames"]
    if not isinstance(frames, list) or len(frames) == 0:
        return jsonify({"error": "'frames' must be a non-empty array"}), 400

    from collections import Counter
    emotions = []
    confidences = []

    for b64_frame in frames:
        try:
            frame = decode_base64_image(b64_frame)
            emotion, confidence, faces_found = predict_single_frame(frame)
            if faces_found > 0:
                emotions.append(emotion)
                confidences.append(confidence)
        except Exception:
            continue

    if emotions:
        most_common = Counter(emotions).most_common(1)[0][0]
        matching_confs = [c for e, c in zip(emotions, confidences) if e == most_common]
        avg_conf = sum(matching_confs) / len(matching_confs)
    else:
        most_common = "Neutral"
        avg_conf = 0.5

    return jsonify({
        "emotion": most_common,
        "confidence": round(avg_conf, 4),
        "frames_analyzed": len(emotions),
        "total_frames": len(frames),
    })


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": MODEL_PATH, "classes": CLASSES})


if __name__ == "__main__":
    print("[EmotionAPI] Starting on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
