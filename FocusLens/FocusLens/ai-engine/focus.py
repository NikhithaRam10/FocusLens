class FocusCalculator:

    def calculate(self, face_score, head_score, eye_score, screen_time):

        attention = (
            face_score +
            head_score +
            eye_score +
            screen_time
        ) / 4

        return attention * 100