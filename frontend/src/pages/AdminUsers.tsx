import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkIsPlatformAdmin,
  listProfiles,
  type UserProfileRow,
} from "../services/admin.service";
import Header from "../components/Header";
import { roleLabel } from "../utils/roles";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const ok = await checkIsPlatformAdmin();
      if (!ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      try {
        const rows = await listProfiles(200);
        setUsers(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      }
      setChecking(false);
    }
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-600">
          Checking access…
        </main>
      </div>
    );
  }
  if (!isAdmin) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.display_name.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
    : users;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-gray-600 hover:text-blue-900 mb-2"
          >
            ← Admin Console
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
            Users
          </h1>
          <p className="text-sm text-gray-600">
            Showing {filtered.length} of {users.length} profiles
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No users found.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg divide-y">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-blue-900 truncate">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {roleLabel(u.role)}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 flex-shrink-0">
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}