import { supabase } from "./supabase";
import type { ZslResource } from "./zsl.service";
import type { Business } from "../types";

// ---------------------------------------------------------------------------
// Guard: is the current user a platform admin?
// ---------------------------------------------------------------------------

export async function checkIsPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// ZSL content management
// ---------------------------------------------------------------------------

export async function listAllZslResources(): Promise<ZslResource[]> {
  const { data, error } = await supabase
    .from("sign_language_resources")
    .select("*")
    .order("category", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ZslResource[];
}

export interface UpdateZslResourceInput {
  id: string;
  label?: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  verification_status?: "placeholder" | "in_review" | "verified";
  verified_by?: string;
}

export async function updateZslResource(
  input: UpdateZslResourceInput
): Promise<void> {
  const { id, ...patch } = input;
  // If marking as verified, stamp the time
  if (patch.verification_status === "verified") {
    (patch as Record<string, unknown>).verified_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("sign_language_resources")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export interface CreateZslResourceInput {
  language_code?: string;
  category: string;
  label: string;
  description?: string;
  video_url?: string;
}

export async function createZslResource(
  input: CreateZslResourceInput
): Promise<void> {
  const { error } = await supabase.from("sign_language_resources").insert({
    language_code: input.language_code ?? "zsl",
    category: input.category,
    label: input.label,
    description: input.description ?? null,
    video_url: input.video_url ?? null,
    verification_status: "placeholder",
  });
  if (error) throw error;
}

export async function deleteZslResource(id: string): Promise<void> {
  const { error } = await supabase
    .from("sign_language_resources")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Business moderation
// ---------------------------------------------------------------------------

export interface BusinessWithOwner extends Business {
  owner_email?: string;
}

export async function listAllBusinesses(): Promise<BusinessWithOwner[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BusinessWithOwner[];
}

export async function setBusinessActive(
  businessId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("businesses")
    .update({ is_active: isActive })
    .eq("id", businessId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserProfileRow {
  id: string;
  display_name: string;
  role: string;
  created_at: string;
}

export async function listProfiles(limit = 100): Promise<UserProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as UserProfileRow[];
}