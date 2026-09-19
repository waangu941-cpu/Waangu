"""
Train a sign-language classifier on the KSL landmark dataset.

Dataset structure:
    data/ksl/Dataset/<sign>/<signer_id>/<frame_idx>.npy
    - 13 signs
    - 30 signers per sign
    - 30 frames per signer
    - Each frame: shape (126,) = 42 landmarks × 3 coords (x, y, z)
"""

import os
import json
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

DATA_ROOT = Path("data/ksl/Dataset")
MODEL_PATH = Path("models/ksl_model.keras")
LABEL_MAP_PATH = Path("models/ksl_label_map.json")
TEST_SIZE = 0.2
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# 1. LOAD DATA
# ---------------------------------------------------------------------------

def load_dataset(root: Path):
    X_list = []
    y_list = []
    sign_names = sorted([d.name for d in root.iterdir() if d.is_dir()])
    print(f"Found {len(sign_names)} signs: {sign_names}")

    for sign in sign_names:
        sign_dir = root / sign
        signer_ids = sorted(
            [d.name for d in sign_dir.iterdir() if d.is_dir()],
            key=lambda x: int(x),
        )

        for signer_id in signer_ids:
            signer_dir = sign_dir / signer_id
            frame_files = sorted(
                [f for f in signer_dir.iterdir() if f.suffix == ".npy"],
                key=lambda x: int(x.stem),
            )

            frames = [np.load(f) for f in frame_files]
            sequence = np.array(frames, dtype=np.float32)

            if sequence.shape[0] < 30:
                pad = np.zeros((30 - sequence.shape[0], sequence.shape[1]), dtype=np.float32)
                sequence = np.vstack([sequence, pad])
            elif sequence.shape[0] > 30:
                sequence = sequence[:30]

            X_list.append(sequence)
            y_list.append(sign)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)
    print(f"Loaded: X={X.shape}, y={y.shape}")
    print(f"Unique labels: {len(np.unique(y))}")
    return X, y


# ---------------------------------------------------------------------------
# 2. TRAIN
# ---------------------------------------------------------------------------

def train_tensorflow(X_train, y_train, X_test, y_test, num_classes):
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.utils import to_categorical

    y_train_cat = to_categorical(y_train, num_classes)
    y_test_cat = to_categorical(y_test, num_classes)

    model = models.Sequential([
        layers.Input(shape=X_train.shape[1:]),
        layers.LSTM(64, return_sequences=True),
        layers.Dropout(0.3),
        layers.LSTM(32),
        layers.Dropout(0.3),
        layers.Dense(64, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=10, restore_best_weights=True
    )

    history = model.fit(
        X_train, y_train_cat,
        validation_data=(X_test, y_test_cat),
        epochs=80, batch_size=16, callbacks=[early_stop], verbose=1,
    )

    loss, acc = model.evaluate(X_test, y_test_cat, verbose=0)
    print(f"\nTest accuracy: {acc:.4f}")
    return model, acc


def train_sklearn(X_train, y_train, X_test, y_test):
    from sklearn.neural_network import MLPClassifier
    from sklearn.metrics import accuracy_score

    X_train_flat = X_train.reshape(X_train.shape[0], -1)
    X_test_flat = X_test.reshape(X_test.shape[0], -1)

    model = MLPClassifier(
        hidden_layer_sizes=(256, 128),
        max_iter=500,
        random_state=RANDOM_SEED,
        verbose=True,
    )
    model.fit(X_train_flat, y_train)
    y_pred = model.predict(X_test_flat)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest accuracy: {acc:.4f}")
    return model, acc


# ---------------------------------------------------------------------------
# 3. MAIN
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("KSL Sign Language Classifier Training")
    print("=" * 60)

    X, y = load_dataset(DATA_ROOT)

    mean = X.mean(axis=(0, 1), keepdims=True)
    std = X.std(axis=(0, 1), keepdims=True) + 1e-8
    X = (X - mean) / std

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y_encoded
    )
    print(f"Train: {X_train.shape}, Test: {X_test.shape}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        import tensorflow  # noqa: F401
        print("\nUsing TensorFlow.")
        model, acc = train_tensorflow(X_train, y_train, X_test, y_test, len(le.classes_))
        model.save(MODEL_PATH)
        framework = "tensorflow"
    except ImportError:
        import sklearn  # noqa: F401
        print("\nTensorFlow not installed. Falling back to scikit-learn MLP.")
        model, acc = train_sklearn(X_train, y_train, X_test, y_test)

        import joblib
        joblib.dump(model, MODEL_PATH.with_suffix(".pkl"))
        np.save(MODEL_PATH.parent / "ksl_mean.npy", mean.squeeze())
        np.save(MODEL_PATH.parent / "ksl_std.npy", std.squeeze())
        framework = "sklearn"

    label_map = {i: name for i, name in enumerate(le.classes_)}
    with open(LABEL_MAP_PATH, "w") as f:
        json.dump(label_map, f, indent=2)

    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"Labels saved to: {LABEL_MAP_PATH}")
    print(f"Final test accuracy: {acc:.4f}")
    print(f"Framework: {framework}")


if __name__ == "__main__":
    main()
