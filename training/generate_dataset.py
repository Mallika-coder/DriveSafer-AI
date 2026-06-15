"""
Dataset Generation from Physiological Parameters

Since NTHU-DDD requires academic registration for download, we generate a
physiologically-accurate synthetic dataset based on published distributions
from drowsiness detection research papers:

References for feature distributions:
- Dinges et al. (1998): PERCLOS thresholds and distributions
- Soukupova & Cech (2016): EAR normal range 0.25-0.35, drowsy < 0.20
- Schleicher et al. (2008): Blink duration: alert 100-250ms, drowsy 250-500ms
- Wierwille & Ellsworth (1994): Head pitch during drowsiness: 5-25 degrees
- Ji et al. (2004): Blink rate: normal 15-20/min, drowsy 5-10/min or >25/min
- Friedrichs & Yang (2010): Gaze stability degrades with fatigue

The distributions below match these published physiological parameters.
Each "subject" has individual baseline variation (narrow eyes, wide eyes, etc.)
simulating real inter-subject variability.
"""

import numpy as np
import pandas as pd
import json
import os

np.random.seed(42)

NUM_SUBJECTS = 36  # same as NTHU-DDD
FRAMES_PER_SUBJECT = 200  # 200 frames per subject per condition
CONDITIONS = ['alert', 'mild_drowsy', 'moderate_drowsy', 'severe_drowsy']

# Per-subject baseline variation (simulates narrow eyes, wide eyes, etc.)
def generate_subject_baseline():
    """Generate individual physiological baseline (like real human variation)"""
    return {
        'base_ear': np.random.uniform(0.22, 0.34),      # individual eye shape
        'base_mar': np.random.uniform(0.15, 0.30),      # individual mouth shape
        'base_blink_rate': np.random.uniform(12, 22),   # normal blink rate varies
        'base_blink_duration': np.random.uniform(100, 200),  # ms
        'base_gaze_stability': np.random.uniform(0.85, 0.98),
        'wears_glasses': np.random.random() < 0.3,      # 30% wear glasses
        'narrow_eyes': np.random.random() < 0.2,        # 20% naturally narrow eyes
    }


def generate_features(subject, condition, num_frames):
    """Generate physiologically realistic features for a given condition."""

    base = subject
    features = []

    for i in range(num_frames):
        # Time progression within the session (fatigue increases over time)
        time_factor = i / num_frames

        if condition == 'alert':
            ear = base['base_ear'] + np.random.normal(0, 0.02)
            mar = base['base_mar'] + np.random.normal(0, 0.03)
            perclos = np.random.uniform(0.0, 0.08)
            head_pitch = np.random.normal(0, 3)
            blink_rate = base['base_blink_rate'] + np.random.normal(0, 3)
            blink_duration = base['base_blink_duration'] + np.random.normal(0, 30)
            gaze_stability = base['base_gaze_stability'] + np.random.normal(0, 0.03)

        elif condition == 'mild_drowsy':
            ear = base['base_ear'] - 0.03 + np.random.normal(0, 0.025)
            mar = base['base_mar'] + 0.05 * time_factor + np.random.normal(0, 0.04)
            perclos = np.random.uniform(0.08, 0.18)
            head_pitch = np.random.normal(3, 4)
            blink_rate = base['base_blink_rate'] - 3 + np.random.normal(0, 4)
            blink_duration = base['base_blink_duration'] + 60 + np.random.normal(0, 40)
            gaze_stability = base['base_gaze_stability'] - 0.1 + np.random.normal(0, 0.05)

        elif condition == 'moderate_drowsy':
            ear = base['base_ear'] - 0.07 + np.random.normal(0, 0.03)
            mar = base['base_mar'] + 0.15 + np.random.normal(0, 0.06)  # yawning
            perclos = np.random.uniform(0.15, 0.35)
            head_pitch = np.random.normal(8, 5)
            blink_rate = base['base_blink_rate'] - 6 + np.random.normal(0, 5)
            blink_duration = base['base_blink_duration'] + 150 + np.random.normal(0, 50)
            gaze_stability = base['base_gaze_stability'] - 0.25 + np.random.normal(0, 0.08)

        elif condition == 'severe_drowsy':
            ear = base['base_ear'] - 0.12 + np.random.normal(0, 0.03)
            mar = base['base_mar'] + 0.25 + np.random.normal(0, 0.08)
            perclos = np.random.uniform(0.30, 0.70)
            head_pitch = np.random.normal(15, 7)
            blink_rate = base['base_blink_rate'] - 8 + np.random.normal(0, 5)
            blink_duration = base['base_blink_duration'] + 250 + np.random.normal(0, 80)
            gaze_stability = base['base_gaze_stability'] - 0.4 + np.random.normal(0, 0.1)

        # Glasses add noise to EAR detection
        if base['wears_glasses']:
            ear += np.random.normal(0, 0.01)

        # Narrow eyes have lower baseline EAR
        if base['narrow_eyes']:
            ear -= 0.04

        # Clamp to physiological ranges
        ear = np.clip(ear, 0.05, 0.45)
        mar = np.clip(mar, 0.0, 0.9)
        perclos = np.clip(perclos, 0.0, 1.0)
        head_pitch = np.clip(head_pitch, -40, 40)
        blink_rate = np.clip(blink_rate, 2, 40)
        blink_duration = np.clip(blink_duration, 50, 600)
        gaze_stability = np.clip(gaze_stability, 0.1, 1.0)

        features.append([ear, mar, perclos, head_pitch, blink_rate, blink_duration, gaze_stability])

    return np.array(features)


def generate_full_dataset():
    """Generate the complete dataset with all subjects and conditions."""

    all_features = []
    all_labels = []
    all_subjects = []
    all_conditions = []

    label_map = {'alert': 0, 'mild_drowsy': 1, 'moderate_drowsy': 2, 'severe_drowsy': 3}

    for subj_idx in range(NUM_SUBJECTS):
        subject = generate_subject_baseline()

        for condition in CONDITIONS:
            # Vary frame count slightly per condition (realistic — not all clips same length)
            n_frames = FRAMES_PER_SUBJECT + np.random.randint(-20, 20)

            features = generate_features(subject, condition, n_frames)
            labels = np.full(n_frames, label_map[condition])

            all_features.append(features)
            all_labels.append(labels)
            all_subjects.extend([subj_idx] * n_frames)
            all_conditions.extend([condition] * n_frames)

    X = np.vstack(all_features)
    y = np.concatenate(all_labels)

    # Create DataFrame for inspection
    df = pd.DataFrame(X, columns=['ear', 'mar', 'perclos', 'head_pitch', 'blink_rate', 'blink_duration', 'gaze_stability'])
    df['label'] = y
    df['subject_id'] = all_subjects
    df['condition'] = all_conditions

    return X, y, df


if __name__ == '__main__':
    print("Generating physiologically-accurate drowsiness dataset...")
    print(f"  Subjects: {NUM_SUBJECTS}")
    print(f"  Conditions: {CONDITIONS}")
    print(f"  ~Frames per subject per condition: {FRAMES_PER_SUBJECT}")

    X, y, df = generate_full_dataset()

    print(f"\nDataset generated:")
    print(f"  Total samples: {len(X)}")
    print(f"  Features: {X.shape[1]}")
    print(f"  Class distribution:")
    for i, c in enumerate(CONDITIONS):
        count = (y == i).sum()
        print(f"    {c}: {count} ({count/len(y)*100:.1f}%)")

    # Save
    output_dir = os.path.dirname(os.path.abspath(__file__))
    df.to_csv(os.path.join(output_dir, 'drowsiness_dataset.csv'), index=False)
    np.save(os.path.join(output_dir, 'X_features.npy'), X)
    np.save(os.path.join(output_dir, 'y_labels.npy'), y)

    print(f"\nSaved to: {output_dir}/")
    print(f"  - drowsiness_dataset.csv")
    print(f"  - X_features.npy")
    print(f"  - y_labels.npy")

    # Print feature statistics per class
    print("\nFeature statistics per class:")
    print(df.groupby('condition')[['ear', 'mar', 'perclos', 'head_pitch', 'blink_rate', 'blink_duration', 'gaze_stability']].mean().round(3))
