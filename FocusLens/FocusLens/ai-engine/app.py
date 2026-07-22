import sys
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.append(str(Path(__file__).resolve().parent))

from blink import BlinkDetector
from detector import FaceDetector
from headpose import HeadPoseDetector
from focus import FocusCalculator
from gaze import EyeGazeDetector
from timer import ScreenTimer

app = Flask(__name__)
CORS(app)

detector = FaceDetector()
blink = BlinkDetector()
headpose = HeadPoseDetector()
gaze = EyeGazeDetector()
timer = ScreenTimer()
focus = FocusCalculator()


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


@app.post('/analyze')
def analyze():
    if 'image' not in request.files or not request.files['image'].filename:
        return jsonify({'error': 'No image uploaded'}), 400

    file_storage = request.files['image']
    image_bytes = np.frombuffer(file_storage.read(), np.uint8)
    frame = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({'error': 'Invalid image upload'}), 400

    frame = cv2.flip(frame, 1)
    results = detector.detect(frame)

    if not results.multi_face_landmarks:
        return jsonify({
            'focus_score': 0.0,
            'status': 'No face detected',
            'head_direction': 'Unknown',
            'eye_direction': 'Unknown',
            'screen_time': 0.0,
        })

    landmarks = results.multi_face_landmarks[0].landmark
    ear, blinks = blink.detect_blink(landmarks)
    direction, head_score = headpose.get_head_direction(landmarks)
    gaze_direction, eye_score = gaze.get_gaze(landmarks)
    face_visible = True

    screen_time = timer.update(face_visible, direction, gaze_direction)
    face_score = 1.0 if face_visible else 0.0
    focus_score = focus.calculate(face_score, head_score, eye_score, screen_time)

    return jsonify({
        'focus_score': round(float(focus_score), 2),
        'status': 'Face detected',
        'head_direction': direction,
        'eye_direction': gaze_direction,
        'screen_time': round(float(screen_time), 2),
        'ear': round(float(ear), 3),
        'blinks': int(blinks),
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
