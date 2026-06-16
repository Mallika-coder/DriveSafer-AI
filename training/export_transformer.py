"""
Export trained transformer weights to temporalTransformer.ts
"""
import json
import re
import os
import numpy as np

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

with open(os.path.join(script_dir, 'trained_transformer.json'), 'r') as f:
    data = json.load(f)

print(f"Loaded transformer weights (seq accuracy: {data['sequence_accuracy']*100:.1f}%)")

ts_path = os.path.join(project_root, 'frontend', 'src', 'utils', 'temporalTransformer.ts')
with open(ts_path, 'r') as f:
    content = f.read()

def format_matrix(arr, precision=4):
    rows = []
    for row in arr:
        vals = ','.join(f'{v:.{precision}f}' for v in row)
        rows.append(f'  [{vals}]')
    return '[\n' + ',\n'.join(rows) + ',\n]'

def format_vector(arr, precision=4):
    vals = ', '.join(f'{v:.{precision}f}' for v in arr)
    return f'[{vals}]'

# Replace W_proj
W_proj = np.array(data['W_proj'])
new_proj = f"""// TRAINED projection weights (7 → 16) — from training/train_transformer.py
const W_proj: number[][] = {format_matrix(W_proj)};
const B_proj = {format_vector(data['B_proj'])};"""

# Replace W_Q, W_K, W_V
W_Q = np.array(data['W_Q'])
W_K = np.array(data['W_K'])
W_V = np.array(data['W_V'])

new_qkv = f"""// TRAINED Q, K, V projection weights (16 → 16)
const W_Q: number[][] = {format_matrix(W_Q)};
const W_K: number[][] = {format_matrix(W_K)};
const W_V: number[][] = {format_matrix(W_V)};"""

# Replace FFN weights
W_ffn1 = np.array(data['W_ffn1'])
B_ffn1 = np.array(data['B_ffn1'])
W_ffn2 = np.array(data['W_ffn2'])
B_ffn2 = np.array(data['B_ffn2'])

new_ffn = f"""// TRAINED FFN weights (16 → 32 → 4)
const W_ffn1: number[][] = {format_matrix(W_ffn1)};
const B_ffn1 = {format_vector(B_ffn1)};

const W_ffn2: number[][] = {format_matrix(W_ffn2)};
const B_ffn2 = {format_vector(B_ffn2)};"""

# Do the replacements using regex
# Replace W_proj block
content = re.sub(
    r'// Pre-trained projection weights.*?const B_proj = \[.*?\];',
    new_proj,
    content, flags=re.DOTALL
)
# If that didn't match, try the trained version
content = re.sub(
    r'// TRAINED projection weights.*?const B_proj = \[.*?\];',
    new_proj,
    content, flags=re.DOTALL
)

# Replace Q, K, V block
content = re.sub(
    r'// Q, K, V projection weights.*?const W_V: number\[\]\[\] = .*?;',
    new_qkv,
    content, flags=re.DOTALL
)
content = re.sub(
    r'// TRAINED Q, K, V projection.*?const W_V: number\[\]\[\] = .*?;',
    new_qkv,
    content, flags=re.DOTALL
)

# Replace FFN block
content = re.sub(
    r'// FFN weights.*?const B_ffn2 = \[.*?\];',
    new_ffn,
    content, flags=re.DOTALL
)
content = re.sub(
    r'// TRAINED FFN weights.*?const B_ffn2 = \[.*?\];',
    new_ffn,
    content, flags=re.DOTALL
)

with open(ts_path, 'w') as f:
    f.write(content)

print(f"Written to: {ts_path}")
print("Transformer weights are now REAL trained values.")
