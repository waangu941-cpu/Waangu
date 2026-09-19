import { useConnectionStatus } from "../hooks/useConnectionStatus";

interface ConnectionBannerProps {
  /** When true, the banner is rendered even when online. Useful in session rooms. */
  alwaysShow?: boolean;
  className?: string;
}

export default function ConnectionBanner({
  alwaysShow = false,
  className = "",
}: ConnectionBannerProps) {
  const { status } = useConnectionStatus();

  if (status === "online" && !alwaysShow) return null;

  const styles: Record<string, string> = {
    online: "bg-green-50 text-green-800 border-green-200",
    reconnecting: "bg-yellow-50 text-yellow-800 border-yellow-200",
    offline: "bg-red-50 text-red-800 border-red-200",
  };

  const message: Record<string, string> = {
    online: "🟢 Connected",
    reconnecting: "🟡 Reconnecting… Please hold on.",
    offline:
      "🔴 Connection lost. Your messages will send automatically when you're back online.",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-sm rounded-lg border px-3 py-2 mb-3 ${styles[status]} ${className}`}
    >
      {message[status]}
    </div>
  );
}