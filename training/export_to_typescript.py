"""
Export trained model weights and metrics to the TypeScript frontend.

Updates:
  1. frontend/src/utils/tinyMLModel.ts — replaces W1, B1, W2, B2, W3, B3
  2. frontend/src/utils/modelValidation.ts — replaces confusion matrix
"""

import json
import os
import numpy as np

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Load trained model
with open(os.path.join(script_dir, 'trained_model.json'), 'r') as f:
    model_data = json.load(f)

print("Loaded trained model data")
print(f"  Accuracy: {model_data['overall_metrics']['accuracy']*100:.1f}%")
print(f"  Confusion Matrix:\n{np.array(model_data['confusion_matrix'])}")


def format_weight_array(arr, name, precision=6):
    """Format a 2D weight array for TypeScript."""
    arr = np.array(arr)
    if arr.ndim == 1:
        # Bias vector
        values = ', '.join(f'{v:.{precision}f}' for v in arr)
        return f'const {name} = [{values}];'
    else:
        # Weight matrix
        rows = []
        for row in arr:
            values = ', '.join(f'{v:.{precision}f}' for v in row)
            rows.append(f'  [{values}]')
        return f'const {name}: number[][] = [\n' + ',\n'.join(rows) + '\n];'


# ============================================================
# UPDATE tinyMLModel.ts
# ============================================================
print("\nUpdating tinyMLModel.ts with trained weights...")

ts_model_path = os.path.join(project_root, 'frontend', 'src', 'utils', 'tinyMLModel.ts')
with open(ts_model_path, 'r') as f:
    content = f.read()

# Generate new weight strings
W1 = np.array(model_data['model_weights']['W1'])  # 7x16
B1 = np.array(model_data['model_weights']['B1'])  # 16
W2 = np.array(model_data['model_weights']['W2'])  # 16x8
B2 = np.array(model_data['model_weights']['B2'])  # 8
W3 = np.array(model_data['model_weights']['W3'])  # 8x4
B3 = np.array(model_data['model_weights']['B3'])  # 4

def format_ts_matrix(arr, precision=4):
    """Format matrix for TypeScript with limited precision."""
    rows = []
    for row in arr:
        vals = ','.join(f'{v:.{precision}f}' for v in row)
        rows.append(f'  [{vals}]')
    return '[\n' + ',\n'.join(rows) + ',\n]'

def format_ts_vector(arr, precision=4):
    """Format vector for TypeScript."""
    vals = ', '.join(f'{v:.{precision}f}' for v in arr)
    return f'[{vals}]'

# Build the replacement block for weights
new_weights_block = f"""// TRAINED WEIGHTS — exported from training/train_model.py
// Architecture: 7 → 16 (ReLU) → 8 (ReLU) → 4 (Softmax)
// Training: 5-fold CV on {model_data['total_test_samples']} samples, accuracy: {model_data['overall_metrics']['accuracy']*100:.1f}%
// Layer 1: 7 inputs → 16 neurons
const W1: number[][] = {format_ts_matrix(W1)};
const B1 = {format_ts_vector(B1)};

// Layer 2: 16 → 8 neurons
const W2: number[][] = {format_ts_matrix(W2)};
const B2 = {format_ts_vector(B2)};

// Layer 3: 8 → 4 output classes [ALERT, MILD, MODERATE, SEVERE]
const W3: number[][] = {format_ts_matrix(W3)};
const B3 = {format_ts_vector(B3)};"""

# Find and replace the weight definitions
import re

# Replace from "// Pre-trained weights" or "// TRAINED WEIGHTS" to just before "function relu"
pattern = r'(// (?:Pre-trained|TRAINED) weights.*?)\nfunction relu'
match = re.search(pattern, content, re.DOTALL)
if match:
    content = content[:match.start(1)] + new_weights_block + '\n\nfunction relu' + content[match.end():]
    print(f"  Replaced weights block")
else:
    print("  WARNING: Could not find weight block pattern!")

with open(ts_model_path, 'w') as f:
    f.write(content)
print(f"  Written to: {ts_model_path}")


# ============================================================
# UPDATE modelValidation.ts
# ============================================================
print("\nUpdating modelValidation.ts with real confusion matrix...")

ts_validation_path = os.path.join(project_root, 'frontend', 'src', 'utils', 'modelValidation.ts')
with open(ts_validation_path, 'r') as f:
    content = f.read()

cm = model_data['confusion_matrix']
cm_str = '[\n'
for i, row in enumerate(cm):
    label = model_data['class_labels'][i]
    row_str = ', '.join(str(v) for v in row)
    cm_str += f'  [{row_str}],    // {label} actual: {sum(row)} samples\n'
cm_str += ']'

# Replace the confusion matrix
old_cm_pattern = r'const RAW_CONFUSION_MATRIX = \[.*?\];'
new_cm = f'const RAW_CONFUSION_MATRIX = {cm_str};'
content = re.sub(old_cm_pattern, new_cm, content, flags=re.DOTALL)

print(f"  Written to: {ts_validation_path}")
with open(ts_validation_path, 'w') as f:
    f.write(content)

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "="*60)
print("EXPORT COMPLETE")
print("="*60)
print(f"\nReal metrics now in your frontend:")
print(f"  Accuracy:      {model_data['overall_metrics']['accuracy']*100:.1f}%")
print(f"  Weighted F1:   {model_data['overall_metrics']['weighted_f1']*100:.1f}%")
print(f"  Macro F1:      {model_data['overall_metrics']['macro_f1']*100:.1f}%")
print(f"  AUC-ROC:       {model_data['overall_metrics']['auc_roc']*100:.1f}%")
print(f"  Cohen's Kappa: {model_data['overall_metrics']['cohens_kappa']:.4f}")
print(f"\nConfusion Matrix:")
print(f"  {np.array(cm)}")
print(f"\nModel weights (real trained):")
print(f"  W1: 7×16, W2: 16×8, W3: 8×4")
print(f"\nRebuild frontend with: cd frontend && npm run build")
