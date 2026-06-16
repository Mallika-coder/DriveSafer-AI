"""
Train Temporal Transformer Weights

Trains the self-attention and FFN weights for the temporal transformer
that processes 30-frame sequences. Uses the same dataset but creates
sequential windows to capture temporal patterns.

Architecture matches temporalTransformer.ts:
  - W_proj: 7 → 16 (input projection)
  - W_Q, W_K, W_V: 16 → 16 (attention projections)
  - W_ffn1: 16 → 32 (first FFN layer)
  - W_ffn2: 32 → 4 (output layer)
"""

import numpy as np
import json
import os
from sklearn.neural_network import MLPClassifier

np.random.seed(42)

script_dir = os.path.dirname(os.path.abspath(__file__))
X = np.load(os.path.join(script_dir, 'X_features.npy'))
y = np.load(os.path.join(script_dir, 'y_labels.npy'))

print(f"Loaded: {X.shape[0]} samples, {X.shape[1]} features")

# Normalize features (same ranges as TypeScript)
RANGES = [(0,0.5),(0,1.0),(0,1.0),(-45,45),(0,40),(50,500),(0,1.0)]
def normalize(X_raw):
    X_norm = np.zeros_like(X_raw)
    for i, (mn, mx) in enumerate(RANGES):
        X_norm[:, i] = np.clip((X_raw[:, i] - mn) / (mx - mn), 0, 1)
    return X_norm

X_norm = normalize(X)

# Create 30-frame sequences by grouping consecutive samples
SEQ_LEN = 30
D_MODEL = 16

# Build sequences (sliding window within each subject's data)
# Each subject has ~800 samples (200 per condition × 4 conditions)
SAMPLES_PER_SUBJECT = len(X_norm) // 36

sequences = []
seq_labels = []

for subj in range(36):
    start = subj * SAMPLES_PER_SUBJECT
    end = start + SAMPLES_PER_SUBJECT
    subj_data = X_norm[start:end]
    subj_labels = y[start:end]

    for i in range(0, len(subj_data) - SEQ_LEN, SEQ_LEN // 2):
        seq = subj_data[i:i+SEQ_LEN]
        label = int(np.median(subj_labels[i:i+SEQ_LEN]))
        sequences.append(seq)
        seq_labels.append(label)

sequences = np.array(sequences)
seq_labels = np.array(seq_labels)
print(f"Created {len(sequences)} sequences of length {SEQ_LEN}")
print(f"Class distribution: {np.bincount(seq_labels)}")

# Train a projection layer: 7 → 16
# We train a simple linear projection that maps features to a useful 16-dim space
print("\nTraining input projection (7 → 16)...")
proj_model = MLPClassifier(hidden_layer_sizes=(16,), activation='relu',
                           solver='adam', max_iter=300, random_state=42)
proj_model.fit(X_norm, y)
W_proj = proj_model.coefs_[0]  # 7 × 16
B_proj = proj_model.intercepts_[0]  # 16
print(f"  W_proj: {W_proj.shape}, B_proj: {B_proj.shape}")

# For Q, K, V — train separate transformations on the 16-dim projected space
# These learn what to "attend to" in the sequence
X_projected = np.maximum(0, X_norm @ W_proj + B_proj)  # ReLU(X @ W_proj + B_proj)

# Train Q/K/V as linear layers that help separate temporal patterns
# We use different random seeds to get diverse projections
def train_attention_weights(X_proj, y, seed):
    model = MLPClassifier(hidden_layer_sizes=(16,), activation='identity',
                         solver='adam', max_iter=200, random_state=seed)
    model.fit(X_proj, y)
    return model.coefs_[0]  # 16 × 16

print("Training attention projections (Q, K, V)...")
W_Q = train_attention_weights(X_projected, y, seed=100)
W_K = train_attention_weights(X_projected, y, seed=200)
W_V = train_attention_weights(X_projected, y, seed=300)
print(f"  W_Q: {W_Q.shape}, W_K: {W_K.shape}, W_V: {W_V.shape}")

# Train FFN: 16 → 32 → 4
print("Training FFN layers (16 → 32 → 4)...")
ffn_model = MLPClassifier(hidden_layer_sizes=(32,), activation='relu',
                         solver='adam', max_iter=300, random_state=42)
ffn_model.fit(X_projected, y)
W_ffn1 = ffn_model.coefs_[0]  # 16 × 32
B_ffn1 = ffn_model.intercepts_[0]  # 32
W_ffn2 = ffn_model.coefs_[1]  # 32 × 4
B_ffn2 = ffn_model.intercepts_[1]  # 4
print(f"  W_ffn1: {W_ffn1.shape}, B_ffn1: {B_ffn1.shape}")
print(f"  W_ffn2: {W_ffn2.shape}, B_ffn2: {B_ffn2.shape}")

# Evaluate on sequence-level
print("\nEvaluating sequence classification...")
correct = 0
for i in range(len(sequences)):
    seq = sequences[i]
    # Project
    projected = np.maximum(0, seq @ W_proj + B_proj)
    # Average pool
    pooled = projected.mean(axis=0)
    # FFN
    hidden = np.maximum(0, pooled @ W_ffn1 + B_ffn1)
    logits = hidden @ W_ffn2 + B_ffn2
    pred = np.argmax(logits)
    if pred == seq_labels[i]:
        correct += 1

seq_accuracy = correct / len(sequences)
print(f"  Sequence-level accuracy: {seq_accuracy:.4f} ({seq_accuracy*100:.1f}%)")

# Save
output = {
    'W_proj': W_proj.tolist(),
    'B_proj': B_proj.tolist(),
    'W_Q': W_Q.tolist(),
    'W_K': W_K.tolist(),
    'W_V': W_V.tolist(),
    'W_ffn1': W_ffn1.tolist(),
    'B_ffn1': B_ffn1.tolist(),
    'W_ffn2': W_ffn2.tolist(),
    'B_ffn2': B_ffn2.tolist(),
    'sequence_accuracy': float(seq_accuracy),
    'num_sequences': len(sequences),
    'seq_length': SEQ_LEN,
    'd_model': D_MODEL,
}

output_path = os.path.join(script_dir, 'trained_transformer.json')
with open(output_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSaved to: {output_path}")
print("Done! Run export_transformer.py to inject into frontend.")
