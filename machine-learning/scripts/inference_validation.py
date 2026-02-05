from __future__ import annotations
from pathlib import Path
import json
import time
import numpy as np
from tensorflow import keras

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
MODELS = ROOT / "models"

NPZ_PATH = PROCESSED / "fer_processed.npz"
LABELS_PATH = MODELS / "label_names.json"
MODEL_PATH = MODELS / "emotion_cnn.keras"

def main() -> None:
    for p in [NPZ_PATH, LABELS_PATH, MODEL_PATH]:
        if not p.exists():
            raise FileNotFoundError(f"Missing required file: {p}")
    label_names = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    data = np.load(NPZ_PATH, allow_pickle=True)
    X_test = data["X_test"].astype(np.float32, copy=False)
    y_test = data["y_test"]
    y_type = str(data["y_type"][0])

    model = keras.models.load_model(MODEL_PATH)
    range = np.random.default_rng(42)
    idx = int(range.integers(0, len(X_test)))
    x = X_test[idx]

    if y_type == "soft":
        true_idx = int(np.argmax(y_test[idx]))
    else:
        true_idx = int(y_test[idx])
    true_label = label_names[true_idx] if true_idx < len(label_names) else str(true_idx)

    t0 = time.perf_counter()
    probs = model.predict(x[None, ...], verbose=0)[0]
    t1 = time.perf_counter()

    pred_idx = int(np.argmax(probs))
    pred_label = label_names[pred_idx] if pred_idx < len(label_names) else str(pred_idx)

    top3 = np.argsort(probs)[::-1][:3]

    print("===Quick Infer===")
    print(f"index: {idx}")
    print(f"y_type: {y_type}")
    print(f"true: {true_idx} -> {true_label}")
    print(f"pred: {pred_idx} -> {pred_label}")
    print(f"infer_ms: {(t1 - t0) * 1000:.2f} ms")
    print("top3:")
    for j in top3:
        name = label_names[int(j)] if int(j) < len(label_names) else str(int(j))
        print(f" -{name:12s} p={probs[int(j)]:.4f}")
if __name__ == "__main__":
    main()