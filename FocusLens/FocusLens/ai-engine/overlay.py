import cv2
from config import GREEN, FONT_SCALE, THICKNESS

def draw_overlay(frame, ear, blinks, direction, gaze, screen_time,  focus):

    cv2.putText(frame,
                f"EAR : {ear:.2f}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)

    cv2.putText(frame,
                f"Blinks : {blinks}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)

    cv2.putText(frame,
                f"Head : {direction}",
                (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)

    cv2.putText(frame,
                f"Eyes : {gaze}",
                (20, 160),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)
    cv2.putText(frame,
                f"Screen Time : {screen_time*100:.1f}%",
                (20, 240),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)

    cv2.putText(frame,
                f"Focus : {focus:.1f}%",
                (20, 200),
                cv2.FONT_HERSHEY_SIMPLEX,
                FONT_SCALE,
                GREEN,
                THICKNESS)