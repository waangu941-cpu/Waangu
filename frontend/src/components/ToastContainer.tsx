import { useToast } from "../hooks/useToast";

const KIND_STYLES: Record<string, string> = {
  info: "bg-blue-900 text-white",
  success: "bg-green-700 text-white",
  error: "bg-red-700 text-white",
};

const KIND_ICON: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  error: "⚠️",
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md space-y-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 ${
            KIND_STYLES[t.kind]
          }`}
        >
          <span className="text-lg leading-none flex-shrink-0">
            {KIND_ICON[t.kind]}
          </span>
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0 -mt-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}