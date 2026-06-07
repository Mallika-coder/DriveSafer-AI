import numpy as np
from scipy.spatial import distance


def eye_aspect_ratio(eye_landmarks):
    A = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
    B = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
    C = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
    ear = (A + B) / (2.0 * C)
    return ear


def mouth_aspect_ratio(mouth_landmarks):
    A = distance.euclidean(mouth_landmarks[1], mouth_landmarks[7])
    B = distance.euclidean(mouth_landmarks[2], mouth_landmarks[6])
    C = distance.euclidean(mouth_landmarks[3], mouth_landmarks[5])
    D = distance.euclidean(mouth_landmarks[0], mouth_landmarks[4])
    mar = (A + B + C) / (2.0 * D) if D != 0 else 0
    return mar


def calculate_drowsiness_score(ear_history, yawn_count, alert_count):
    if not ear_history:
        return 0
    avg_ear = sum(ear_history[-30:]) / len(ear_history[-30:])
    ear_score = max(0, (0.3 - avg_ear) / 0.3 * 60)
    yawn_score = min(yawn_count * 10, 30)
    alert_score = min(alert_count * 5, 10)
    return min(100, ear_score + yawn_score + alert_score)


def calculate_perclos(ear_history, threshold=0.22):
    """PERCLOS: Percentage of eye closure over a time window."""
    if len(ear_history) < 30:
        return 0.0
    recent = ear_history[-150:]
    closed_count = sum(1 for e in recent if e < threshold)
    return closed_count / len(recent)


def estimate_head_pose_simple(nose, chin, left_eye, right_eye, forehead):
    """Simplified head pose estimation from key landmarks.
    Returns pitch, yaw, roll in degrees.
    """
    eye_center = np.array([(left_eye[0] + right_eye[0]) / 2,
                           (left_eye[1] + right_eye[1]) / 2])
    nose = np.array(nose[:2])
    forehead = np.array(forehead[:2])
    chin = np.array(chin[:2])
    left_eye = np.array(left_eye[:2])
    right_eye = np.array(right_eye[:2])

    yaw = (nose[0] - eye_center[0]) * 180

    face_height = np.linalg.norm(forehead - chin)
    if face_height == 0:
        pitch = 0
    else:
        nose_ratio = np.linalg.norm(nose - forehead) / face_height
        pitch = (nose_ratio - 0.4) * 120

    roll = np.degrees(np.arctan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]))

    return float(pitch), float(yaw), float(roll)


def compute_composite_score(ear, mar, perclos, head_pitch, head_yaw, blink_rate, blink_duration, gaze_stability):
    """Multi-signal weighted fusion for drowsiness scoring.

    Implements a feature-weighted model combining:
    - PERCLOS (30%): most researched fatigue metric
    - EAR (20%): instantaneous eye closure
    - Blink duration (15%): microsleep indicator
    - MAR (10%): yawning
    - Head pitch (10%): nodding
    - Blink rate (8%): deviation from normal
    - Gaze stability (7%): erratic movement = fatigue
    """
    def sigmoid(x):
        return 1.0 / (1.0 + np.exp(-x))

    perclos_score = float(sigmoid((perclos - 0.15) * 20)) * 100
    ear_score = float(sigmoid((0.25 - ear) * 30)) * 100
    blink_dur_score = float(sigmoid((blink_duration - 200) / 100)) * 100
    mar_score = min((mar - 0.6) * 250, 100) if mar > 0.6 else 0
    head_score = min(abs(head_pitch) * 3, 100) if abs(head_pitch) > 10 else 0

    normal_blink = 15
    blink_dev = abs(blink_rate - normal_blink)
    blink_rate_score = min(blink_dev * 8, 100) if blink_dev > 5 else 0

    gaze_score = (1 - gaze_stability) * 100

    composite = (
        0.30 * perclos_score +
        0.20 * ear_score +
        0.15 * blink_dur_score +
        0.10 * mar_score +
        0.10 * head_score +
        0.08 * blink_rate_score +
        0.07 * gaze_score
    )

    return min(100, max(0, composite))
