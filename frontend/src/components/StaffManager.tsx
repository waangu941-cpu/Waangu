import { useEffect, useState } from "react";
import {
  listBusinessStaff,
  inviteStaffByEmail,
  removeStaffMember,
  setMyStaffStatus,
  type StaffRow,
} from "../services/business.service";

interface StaffManagerProps {
  businessId: string;
  ownerId: string;
  currentUserId: string;
}

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  busy: "bg-yellow-100 text-yellow-800",
  offline: "bg-gray-100 text-gray-600",
};

const STATUS_DOT: Record<string, string> = {
  available: "🟢",
  busy: "🟡",
  offline: "⚪",
};

export default function StaffManager({
  businessId,
  ownerId,
  currentUserId,
}: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "manager">("staff");
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwner = ownerId === currentUserId;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function load() {
    try {
      const rows = await listBusinessStaff(businessId);
      setStaff(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    setError(null);
    setSuccessMsg(null);
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const result = await inviteStaffByEmail({
        businessId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setSuccessMsg(`Added ${result.display_name} as ${inviteRole}.`);
      setInviteEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invite failed.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    try {
      await removeStaffMember(businessId, userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove staff.");
    }
  }

  async function handleStatusChange(
    userId: string,
    status: "available" | "busy" | "offline"
  ) {
    setError(null);
    try {
      await setMyStaffStatus(businessId, userId, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-blue-900">Staff</h3>
        <span className="text-xs text-gray-500">
          {staff.length} {staff.length === 1 ? "member" : "members"}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2 mb-3">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded p-2 mb-3">
          {successMsg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading staff…</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => {
            const isMe = s.user_id === currentUserId;
            const isBizOwner = s.user_id === ownerId;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-md p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {STATUS_DOT[s.status]} {isMe ? "You" : "Staff member"}
                    {isBizOwner && (
                      <span className="ml-2 text-xs text-blue-900 font-normal">
                        Owner
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>

                {isMe ? (
                  <select
                    value={s.status}
                    onChange={(e) =>
                      handleStatusChange(
                        s.user_id,
                        e.target.value as "available" | "busy" | "offline"
                      )
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      STATUS_STYLES[s.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status}
                  </span>
                )}

                {isOwner && !isMe && (
                  <button
                    onClick={() => handleRemove(s.user_id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isOwner && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Add a staff member
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="staff@example.com"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "staff" | "manager")
              }
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {inviting ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The person must already have an EduMarket account.
          </p>
        </div>
      )}
    </div>
  );
}