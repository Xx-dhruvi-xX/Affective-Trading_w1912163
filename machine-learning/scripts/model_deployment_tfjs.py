from __future__ import annotations
from pathlib import Path
import argparse
import json
import subprocess
import shutil
import sys
import tensorflow as tf


def resolve_default_paths() -> tuple[Path, Path, Path]:
    ml_root = Path(__file__).resolve().parents[1]
    project_root = ml_root.parent
    model_dir = ml_root / "models"
    model_path = model_dir / "emotion_cnn.keras"
    labels_path = model_dir / "label_names.json"
    if not labels_path.exists():
        alt = model_dir / "labels_names.json"
        if alt.exists():
            labels_path = alt
    out_dir = project_root / "frontend" / "public" / "tfjs" / "emotion_cnn"
    return model_path, labels_path, out_dir

def export_with_cli(model_path: Path, out_dir: Path) -> None:
    """
    Uses tensorflowjs_converter CLI to export a Keras model to TFJS layers model.
    This avoids importing tensorflowjs inside Python (which triggers tensorflow_hub).
    """
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    out_dir.mkdir(parents=True, exist_ok=True)

    # Convert .keras -> .h5 first for maximum CLI compatibility
    h5_path = out_dir / "emotion_cnn.h5"
    print(f"[INFO] Loading Keras model: {model_path}")
    model = tf.keras.models.load_model(model_path)

    print(f"[INFO] Saving temporary H5: {h5_path}")
    model.save(h5_path)

    cmd = [
        "tensorflowjs_converter",
        "--input_format=keras",
        "--output_format=tfjs_layers_model",
        str(h5_path),
        str(out_dir),
    ]
    print("[INFO] Running:", " ".join(cmd))
    subprocess.check_call(cmd)

    # Remove the temporary .h5 so you don't upload it
    try:
        h5_path.unlink()
    except Exception:
        pass

    model_json = out_dir / "model.json"
    if not model_json.exists():
        raise RuntimeError("Export finished but model.json was not created.")
    print(f"[OK] TFJS export complete: {model_json}")

def export_labels(labels_path: Path, out_dir: Path) -> None:
    if not labels_path.exists():
        print(f"[WARN] Labels file not found (skipping labels export): {labels_path}")
        return
    try:
        labels = json.loads(labels_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise RuntimeError(f"Could not read labels JSON: {labels_path}\n{e}")
    out_labels = out_dir / "label_names.json"
    out_labels.write_text(json.dumps(labels, indent=2), encoding="utf-8")
    print(f"[OK] Labels exported: {out_labels}")

def main() -> int:
    default_model,default_labels,default_out = resolve_default_paths()
    parser = argparse.ArgumentParser(
        description="Generate browser-deployable TensorFlow.js artifacts from a trained Keras CNN model"
    )
    parser.add_argument("--model", type=Path, default=default_model, help="Path to .keras model file.")
    parser.add_argument("--labels", type=Path, default=default_labels, help="Path to label_names.json.")
    parser.add_argument("--out", type=Path, default=default_out, help="Output directory for TFJS artifacts (recommended: frontend/public/...).")
    args = parser.parse_args()
    try:
        export_with_cli(args.model, args.out)
        export_labels(args.labels, args.out)
    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        return 1
    print("\n[INFO] Frontend load paths(later):")
    print("  Model: /tfjs/emotion_cnn/model.json")
    print("  Labels: /tfjs/emotion_cnn/label_names.json")
if __name__ == "__main__":
    raise SystemExit(main())