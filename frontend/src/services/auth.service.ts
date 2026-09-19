import { supabase } from "./supabase";
import type { Profile, UserRole } from "../types";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function createProfile(input: {
  id: string;
  display_name: string;
  role: UserRole;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export interface ProfileUpdate {
  display_name?: string;
  preferred_language?: string;
  accessibility_settings?: Record<string, unknown>;
}

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function recordConsent(
  consentType: "data_processing" | "audio_recording" | "video_recording" | "transcript_storage",
  policyVersion = "v1.0"
): Promise<void> {
  const { error } = await supabase.rpc("record_consent", {
    p_consent_type: consentType,
    p_policy_version: policyVersion,
  });
  if (error) throw error;
}