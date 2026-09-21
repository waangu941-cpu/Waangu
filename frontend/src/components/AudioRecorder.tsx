import { useRef, useState, useEffect } from "react";

interface AudioRecorderProps {
  onTranscribed: (text: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
  backendUrl?: string;
}

interface AudioRecorderProps {
  onTranscribed: (text: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
  backendUrl?: string;
}

export default function AudioRecorder({
  onTranscribed,
  onError,
  disabled,
  backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const maxDurationRef = useRef<number>(15);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function start() {
    onError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await send(blob);
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);

      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= maxDurationRef.current) {
            stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      onError(
        "Microphone access denied or unavailable. Check browser permissions."
      );
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  async function send(blob: Blob) {
    setProcessing(true);
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");

    try {
      const res = await fetch(`${backendUrl}/api/stt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`STT failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        onTranscribed(data.text);
      } else {
        onError("No transcript returned from server.");
      }
    } catch (err) {
      console.error(err);
      onError("Failed to transcribe audio. Check your connection.");
    } finally {
      setProcessing(false);
    }
  }

  const btnLabel = processing
    ? "Transcribing..."
    : recording
    ? `Stop (${elapsed}s)`
    : "Speak";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || processing}
        aria-label={recording ? "Stop recording" : "Start recording"}
        className={`px-5 py-3 rounded-md font-medium transition disabled:opacity-50 ${
          recording
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-blue-900 text-white hover:bg-blue-800"
        }`}
      >
        {recording && (
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
        )}
        {btnLabel}
      </button>
      {recording && (
        <span className="text-xs text-gray-500">
          Max {maxDurationRef.current}s
        </span>
      )}
    </div>
  );
}