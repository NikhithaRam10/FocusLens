import math
from config import EAR_THRESHOLD, CLOSED_FRAMES
class BlinkDetector:

    def __init__(self):

        self.blink_count = 0
        self.frame_counter = 0

        # Threshold for blink
        self.EAR_THRESHOLD = EAR_THRESHOLD

        # Eye should remain closed for these many frames
        self.CLOSED_FRAMES = CLOSED_FRAMES
    def distance(self, p1, p2):

        return math.hypot(
            p1.x - p2.x,
            p1.y - p2.y
        )

    def calculate_EAR(self, landmarks, eye_points):

        p1 = landmarks[eye_points[0]]
        p2 = landmarks[eye_points[1]]
        p3 = landmarks[eye_points[2]]
        p4 = landmarks[eye_points[3]]
        p5 = landmarks[eye_points[4]]
        p6 = landmarks[eye_points[5]]

        vertical1 = self.distance(p2, p6)
        vertical2 = self.distance(p3, p5)

        horizontal = self.distance(p1, p4)

        ear = (vertical1 + vertical2) / (2.0 * horizontal)

        return ear

    def detect_blink(self, landmarks):

        # LEFT EYE
        left_eye = [33, 160, 158, 133, 153, 144]

        # RIGHT EYE
        right_eye = [362, 385, 387, 263, 373, 380]

        leftEAR = self.calculate_EAR(
            landmarks,
            left_eye
        )

        rightEAR = self.calculate_EAR(
            landmarks,
            right_eye
        )

        ear = (leftEAR + rightEAR) / 2

        if ear < self.EAR_THRESHOLD:

            self.frame_counter += 1

        else:

            if self.frame_counter >= self.CLOSED_FRAMES:

                self.blink_count += 1

            self.frame_counter = 0

        return ear, self.blink_count