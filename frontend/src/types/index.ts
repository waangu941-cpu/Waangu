// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------

export type UserRole =
  // Education
  | "teacher"
  | "deaf_student"
  | "hearing_student"
  | "admin"
  | "interpreter"
  // Community
  | "community_user"
  | "parent_guardian"
  // Business / Organisation
  | "business_owner"
  | "business_staff"
  // Catch-all
  | "other";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  school_id: string | null;
  preferred_language: string;
  accessibility_settings: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type SessionType =
  | "education"
  | "community"
  | "business"
  | "service"
  | "family";

export type SessionStatus = "active" | "ended";

export type CommunicationPreference = "text" | "speech" | "tts" | "any";

export interface Session {
  id: string;
  title: string;
  subject: string;
  session_type: SessionType;
  join_code: string;
  status: SessionStatus;
  created_by: string;
  business_id: string | null;
  communication_preference: CommunicationPreference;
  started_at: string;
  ended_at: string | null;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type MessageType =
  | "text"
  | "transcript_partial"
  | "transcript_final"
  | "system";

export interface Message {
  id: string;
  session_id: string;
  sender_id: string | null;
  message_type: MessageType;
  content: string;
  corrected_content: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusinessQrCode {
  id: string;
  business_id: string;
  public_token: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}