import { supabase } from "./supabase";

export type VerificationStatus = "placeholder" | "in_review" | "verified";

export interface ZslResource {
  id: string;
  language_code: string;
  category: string;
  label: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export async function listZslResources(): Promise<ZslResource[]> {
  const { data, error } = await supabase
    .from("sign_language_resources")
    .select("*")
    .eq("language_code", "zsl")
    .order("category", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ZslResource[];
}