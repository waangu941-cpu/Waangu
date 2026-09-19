import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
import Header from "../components/Header";

export default function ScanQR() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  async function startScan() {
    setError(null);
    setScanning(true);

    const codeReader = new BrowserQRCodeReader();
    try {
      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (result) {
            controls.stop();
            handleScannedUrl(result.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (e) {
      setScanning(false);
      setError(
        e instanceof Error
          ? e.message
          : "Camera access denied or unavailable. You can enter the code manually below."
      );
    }
  }

  function handleScannedUrl(text: string) {
    try {
      const url = new URL(text);

      // Business QR format: {origin}/b/{token}
      const match = url.pathname.match(/^\/b\/([A-Z0-9]+)$/);
      if (match) {
        navigate(`/b/${match[1]}`);
        return;
      }

      // Fallback: full path
      if (url.origin === window.location.origin) {
        navigate(url.pathname);
        return;
      }

      setError(
        "That QR code is not an EduMarket Zambia business code."
      );
    } catch {
      // Not a URL — maybe it's a join code?
      const cleaned = text.trim().toUpperCase();
      if (/^[A-Z0-9]{6}$/.test(cleaned)) {
        navigate(`/join-session?code=${cleaned}`);
        return;
      }
      setError("That QR code is not recognised.");
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = manualCode.trim().toUpperCase();
    if (!cleaned) return;
    if (/^[A-Z0-9]{6}$/.test(cleaned)) {
      navigate(`/join-session?code=${cleaned}`);
    } else {
      setError("A join code is 6 characters. Please check and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Scan QR code</h2>
          <p className="text-gray-600 text-sm mb-6">
            Point your camera at a business or organisation's EduMarket QR code.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "1 / 1" }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-sm mb-2">Camera is off</p>
                <button
                  onClick={startScan}
                  className="bg-blue-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition"
                >
                  Start camera
                </button>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-yellow-400 rounded-lg" style={{ width: "60%", height: "60%" }} />
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Or enter a code manually
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="bg-yellow-400 text-blue-900 px-5 rounded-md font-medium hover:bg-yellow-300 transition disabled:opacity-50"
              >
                Go
              </button>
            </form>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-4 text-sm text-gray-600 hover:text-blue-900 py-2"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}