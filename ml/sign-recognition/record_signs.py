import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["GLOG_minloglevel"] = "3"

import cv2
import mediapipe as mp
import numpy as np
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------

SIGNS = [
    "HELLO", "THANK_YOU", "YES", "NO", "PLEASE",
    "HELP", "WATER", "TOILET", "BOOK", "WRITE",
    "READ", "TEACHER", "STUDENT", "QUESTION", "ANSWER",
    "UNDERSTAND", "DONT_UNDERSTAND", "MORE", "STOP", "FINISH",
]

SAMPLES_PER_SIGN = 20
FRAMES_PER_SAMPLE = 30  # ~2 seconds at ~15 fps capture
COUNTDOWN_SECONDS = 3

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_FILE = DATA_DIR / "landmarks.npz"

# ---------------------------------------------------------------------------
# LANDMARK EXTRACTION
# ---------------------------------------------------------------------------

mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils


def extract_landmarks(results):
    """
    Convert a Holistic result into a flat 225-dim feature vector:
      pose:       33 landmarks x 3 = 99
      left_hand:  21 landmarks x 3 = 63
      right_hand: 21 landmarks x 3 = 63
    Missing landmarks are filled with zeros (so every frame has 225 features).
    """
    pose = np.zeros(33 * 3, dtype=np.float32)
    left = np.zeros(21 * 3, dtype=np.float32)
    right = np.zeros(21 * 3, dtype=np.float32)

    if results.pose_landmarks:
        pose = np.array(
            [[lm.x, lm.y, lm.z] for lm in results.pose_landmarks.landmark],
            dtype=np.float32,
        ).flatten()

    if results.left_hand_landmarks:
        left = np.array(
            [[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()

    if results.right_hand_landmarks:
        right = np.array(
            [[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()

    return np.concatenate([pose, left, right])


# ---------------------------------------------------------------------------
# DISPLAY HELPERS
# ---------------------------------------------------------------------------

def draw_status(frame, sign_name, sample_idx, total_samples):
    h, w = frame.shape[:2]
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)

    cv2.putText(
        frame, f"Sign: {sign_name}", (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2,
    )
    cv2.putText(
        frame, f"Sample {sample_idx + 1} / {total_samples}", (20, 65),
        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1,
    )
    return frame


def draw_instructions(frame, text, color=(255, 255, 255)):
    h, w = frame.shape[:2]
    cv2.putText(
        frame, text, (20, h - 20),
        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2,
    )
    return frame


# ---------------------------------------------------------------------------
# RECORDING
# ---------------------------------------------------------------------------

def countdown(cap, holistic, seconds):
    """Show a countdown. Returns False if user pressed 'q'."""
    for i in range(seconds, 0, -1):
        t_start = time.time()
        while time.time() - t_start < 1.0:
            ret, frame = cap.read()
            if not ret:
                return False
            frame = cv2.flip(frame, 1)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            holistic.process(image)  # warm up

            h, w = frame.shape[:2]
            cv2.putText(
                frame, f"Starting in {i}...", (w // 2 - 150, h // 2),
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3,
            )
            cv2.imshow("EduMarket Zambia - Recording", frame)
            if cv2.waitKey(10) & 0xFF == ord("q"):
                return False
    return True


def record_sample(cap, holistic, frames_needed):
    """Record `frames_needed` frames of landmarks. Returns array (frames, 225)."""
    sequence = []
    while len(sequence) < frames_needed:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = holistic.process(image)
        image.flags.writeable = True

        features = extract_landmarks(results)
        sequence.append(features)

        # Draw landmarks for visual feedback
        mp_drawing.draw_landmarks(
            frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
        mp_drawing.draw_landmarks(
            frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
        mp_drawing.draw_landmarks(
            frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)

        h, w = frame.shape[:2]
        cv2.rectangle(frame, (0, 0), (w, 10), (0, 200, 0), -1)
        cv2.putText(
            frame, f"REC {len(sequence)}/{frames_needed}",
            (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2,
        )
        cv2.imshow("EduMarket Zambia - Recording", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # Pad with zeros if we captured fewer frames
    while len(sequence) < frames_needed:
        sequence.append(np.zeros(225, dtype=np.float32))

    return np.array(sequence, dtype=np.float32)


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam.")
        return

    all_X = []
    all_y = []

    with mp_holistic.Holistic(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        model_complexity=1,
    ) as holistic:
        for sign_idx, sign_name in enumerate(SIGNS):
            print(f"\n=== Sign {sign_idx + 1}/{len(SIGNS)}: {sign_name} ===")

            for sample_idx in range(SAMPLES_PER_SIGN):
                # Show idle frame until user presses SPACE
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    frame = cv2.flip(frame, 1)
                    frame = draw_status(frame, sign_name, sample_idx, SAMPLES_PER_SIGN)
                    frame = draw_instructions(
                        frame,
                        "Press SPACE to record  |  Q to quit",
                        (0, 255, 0),
                    )
                    cv2.imshow("EduMarket Zambia - Recording", frame)
                    key = cv2.waitKey(20) & 0xFF
                    if key == ord(" "):
                        break
                    if key == ord("q"):
                        print("\nAborted. Saving progress...")
                        save(all_X, all_y)
                        cap.release()
                        cv2.destroyAllWindows()
                        return

                # Countdown
                if not countdown(cap, holistic, COUNTDOWN_SECONDS):
                    print("\nAborted. Saving progress...")
                    save(all_X, all_y)
                    cap.release()
                    cv2.destroyAllWindows()
                    return

                # Record
                sequence = record_sample(cap, holistic, FRAMES_PER_SAMPLE)
                all_X.append(sequence)
                all_y.append(sign_idx)
                print(f"  Captured sample {sample_idx + 1}/{SAMPLES_PER_SIGN}")

                # Small pause after capture
                time.sleep(0.3)

            # Save incrementally after each sign
            save(all_X, all_y)

    cap.release()
    cv2.destroyAllWindows()
    print(f"\nDone. Total samples: {len(all_X)}")
    print(f"Saved to: {OUTPUT_FILE}")


def save(X_list, y_list):
    if not X_list:
        return
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int64)
    np.savez_compressed(
        OUTPUT_FILE,
        X=X,
        y=y,
        signs=np.array(SIGNS),
    )


if __name__ == "__main__":
    main()