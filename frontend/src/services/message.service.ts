import { supabase } from "./supabase";
import type { Message, MessageType } from "../types";

export async function listMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(input: {
  session_id: string;
  sender_id: string;
  content: string;
  message_type?: MessageType;
}): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    session_id: input.session_id,
    sender_id: input.sender_id,
    message_type: input.message_type ?? "text",
    content: input.content,
  });
  if (error) throw error;
}
