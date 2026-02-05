"""
Affective Trading (Final Year Project)
Student Name: Dhruvi Soni
Student ID: W1912163/3
Supervisor: Dr. Alan Immanuel Benjamin Vallavaraj  
Module: 6COSC023W Computer Science Final Project
Description:
    - Loads the processed FER dataset (saved as .npz by data_preprocessing.py)
- Builds a simple CNN model for facial expression classification (48x48 grayscale)
- Trains the model using training + validation splits
- Evaluates on the test set
- Saves:
  1) Trained model: models/emotion_cnn.keras
  2) Label names:  models/label_names.json

Note:
This CNN is part of the "research/training" side. Later, this model can be
exported to TFJS and used in the frontend.
"""
from __future__ import annotations
from pathlib import Path
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# path URLS
ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

NPZ_PATH = PROCESSED / "fer_processed.npz"
META_PATH = PROCESSED / "labels.json"
MODEL_PATH = MODEL_DIR / "emotion_cnn.keras"
LABELS_PATH = MODEL_DIR / "label_names.json"

def load_data():
    if not NPZ_PATH.exists():
        raise FileNotFoundError(f"Missing processed dataset: {NPZ_PATH}. Please run the data_preprocessing.py first.")
    if not META_PATH.exists():
        raise FileNotFoundError(f"Missing metadata: {META_PATH}. Please run the data_preprocessing.py first.")
    # Load the split arrays saved during preprocessing 
    data = np.load(NPZ_PATH, allow_pickle=True)
    X_train = data["X_train"]
    y_train = data["y_train"]
    X_val = data["X_val"]
    y_val = data["y_val"]
    X_test = data["X_test"]
    y_test = data["y_test"]
    y_type = str(data["y_type"][0])
# Load label names 
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    label_names = meta.get("label_names", [])
    return (X_train, y_train, X_val, y_val, X_test, y_test, y_type, label_names)

def build_model(num_classes: int):

    inputs = keras.Input(shape=(48, 48, 1))

    x = layers.Conv2D(32,3, padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.25)(x)

    x = layers.Conv2D(64,3, padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.25)(x)

    x = layers.Conv2D(128,3, padding="same")(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.MaxPooling2D()(x)
    x = layers.Dropout(0.35)(x)
    # Classifier head
    x = layers.Flatten()(x)
    x = layers.Dense(256)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = layers.Dropout(0.5)(x)

    outputs = layers.Dense(num_classes, activation="softmax")(x)
    model = keras.Model(inputs, outputs)
    return model

def main():
    #Main training entry point
    X_train, y_train, X_val, y_val, X_test, y_test, y_type, label_names = load_data()
    # Decide loss/metrics based on label format
    if y_type == "soft":
        num_classes = y_train.shape[1]
        loss = keras.losses.CategoricalCrossentropy()
        metrics = [keras.metrics.CategoricalAccuracy(name=" categorical-accuracy")]
    else:
        # Integer labels: shape(N, )
        num_classes = len(label_names) if label_names else int(np.max(y_train)) + 1
        loss = keras.losses.SparseCategoricalCrossentropy()
        metrics = [keras.metrics.SparseCategoricalAccuracy(name="sparse_categorical_accuracy")]
        
        if y_train.ndim ==2 and y_train.shape[1] ==1:
            y_train = y_train.squeeze(1)
            y_val = y_val.squeeze(1)
            y_test = y_test.squeeze(1)

    print("Data shapes:")
    print("X_train:", X_train.shape, "y_train:", y_train.shape)
    print("X_val:", X_val.shape, "y_val:", y_val.shape)
    print("X_test:", X_test.shape, "y_test:", y_test.shape)
    print("y_type:", y_type,  "num_classes:", num_classes)

    # Converting to float32 for training speed+stability
    X_train = X_train.astype(np.float32, copy = False)
    X_val = X_val.astype(np.float32, copy = False)
    X_test = X_test.astype(np.float32, copy = False)
    
    model = build_model(num_classes)
    #compilation with Adam optimizer
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=1e-3), loss=loss, metrics=metrics,)

    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6),
        keras.callbacks.ModelCheckpoint(str(MODEL_PATH), monitor="val_loss", save_best_only=True),
    ]
    #Model training
    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=30,
        batch_size=64,
        callbacks=callbacks,
        verbose=1,
    )
    # Evaluate results on the hold-out test set
    results = model.evaluate(X_test, y_test, verbose=1, return_dict=True)
    print("Test Results:", results)
    # Save labels used by the model 
    LABELS_PATH.write_text(json.dumps(label_names, indent=2), encoding="utf-8")
    print("Model saved to:", MODEL_PATH)
    print("Labels saved to:", LABELS_PATH)
if __name__ == "__main__":
    main()