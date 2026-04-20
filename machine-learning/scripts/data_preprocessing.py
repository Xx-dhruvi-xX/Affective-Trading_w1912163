"""
Affective Trading (Final Year Project)
Student Name: Dhruvi Soni
Student ID: W1912163/3
Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj
Module: 6COSC023W Computer Science Final Project

Description:
First stage of the custom emotion recognition pipeline developed
as a part of this project. Prepares the FER2013 image data together with
the FERPlus crowd-sourced vote labels so that the CNN in train_cnn.py can be trained
on a cleaned, reproducible dataset.

key steps:
- Loads FER2013 pixel data and usage splits from CSV
- Loads FERPlus emotion vote counts from CSV
- Merges datasets and applies filtering rules to remove ambiguous samples
- Converts pixel strings to numpy arrays and normalises to [0,1]
- Builds target arrays as either soft (probabilistic) or sparse (class index) labels
- Saves processed arrays and metadata to compressed NPZ file for use in training and inference
- Saves metadata about the processing steps and dataset characteristics to a JSON file for reference
This script is designed to be run once to prepare the dataset, and can be re-run if the raw data files are updated or if the filtering rules are changed.
"""



from __future__ import annotations
from pathlib import Path
import numpy as np
import pandas as pd
import json

# Project folders
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
PROCESSED.mkdir(parents=True, exist_ok=True)

#Dataset location
FER2013_DIR = RAW / "fer2013"
FERPLUS_DIR = RAW / "ferplus" / "FERPlus-master"

#output files
OUT_NPZ = PROCESSED / "fer_processed.npz"
OUT_META = PROCESSED / "labels.json"

#FER images are 48 x 48 grayscale
IMG_H, IMG_W = 48, 48

#FERPlus label names
Emotions = [
    "neutral",
    "happiness",
    "surprise",
    "sadness",
    "anger",
    "disgust",
    "fear",
    "contempt",
]

USE_SOFT_LABELS = True
DROP_AMBIGUOUS = True
MIN_MAJORITY_VOTES = 5

def _cols_lower(df: pd.DataFrame) -> dict[str,str]:
    return {c.strip().lower(): c for c in df.columns}

def _require_col(cols_map: dict [str,str], name: str) -> str:
    #check if required column exists
    if name not in cols_map:
        raise ValueError(f"Expected column '{name}' not found. Available: {list(cols_map.values())}")
    return cols_map[name]

def load_fer2013_pixels() -> tuple[pd.DataFrame,str]:
    # Load dataset
    candidates = [
        FER2013_DIR / "icml_face_data.csv",
        FER2013_DIR / "fer2013.csv",
    ]
    src = next((p for p in candidates if p.exists()), None)
    if src is None:
        raise FileNotFoundError("Could not find FER2013 dataset CSV file. Expected one of:\n" f"- {candidates[0]}\n- {candidates[1]}\n" "Please download the dataset and place it in the 'data/raw/fer2013' directory.")
    df = pd.read_csv(src)
    df.columns = [c.strip() for c in df.columns]
    return df, str(src)

# Load FerPlus vote file with per-emotion vote counts
def load_ferplus_votes() -> tuple[pd.DataFrame,str]:
    src = FERPLUS_DIR / "fer2013new.csv"
    if not src.exists():
        raise FileNotFoundError(f"Could not find FER+ labels at: {src}\n""Please download the FERPlus dataset and place it in the 'data/raw/ferplus' directory.")
    df = pd.read_csv(src)
    df.columns = [c.strip() for c in df.columns]
    return df, str(src)

#convert pixel strings into numpy arrays
def pixels_to_X(pixels: pd.Series) -> np.ndarray:
    arr = pixels.astype(str).str.strip().apply(lambda s: np.fromstring(s, sep=" ", dtype=np.float32))
    X = np.stack(arr.values)
    expected = IMG_H * IMG_W
    if X.shape[1] != expected:
        raise ValueError(f"Unexpected pixels length: expected {expected}, got {X.shape[1]}")
    X = (X.reshape(-1, IMG_H, IMG_W,1)/255.0).astype(np.float32)
    return X

def build_targets(df: pd.DataFrame) -> tuple[np.ndarray,str,np.ndarray]:
    votes = df[Emotions].astype(np.float32).to_numpy()
    unknown = df["unknown"].astype(np.float32).to_numpy()
    nf = df["nf"].astype(np.float32).to_numpy()

    keep = np.ones(len(df), dtype=bool)

    if DROP_AMBIGUOUS:
        best = votes.max(axis=1)
        keep &= (best >= float(MIN_MAJORITY_VOTES))
        keep &= (unknown < best) & (nf < best)
    votes = votes[keep]
    if USE_SOFT_LABELS:
        row_sums = votes.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        y = votes / row_sums
        return y.astype(np.float32), "soft", keep
    y = votes.argmax(axis=1).astype(np.float32)
    return y, "sparse", keep

def split_indices(usage: pd.Series) -> tuple[np.ndarray,np.ndarray,np.ndarray]:
    u = usage.astype(str).str.lower()
    # split indicies into train/val/test based on FER usage field
    train_idx = np.where(u.str.contains("train"))[0]
    val_idx = np.where(u.str.contains("public"))[0]
    test_idx = np.where(u.str.contains("private"))[0]

    if len(train_idx) == 0 or len(val_idx) == 0 or len(test_idx) == 0:
        n = len(usage)
        range = np.random.default_rng(42)
        idx = range.permutation(n)
        n_train = int(0.8*n)
        n_val = int(0.1*n)
        train_idx = idx[:n_train]
        val_idx = idx[n_train:n_train+n_val]
        test_idx = idx[n_train+n_val:]
    return train_idx, val_idx, test_idx

def main() -> None:
    #load both datasets
    fer_df,fer_src = load_fer2013_pixels()
    ferplus_df,ferplus_src = load_ferplus_votes()
    # identify required columns
    fer_cols = _cols_lower(fer_df)
    pixels_col = _require_col(fer_cols, "pixels")
    usage_col = _require_col(fer_cols, "usage")

    ferplus_cols = _cols_lower(ferplus_df)
    _require_col(ferplus_cols, "usage")
    for c in Emotions + ["unknown", "nf"]:
        _require_col(ferplus_cols, c)
    if len(fer_df) != len(ferplus_df):
        raise ValueError(f"Row count mismatch:\n"f"- FER2013 rows: {len(fer_df)} ({fer_src})\n"f"- FERPlus rows: {len(ferplus_df)} ({ferplus_src}\n)")
    combined = fer_df.copy()

    vote_cols_actual = [ferplus_cols[c] for c in Emotions + ["unknown", "nf"]]
    votes = ferplus_df[vote_cols_actual].copy()
    votes.columns = Emotions + ["unknown", "nf"]
    #Standardise column names
    combined = pd.concat([combined.reset_index(drop=True), votes.reset_index(drop=True)], axis=1)
    combined = combined.rename(columns={pixels_col: "pixels", usage_col: "usage"})
    X_all = pixels_to_X(combined["pixels"])
    y_all, y_type, keep = build_targets(combined)
    usage_kept = combined.loc[keep, "usage"].reset_index(drop=True)
    tain_idx, val_idx, test_idx = split_indices(usage_kept)

    X_kept = X_all[keep]
    X_train, X_val, X_test = X_kept[tain_idx], X_kept[val_idx], X_kept[test_idx]
    y_train, y_val, y_test = y_all[tain_idx], y_all[val_idx], y_all[test_idx]

    # saave arrays
    np.savez_compressed(
        OUT_NPZ,
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        X_test=X_test,
        y_test=y_test,
        y_type=np.array([y_type], dtype=object),
    )
    # save metadata for reference
    meta = {
        "fer2013_source_csv": fer_src,
        "ferplus_source_csv": ferplus_src,
        "image_shape": [IMG_H, IMG_W, 1],
        "label_names": Emotions,
        "y_type": y_type,
        "filtering": {
            "drop_ambiguous": DROP_AMBIGUOUS,
            "min_majority_votes": MIN_MAJORITY_VOTES,
            "use_soft_labels": USE_SOFT_LABELS,
        },
        "counts": {
            "kept_total": int(keep.sum()),
            "train": int(len(tain_idx)),
            "val": int(len(val_idx)),
            "test": int(len(test_idx)),
        },
    }
    OUT_META.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print("Saved:", OUT_NPZ)
    print("Saved:", OUT_META)
    print("y_type:", y_type)
    print("Kept rows:", int(keep.sum()), "/", len(combined))

if __name__ == "__main__":
    main()