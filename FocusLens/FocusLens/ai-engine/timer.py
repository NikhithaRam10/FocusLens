class ScreenTimer:

    def __init__(self):
        self.total_frames = 0
        self.focused_frames = 0

    def update(self, face_visible, head_direction, gaze_direction):

        self.total_frames += 1

        if (
            face_visible and
            head_direction == "Forward" and
            gaze_direction == "On Screen"
        ):
            self.focused_frames += 1

        if self.total_frames == 0:
            return 0.0

        return self.focused_frames / self.total_frames