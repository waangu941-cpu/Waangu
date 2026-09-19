import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabase";
import * as messageService from "../services/message.service";
import type { Message } from "../types";

interface UseMessagesOptions {
  sessionId: string | undefined;
  currentUserId?: string | null;
  onIncoming?: (msg: Message) => void;
}

export function useMessages({
  sessionId,
  currentUserId,
  onIncoming,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const onIncomingRef = useRef(onIncoming);

  // Keep the callback ref current without resubscribing
  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;

    async function load() {
      try {
        const msgs = await messageService.listMessages(sessionId!);
        if (mounted) setMessages(msgs);
      } catch (e) {
        if (mounted) {
          setError(
            e instanceof Error ? e.message : "Failed to load messages"
          );
        }
      }
    }
    load();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Fire callback for messages from OTHER users
          if (currentUserId && newMsg.sender_id !== currentUserId) {
            onIncomingRef.current?.(newMsg);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUserId]);

  async function send(input: {
    sender_id: string;
    content: string;
    message_type?: "text" | "transcript_final";
  }) {
    if (!sessionId) return;
    try {
      await messageService.sendMessage({ session_id: sessionId, ...input });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    }
  }

  function clearError() {
    setError(null);
  }

  return { messages, error, send, clearError };
}