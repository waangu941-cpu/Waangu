import type { UserRole } from "../types";

export const ROLE_LABELS: Record<UserRole, string> = {
  // Education
  teacher: "Teacher",
  deaf_student: "Deaf student",
  hearing_student: "Hearing student",
  admin: "School administrator",
  interpreter: "Sign-language interpreter",
  // Community
  community_user: "Community member",
  parent_guardian: "Parent / Guardian",
  // Business / Organisation
  business_owner: "Business owner",
  business_staff: "Business staff",
  // Other
  other: "Other",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role as UserRole] ?? role;
}