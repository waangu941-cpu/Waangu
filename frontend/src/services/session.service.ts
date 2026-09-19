import { supabase } from "./supabase";
import type { Session } from "../types";
import { generateJoinCode } from "../utils/codes";

export interface CreateSessionInput {
  title: string;
  subject: string;
  session_type: "education" | "community";
  created_by: string;
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  const sessionId = crypto.randomUUID();
  const joinCode = generateJoinCode();

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    created_by: input.created_by,
    title: input.title,
    subject: input.subject,
    join_code: joinCode,
    session_type: input.session_type,
  });

  if (sessionError) throw sessionError;

  const { error: partError } = await supabase
    .from("session_participants")
    .insert({ session_id: sessionId, user_id: input.created_by });

  if (partError) throw partError;

  return sessionId;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as Session | null;
}

export async function listMySessions(limit = 10): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Session[];
}

export async function endSession(sessionId: string) {
  const { error } = await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function joinSessionByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("join_session_by_code", {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Session not found.");
  return data[0].out_session_id;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}