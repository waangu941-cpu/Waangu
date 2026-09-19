import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

interface QRCodeCardProps {
  businessName: string;
  publicToken: string;
  baseUrl?: string;
}

export default function QRCodeCard({
  businessName,
  publicToken,
  baseUrl = window.location.origin,
}: QRCodeCardProps) {
  const url = `${baseUrl}/b/${publicToken}`;
  const containerRef = useRef<HTMLDivElement>(null);

  function downloadAsSvg() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${businessName.replace(/\s+/g, "-").toLowerCase()}-qr.svg`;
    link.click();
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="bg-white border-4 border-blue-900 rounded-lg p-6 text-center"
        style={{ width: 340 }}
      >
        <div className="text-lg font-bold text-blue-900 mb-1">
          {businessName}
        </div>
        <div className="text-xs font-semibold text-yellow-600 tracking-wider mb-4">
          ACCESSIBLE COMMUNICATION
        </div>
        <div className="flex justify-center mb-4">
          <QRCodeSVG value={url} size={200} level="M" />
        </div>
        <div className="text-sm font-medium text-blue-900 mb-1">
          Scan to communicate
        </div>
        <div className="text-xs text-gray-500 mb-3">
          Text • Captions • Speech
        </div>
        <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-200">
          Powered by EduMarket Zambia
        </div>
      </div>

      <button
        onClick={downloadAsSvg}
        className="mt-4 bg-blue-900 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-800 transition"
      >
        Download QR
      </button>
    </div>
  );
}