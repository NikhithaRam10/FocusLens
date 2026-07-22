import cv2

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - fallback for environments without mediapipe
    mp = None


class _SimpleLandmark:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class _SimpleFaceLandmarks:
    def __init__(self, landmark):
        self.landmark = landmark


class _SimpleDetectionResult:
    def __init__(self, faces):
        self.multi_face_landmarks = faces


class FaceDetector:

    def __init__(self):
        self.face_mesh = None
        self.drawer = None
        self.face_cascade = None

        if mp is not None:
            try:
                self.mp_face_mesh = mp.solutions.face_mesh
                self.face_mesh = self.mp_face_mesh.FaceMesh(
                    static_image_mode=False,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5,
                )
                self.drawer = mp.solutions.drawing_utils
            except Exception:
                self.face_mesh = None
                self.drawer = None

        if self.face_mesh is None:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def detect(self, frame):
        if self.face_mesh is not None:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return self.face_mesh.process(rgb)

        if self.face_cascade is None or self.face_cascade.empty():
            return _SimpleDetectionResult([])

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) == 0:
            return _SimpleDetectionResult([])

        x, y, w, h = faces[0]
        height, width = frame.shape[:2]

        landmarks = [_SimpleLandmark(0.5, 0.5) for _ in range(478)]

        def place(idx, lx, ly):
            landmarks[idx] = _SimpleLandmark(
                max(0.0, min(1.0, (x + (w * lx)) / max(width, 1))),
                max(0.0, min(1.0, (y + (h * ly)) / max(height, 1))),
            )

        place(1, 0.5, 0.5)
        place(33, 0.30, 0.42)
        place(133, 0.70, 0.42)
        place(263, 0.70, 0.42)
        place(468, 0.48, 0.50)
        place(469, 0.50, 0.50)
        place(470, 0.52, 0.50)
        place(471, 0.54, 0.50)
        place(472, 0.56, 0.50)

        return _SimpleDetectionResult([_SimpleFaceLandmarks(landmarks)])