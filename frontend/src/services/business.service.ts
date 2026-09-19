import { supabase } from "./supabase";
import type { Business } from "../types";

export interface CreateBusinessInput {
  owner_id: string;
  name: string;
  category: string;
  location: string;
  description: string;
}

export interface CreatedBusiness {
  id: string;
  name: string;
  public_token: string;
}

export async function createBusiness(
  input: CreateBusinessInput
): Promise<CreatedBusiness> {
  const businessId = crypto.randomUUID();
  const token = generateToken();

  const { error: bizErr } = await supabase.from("businesses").insert({
    id: businessId,
    owner_id: input.owner_id,
    name: input.name,
    category: input.category,
    location: input.location,
    description: input.description,
    is_active: true,
  });
  if (bizErr) throw bizErr;

  await supabase.from("business_staff").insert({
    business_id: businessId,
    user_id: input.owner_id,
    role: "owner",
    status: "available",
  });

  const { error: qrErr } = await supabase.from("business_qr_codes").insert({
    business_id: businessId,
    public_token: token,
    is_active: true,
  });
  if (qrErr) throw qrErr;

  return { id: businessId, name: input.name, public_token: token };
}

export async function getBusiness(businessId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  if (error) throw error;
  return data as Business | null;
}

export async function listMyBusinesses(userId: string): Promise<Business[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function getBusinessByQrToken(
  token: string
): Promise<Business | null> {
  const { data: qr } = await supabase
    .from("business_qr_codes")
    .select("business_id")
    .eq("public_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!qr) return null;

  const { data: biz } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", qr.business_id)
    .maybeSingle();

  return (biz as Business) ?? null;
}
// ---------------------------------------------------------------------------
// Public directory
// ---------------------------------------------------------------------------

export interface PublicBusinessListing extends Business {
  staff_available?: boolean;
}

export async function searchPublicBusinesses(input: {
  query?: string;
  category?: string | null;
  limit?: number;
}): Promise<Business[]> {
  let q = supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(input.limit ?? 50);

  if (input.category && input.category !== "All") {
    q = q.eq("category", input.category);
  }

  if (input.query && input.query.trim()) {
    const term = `%${input.query.trim()}%`;
    q = q.or(`name.ilike.${term},location.ilike.${term},category.ilike.${term}`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function listAllCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("businesses")
    .select("category")
    .eq("is_active", true);
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((row: { category: string | null }) => {
    if (row.category) set.add(row.category);
  });
  return Array.from(set).sort();
}

export async function getBusinessQrToken(
  businessId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("business_qr_codes")
    .select("public_token")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.public_token ?? null;
}

export async function startBusinessSessionFromQr(
  token: string,
  preference: "text" | "speech" | "tts" | "any" = "any"
): Promise<string> {
  const { data, error } = await supabase.rpc("create_business_session_from_qr", {
    p_token: token,
    p_preference: preference,
  });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Could not start conversation.");
  return data[0].out_session_id;
}

export async function acceptBusinessSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc("accept_business_session", {
    p_session_id: sessionId,
  });
  if (error) throw error;
}
export async function listActiveBusinessSessions(
  businessId: string,
  hoursBack = 24
): Promise<import("../types").Session[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("session_type", "business")
    .eq("business_id", businessId)
    .eq("status", "active")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as import("../types").Session[];
}

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "";
  for (let i = 0; i < 12; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

// ---------------------------------------------------------------------------
// Staff management
// ---------------------------------------------------------------------------

export interface StaffRow {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  status: "available" | "busy" | "offline";
  display_name?: string;
}

export interface PublicStaffRow {
  out_display_name: string;
  out_role: string;
  out_status: "available" | "busy" | "offline";
}

export async function listBusinessStaff(
  businessId: string
): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from("business_staff")
    .select("*")
    .eq("business_id", businessId);
  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function listPublicStaff(
  businessId: string
): Promise<PublicStaffRow[]> {
  const { data, error } = await supabase.rpc("list_business_staff_public", {
    p_business_id: businessId,
  });
  if (error) throw error;
  return (data ?? []) as PublicStaffRow[];
}

export async function setMyStaffStatus(
  businessId: string,
  userId: string,
  status: "available" | "busy" | "offline"
): Promise<void> {
  const { error } = await supabase
    .from("business_staff")
    .update({ status })
    .eq("business_id", businessId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function hasAvailableStaff(
  businessId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("business_has_available_staff", {
    p_business_id: businessId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function inviteStaffByEmail(input: {
  businessId: string;
  email: string;
  role: "staff" | "manager";
}): Promise<{ user_id: string; display_name: string }> {
  const { data, error } = await supabase.rpc("invite_staff_by_email", {
    p_business_id: input.businessId,
    p_email: input.email,
    p_role: input.role,
  });
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Invite failed.");
  return { user_id: data[0].out_user_id, display_name: data[0].out_display_name };
}

export async function removeStaffMember(
  businessId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc("remove_staff", {
    p_business_id: businessId,
    p_user_id: userId,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Communication requests
// ---------------------------------------------------------------------------

export interface CommunicationRequest {
  id: string;
  business_id: string;
  customer_id: string;
  message: string | null;
  status: "pending" | "responded" | "cancelled" | "expired";
  created_at: string;
  responded_at: string | null;
  responded_by: string | null;
  session_id: string | null;
}

export async function createCommunicationRequest(
  businessId: string,
  message: string
): Promise<string> {
  const { data, error } = await supabase.rpc("create_communication_request", {
    p_business_id: businessId,
    p_message: message,
  });
  if (error) throw error;
  return data as string;
}

export async function listPendingRequests(
  businessId: string
): Promise<CommunicationRequest[]> {
  const { data, error } = await supabase
    .from("communication_requests")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CommunicationRequest[];
}

export async function respondToRequest(
  requestId: string
): Promise<{ sessionId: string; customerId: string }> {
  const { data, error } = await supabase.rpc(
    "respond_to_communication_request",
    { p_request_id: requestId }
  );
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Could not respond.");
  return {
    sessionId: data[0].out_session_id,
    customerId: data[0].out_customer_id,
  };
}

export async function cancelMyRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("communication_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getMyPendingRequest(
  businessId: string,
  userId: string
): Promise<CommunicationRequest | null> {
  const { data, error } = await supabase
    .from("communication_requests")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  return data as CommunicationRequest | null;
}


export interface UpdateBusinessInput {
  id: string;
  name?: string;
  category?: string;
  location?: string;
  description?: string;
  is_active?: boolean;
}

export async function updateBusiness(
  input: UpdateBusinessInput
): Promise<Business> {
  const { id, ...patch } = input;
  const { data, error } = await supabase
    .from("businesses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Business;
}

export async function deleteBusiness(businessId: string): Promise<void> {
  // Cascades: business_staff, business_qr_codes, communication_requests
  // Sessions linked to it have business_id set to NULL (already handled)
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);
  if (error) throw error;
}

export async function revokeQrCode(
  businessId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("business_qr_codes")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
    })
    .eq("business_id", businessId)
    .eq("is_active", true);
  if (error) throw error;
}

export async function generateNewQrCode(businessId: string): Promise<string> {
  const token = generateToken();
  const { error } = await supabase.from("business_qr_codes").insert({
    business_id: businessId,
    public_token: token,
    is_active: true,
  });
  if (error) throw error;
  return token;
}

