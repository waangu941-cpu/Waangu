import { useCallback, useEffect, useRef, useState } from "react";

interface AudioRecorderProps {
  onTranscribed: (text: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
  backendUrl?: string;
  /** Max recording length in seconds. Defaults to 15. */
  maxDuration?: number;
  /** Hard cap on upload size in bytes, checked before sending. Defaults to 10 MB. */
  maxBlobBytes?: number;
  /** Optional bearer token / API key if your STT endpoint requires auth. */
  authToken?: string;
  /** Abort the STT request if the server hasn't responded within this many ms. Defaults to 20000. */
  requestTimeoutMs?: number;
}

const DEFAULT_MAX_DURATION = 15;
const DEFAULT_MAX_BLOB_BYTES = 10 * 1024 * 1024; // 10 MB
const DEFAULT_TIMEOUT_MS = 20_000;

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ""; // let the browser pick a default
}

export default function AudioRecorder({
  onTranscribed,
  onError,
  disabled,
  backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000",
  maxDuration = DEFAULT_MAX_DURATION,
  maxBlobBytes = DEFAULT_MAX_BLOB_BYTES,
  authToken,
  requestTimeoutMs = DEFAULT_TIMEOUT_MS,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Tracks whether the component is still mounted so async callbacks
  // (recorder.onstop, fetch) never call setState after unmount.
  const mountedRef = useRef(true);

  const cleanupMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupMedia();
      abortRef.current?.abort();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        // Detach the handler first so onstop can't fire (and call setState)
        // after we've already unmounted.
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
    };
  }, [cleanupMedia]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const send = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        onError("Recording was empty — please try again.");
        return;
      }
      if (blob.size > maxBlobBytes) {
        onError("Recording is too large to upload.");
        return;
      }

      setProcessing(true);
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

      const formData = new FormData();
      formData.append("file", blob, "audio.webm");

      try {
        const res = await fetch(`${backendUrl}/api/stt`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });

        if (!res.ok) {
          // Don't leak raw server internals to the UI; log detail, show a generic message.
          console.error(`STT request failed: ${res.status} ${res.statusText}`);
          throw new Error("STT_FAILED");
        }

        const data = await res.json();
        if (!mountedRef.current) return;

        if (typeof data?.text === "string" && data.text.trim().length > 0) {
          onTranscribed(data.text);
        } else {
          onError("No transcript returned from server.");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          onError("Transcription timed out. Check your connection and try again.");
        } else {
          console.error(err);
          onError("Failed to transcribe audio. Check your connection.");
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (mountedRef.current) setProcessing(false);
        abortRef.current = null;
      }
    },
    [backendUrl, authToken, maxBlobBytes, requestTimeoutMs, onTranscribed, onError]
  );

  const start = useCallback(async () => {
    onError("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("Audio recording isn't supported in this browser.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      onError("Microphone access requires a secure (HTTPS) connection.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error", e);
        onError("Recording failed unexpectedly.");
        cleanupMedia();
        if (mountedRef.current) setRecording(false);
      };

      recorder.onstop = () => {
        cleanupMedia();
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];
        if (mountedRef.current) {
          void send(blob);
        }
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);

      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      onError("Microphone access denied or unavailable. Check browser permissions.");
    }
  }, [cleanupMedia, maxDuration, onError, send, stop]);

  const btnLabel = processing ? "Transcribing…" : recording ? `Stop (${elapsed}s)` : "Speak";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || processing}
        aria-label={recording ? "Stop recording" : "Start recording"}
        aria-pressed={recording}
        className={`px-5 py-3 rounded-md font-medium transition disabled:opacity-50 ${
          recording
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-blue-900 text-white hover:bg-blue-800"
        }`}
      >
        {recording && (
          <span
            className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"
            aria-hidden="true"
          />
        )}
        {btnLabel}
      </button>
      {recording && (
        <span className="text-xs text-gray-500" role="status">
          Max {maxDuration}s
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {processing ? "Transcribing audio" : recording ? "Recording audio" : ""}
      </span>
    </div>
  );
}