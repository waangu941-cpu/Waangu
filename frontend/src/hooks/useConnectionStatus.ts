import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export type ConnectionStatus = "online" | "reconnecting" | "offline";

/**
 * Tracks:
 * - Browser online/offline events (navigator.onLine)
 * - Supabase Realtime channel health
 * - Automatic recovery when back online
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
  );
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);

  useEffect(() => {
    function goOffline() {
      setStatus("offline");
      setLastOfflineAt(new Date());
    }
    function goOnline() {
      setStatus("online");
      setLastOfflineAt(null);
    }

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Subscribe to a heartbeat channel to detect Supabase connectivity
    const channel = supabase
      .channel("connection-health")
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("online");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          if (navigator.onLine) {
            setStatus("reconnecting");
          } else {
            setStatus("offline");
          }
        } else if (s === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      supabase.removeChannel(channel);
    };
  }, []);

  return { status, lastOfflineAt };
}