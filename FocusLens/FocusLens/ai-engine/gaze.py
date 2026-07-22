class EyeGazeDetector:

    def __init__(self):

        # Left eye landmarks
        self.LEFT_EYE_LEFT = 33
        self.LEFT_EYE_RIGHT = 133

        # Left iris landmarks
        self.LEFT_IRIS = [468, 469, 470, 471, 472]

    def get_gaze(self, landmarks):

        # Eye corners
        left_corner = landmarks[self.LEFT_EYE_LEFT]
        right_corner = landmarks[self.LEFT_EYE_RIGHT]

        # Iris center
        iris_x = sum(landmarks[i].x for i in self.LEFT_IRIS) / len(self.LEFT_IRIS)

        # Eye width
        eye_width = right_corner.x - left_corner.x

        # Safety check
        if eye_width == 0:
            return "Unknown", 0.0

        # Normalized ratio
        ratio = (iris_x - left_corner.x) / eye_width

        #print(f"Gaze Ratio : {ratio:.2f}")

        if ratio < 0.35:
            return "Looking Left", 0.5

        elif ratio > 0.65:
            return "Looking Right", 0.5

        else:
            return "On Screen", 1.0