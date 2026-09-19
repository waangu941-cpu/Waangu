"""
Live sign recognition from webcam using the trained KSL model.

Pipeline:
    Webcam frame
        ↓
    MediaPipe Hands (21 landmarks × 2 hands × 3 coords = 126 features)
        ↓
    Buffer 30 frames
        ↓
    MLP classifier (or LSTM if available)
        ↓
    Predicted sign (displayed on screen)
"""

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["GLOG_minloglevel"] = "3"

import cv2
import mediapipe as mp
import numpy as np
import joblib
import json
from pathlib import Path
from collections import deque

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

MODEL_PATH = Path("models/ksl_model.pkl")
MEAN_PATH = Path("models/ksl_mean.npy")
STD_PATH = Path("models/ksl_std.npy")
LABEL_MAP_PATH = Path("models/ksl_label_map.json")

SEQUENCE_LENGTH = 30       # frames per prediction
CONFIDENCE_THRESHOLD = 0.7 # only show prediction if model is confident
PREDICT_EVERY_N_FRAMES = 3 # predict every N frames (perf optimization)

# ---------------------------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------------------------

print("Loading model...")
model = joblib.load(MODEL_PATH)
mean = np.load(MEAN_PATH)
std = np.load(STD_PATH)
with open(LABEL_MAP_PATH) as f:
    label_map = {int(k): v for k, v in json.load(f).items()}
print(f"Loaded model with {len(label_map)} classes: {list(label_map.values())}")

# ---------------------------------------------------------------------------
# LANDMARK EXTRACTION
# ---------------------------------------------------------------------------

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils


def extract_hand_features(results):
    """
    Extract 126 features from MediaPipe Hands results.
    Layout: left_hand (21 × 3 = 63) + right_hand (21 × 3 = 63).
    Missing hands are zeros.
    """
    left = np.zeros(63, dtype=np.float32)
    right = np.zeros(63, dtype=np.float32)

    if results.multi_hand_landmarks and results.multi_handedness:
        for hand_landmarks, handedness in zip(
            results.multi_hand_landmarks, results.multi_handedness
        ):
            label = handedness.classification[0].label  # "Left" or "Right"
            coords = np.array(
                [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark],
                dtype=np.float32,
            ).flatten()

            # MediaPipe mirrors images — so "Left" label means user's right hand
            # and vice versa. Since the training data was collected with the
            # user's actual left/right, we swap here.
            if label == "Left":
                right = coords
            else:
                left = coords

    return np.concatenate([left, right])


# ---------------------------------------------------------------------------
# MAIN LOOP
# ---------------------------------------------------------------------------

def main():
    cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam.")
        return

    buffer = deque(maxlen=SEQUENCE_LENGTH)
    frame_count = 0
    current_prediction = "..."
    current_confidence = 0.0

    print("Press 'q' to quit. Show a sign to the camera.")

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as hands:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = hands.process(image)
            image.flags.writeable = True

            # Draw hand landmarks
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        frame, hand_landmarks, mp_hands.HAND_CONNECTIONS
                    )

            # Extract features and add to buffer
            features = extract_hand_features(results)
            buffer.append(features)

            # Predict every N frames once buffer is full
            frame_count += 1
            if len(buffer) == SEQUENCE_LENGTH and frame_count % PREDICT_EVERY_N_FRAMES == 0:
                seq = np.array(buffer, dtype=np.float32)          # (30, 126)
                seq_norm = (seq - mean) / std                     # normalize
                seq_flat = seq_norm.flatten().reshape(1, -1)      # (1, 30*126)

                probs = model.predict_proba(seq_flat)[0]
                idx = int(np.argmax(probs))
                conf = float(probs[idx])

                if conf >= CONFIDENCE_THRESHOLD:
                    current_prediction = label_map[idx]
                    current_confidence = conf

            # Draw UI
            h, w = frame.shape[:2]

            # Top banner
            cv2.rectangle(frame, (0, 0), (w, 90), (0, 0, 0), -1)
            cv2.putText(
                frame,
                f"Prediction: {current_prediction}",
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.2,
                (0, 255, 0),
                3,
            )
            cv2.putText(
                frame,
                f"Confidence: {current_confidence * 100:.1f}%  |  Buffer: {len(buffer)}/{SEQUENCE_LENGTH}",
                (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                1,
            )

            # Bottom instructions
            cv2.putText(
                frame,
                "Press 'q' to quit",
                (20, h - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                1,
            )

            cv2.imshow("EduMarket Zambia - Live Sign Recognition", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
