"""
Model Training Pipeline — TinyML Drowsiness Classifier

Trains a 3-layer MLP (7 → 16 → 8 → 4) on the generated drowsiness features,
evaluates with 5-fold stratified cross-validation, and exports:
  1. Real confusion matrix from evaluation
  2. Trained weights in JSON format for the TypeScript model
  3. Per-class metrics (precision, recall, F1)

This script produces the ACTUAL numbers that appear on the /validation page.
"""

import numpy as np
import json
import os
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    confusion_matrix, classification_report, accuracy_score,
    f1_score, cohen_kappa_score, roc_auc_score
)
from sklearn.preprocessing import label_binarize
import warnings
warnings.filterwarnings('ignore')

# Load dataset
script_dir = os.path.dirname(os.path.abspath(__file__))
X = np.load(os.path.join(script_dir, 'X_features.npy'))
y = np.load(os.path.join(script_dir, 'y_labels.npy'))

print(f"Loaded dataset: {X.shape[0]} samples, {X.shape[1]} features")
print(f"Classes: {np.bincount(y.astype(int))}")

# Feature normalization ranges (same as in TypeScript model)
FEATURE_RANGES = [
    (0, 0.5),    # EAR
    (0, 1.0),    # MAR
    (0, 1.0),    # PERCLOS
    (-45, 45),   # Head pitch
    (0, 40),     # Blink rate
    (50, 500),   # Blink duration
    (0, 1.0),    # Gaze stability
]

def normalize_features(X_raw):
    """Normalize to [0,1] using physiological ranges (matches TypeScript)."""
    X_norm = np.zeros_like(X_raw)
    for i, (min_val, max_val) in enumerate(FEATURE_RANGES):
        X_norm[:, i] = np.clip((X_raw[:, i] - min_val) / (max_val - min_val), 0, 1)
    return X_norm

X_normalized = normalize_features(X)

# ============================================================
# 5-FOLD STRATIFIED CROSS-VALIDATION
# ============================================================
print("\n" + "="*60)
print("5-FOLD STRATIFIED CROSS-VALIDATION")
print("="*60)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
all_y_true = []
all_y_pred = []
all_y_proba = []
fold_accuracies = []

for fold, (train_idx, test_idx) in enumerate(skf.split(X_normalized, y)):
    X_train, X_test = X_normalized[train_idx], X_normalized[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    # Train MLP with same architecture as TypeScript model: 7 → 16 → 8 → 4
    mlp = MLPClassifier(
        hidden_layer_sizes=(16, 8),
        activation='relu',
        solver='adam',
        max_iter=500,
        random_state=42 + fold,
        early_stopping=True,
        validation_fraction=0.1,
        learning_rate_init=0.001,
    )
    mlp.fit(X_train, y_train)

    y_pred = mlp.predict(X_test)
    y_proba = mlp.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    fold_accuracies.append(acc)
    print(f"  Fold {fold+1}: Accuracy = {acc:.4f}")

    all_y_true.extend(y_test)
    all_y_pred.extend(y_pred)
    all_y_proba.extend(y_proba)

all_y_true = np.array(all_y_true)
all_y_pred = np.array(all_y_pred)
all_y_proba = np.array(all_y_proba)

# ============================================================
# COMPUTE FINAL METRICS
# ============================================================
print("\n" + "="*60)
print("FINAL METRICS (aggregated over all folds)")
print("="*60)

# Confusion Matrix
cm = confusion_matrix(all_y_true, all_y_pred)
print(f"\nConfusion Matrix:")
print(cm)

# Overall metrics
accuracy = accuracy_score(all_y_true, all_y_pred)
weighted_f1 = f1_score(all_y_true, all_y_pred, average='weighted')
macro_f1 = f1_score(all_y_true, all_y_pred, average='macro')
kappa = cohen_kappa_score(all_y_true, all_y_pred)

# AUC-ROC (one-vs-rest)
y_true_bin = label_binarize(all_y_true, classes=[0, 1, 2, 3])
try:
    auc_roc = roc_auc_score(y_true_bin, all_y_proba, average='macro', multi_class='ovr')
except:
    auc_roc = 0.0

print(f"\nAccuracy:      {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"Weighted F1:   {weighted_f1:.4f} ({weighted_f1*100:.1f}%)")
print(f"Macro F1:      {macro_f1:.4f} ({macro_f1*100:.1f}%)")
print(f"AUC-ROC:       {auc_roc:.4f} ({auc_roc*100:.1f}%)")
print(f"Cohen's Kappa: {kappa:.4f}")
print(f"Mean fold acc: {np.mean(fold_accuracies):.4f} ± {np.std(fold_accuracies):.4f}")

# Per-class metrics
print(f"\nClassification Report:")
class_names = ['ALERT', 'MILD', 'MODERATE', 'SEVERE']
report = classification_report(all_y_true, all_y_pred, target_names=class_names, output_dict=True)
print(classification_report(all_y_true, all_y_pred, target_names=class_names))

# ============================================================
# TRAIN FINAL MODEL ON ALL DATA (for weight export)
# ============================================================
print("\n" + "="*60)
print("TRAINING FINAL MODEL ON FULL DATASET")
print("="*60)

final_mlp = MLPClassifier(
    hidden_layer_sizes=(16, 8),
    activation='relu',
    solver='adam',
    max_iter=500,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1,
    learning_rate_init=0.001,
)
final_mlp.fit(X_normalized, y)
print(f"Final model trained. Score on training data: {final_mlp.score(X_normalized, y):.4f}")

# ============================================================
# EXPORT WEIGHTS FOR TYPESCRIPT
# ============================================================
print("\n" + "="*60)
print("EXPORTING WEIGHTS")
print("="*60)

weights = {
    'W1': final_mlp.coefs_[0].tolist(),   # 7 × 16
    'B1': final_mlp.intercepts_[0].tolist(),  # 16
    'W2': final_mlp.coefs_[1].tolist(),   # 16 × 8
    'B2': final_mlp.intercepts_[1].tolist(),  # 8
    'W3': final_mlp.coefs_[2].tolist(),   # 8 × 4
    'B3': final_mlp.intercepts_[2].tolist(),  # 4
}

print(f"  W1: {np.array(weights['W1']).shape}")
print(f"  B1: {np.array(weights['B1']).shape}")
print(f"  W2: {np.array(weights['W2']).shape}")
print(f"  B2: {np.array(weights['B2']).shape}")
print(f"  W3: {np.array(weights['W3']).shape}")
print(f"  B3: {np.array(weights['B3']).shape}")

# ============================================================
# SAVE EVERYTHING
# ============================================================
output = {
    'confusion_matrix': cm.tolist(),
    'class_labels': class_names,
    'overall_metrics': {
        'accuracy': float(accuracy),
        'weighted_f1': float(weighted_f1),
        'macro_f1': float(macro_f1),
        'auc_roc': float(auc_roc),
        'cohens_kappa': float(kappa),
    },
    'per_class': {
        name: {
            'precision': float(report[name]['precision']),
            'recall': float(report[name]['recall']),
            'f1_score': float(report[name]['f1-score']),
            'support': int(report[name]['support']),
        }
        for name in class_names
    },
    'fold_accuracies': [float(a) for a in fold_accuracies],
    'total_test_samples': int(len(all_y_true)),
    'model_weights': weights,
    'feature_ranges': FEATURE_RANGES,
    'model_architecture': '7 → 16 (ReLU) → 8 (ReLU) → 4 (Softmax)',
    'training_config': {
        'optimizer': 'adam',
        'learning_rate': 0.001,
        'max_epochs': 500,
        'early_stopping': True,
        'cv_folds': 5,
    },
}

output_path = os.path.join(script_dir, 'trained_model.json')
with open(output_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSaved to: {output_path}")
print("\nDone! Use 'export_to_typescript.py' to inject these weights into the frontend.")
