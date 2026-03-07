from scipy.spatial import distance

def eye_aspect_ratio(eye_landmarks):
    # eye_landmarks: list of 6 (x, y) points
    A = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
    B = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
    C = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
    ear = (A + B) / (2.0 * C)
    return ear

def mouth_aspect_ratio(mouth_landmarks):
    # For a generic 8-point mouth model (outer and inner)
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
    ear_score = max(0, (0.3 - avg_ear) / 0.3 * 60)  # 0-60 points
    yawn_score = min(yawn_count * 10, 30)             # 0-30 points
    alert_score = min(alert_count * 5, 10)             # 0-10 points
    return min(100, ear_score + yawn_score + alert_score)
