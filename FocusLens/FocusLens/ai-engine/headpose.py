from config import HEAD_LEFT_THRESHOLD, HEAD_RIGHT_THRESHOLD

class HeadPoseDetector:

    def __init__(self):

        # Thresholds for vertical movement
        self.UP_THRESHOLD = -0.05
        self.DOWN_THRESHOLD = 0.06

    def get_head_direction(self, landmarks):

        nose = landmarks[1]

        left_eye = landmarks[33]
        right_eye = landmarks[263]

        eye_center_x = (left_eye.x + right_eye.x) / 2
        eye_center_y = (left_eye.y + right_eye.y) / 2

        dx = nose.x - eye_center_x
        dy = nose.y - eye_center_y
        #print(f"dx: {dx:.4f}, dy: {dy:.4f}")
        # LEFT
        if dx < HEAD_LEFT_THRESHOLD:
            return "Looking Left", 0.7

        # RIGHT
        elif dx > HEAD_RIGHT_THRESHOLD:
            return "Looking Right", 0.7

        # UP
        elif dy < self.UP_THRESHOLD:
            return "Looking Up", 0.6

        # DOWN
        elif dy > self.DOWN_THRESHOLD:
            return "Looking Down", 0.3

        # FORWARD
        else:
            return "Forward", 1.0