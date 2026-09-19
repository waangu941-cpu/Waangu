import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkIsPlatformAdmin,
  listAllZslResources,
  updateZslResource,
  createZslResource,
  deleteZslResource,
} from "../services/admin.service";
import { useToast } from "../hooks/useToast";
import Header from "../components/Header";
import type { ZslResource } from "../services/zsl.service";

export default function AdminZsl() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resources, setResources] = useState<ZslResource[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editVerifiedBy, setEditVerifiedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New category form
  const [showNew, setShowNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    async function check() {
      const ok = await checkIsPlatformAdmin();
      if (!ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      await load();
      setChecking(false);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function load() {
    try {
      const rows = await listAllZslResources();
      setResources(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content.");
    }
  }

  function startEdit(r: ZslResource) {
    setEditingId(r.id);
    setEditLabel(r.label);
    setEditDescription(r.description ?? "");
    setEditVideoUrl(r.video_url ?? "");
    setEditVerifiedBy(r.verified_by ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(r: ZslResource) {
    setError(null);
    setSaving(true);
    try {
      const markingVerified =
        r.verification_status !== "verified" && editVideoUrl.trim() !== "";

      await updateZslResource({
        id: r.id,
        label: editLabel.trim(),
        description: editDescription.trim() || undefined,
        video_url: editVideoUrl.trim() || undefined,
        verified_by: editVerifiedBy.trim() || undefined,
        verification_status: markingVerified ? "verified" : undefined,
      });

      push(
        markingVerified
          ? "Content verified. It's now visible to all users."
          : "Content updated.",
        "success"
      );
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function markInReview(r: ZslResource) {
    setSaving(true);
    try {
      await updateZslResource({ id: r.id, verification_status: "in_review" });
      push("Marked as in review.", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setSaving(false);
    }
  }

  async function unmarkVerified(r: ZslResource) {
    if (!window.confirm("Reset to placeholder? The video URL will be kept but hidden.")) return;
    setSaving(true);
    try {
      await updateZslResource({ id: r.id, verification_status: "placeholder" });
      push("Reset to placeholder.", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: ZslResource) {
    if (!window.confirm(`Delete "${r.label}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteZslResource(r.id);
      push("Deleted.", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim() || !newLabel.trim()) return;
    setSaving(true);
    try {
      await createZslResource({
        category: newCategory.trim(),
        label: newLabel.trim(),
        description: newDescription.trim(),
      });
      push("Category added.", "success");
      setNewCategory("");
      setNewLabel("");
      setNewDescription("");
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create.");
    } finally {
      setSaving(false);
    }
  }

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

  const verifiedCount = resources.filter(
    (r) => r.verification_status === "verified"
  ).length;
  const reviewCount = resources.filter(
    (r) => r.verification_status === "in_review"
  ).length;
  const placeholderCount = resources.filter(
    (r) => r.verification_status === "placeholder"
  ).length;

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
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] text-yellow-600 mb-1">
                ZAMBIAN SIGN LANGUAGE
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
                ZSL Content
              </h1>
            </div>
            <button
              onClick={() => setShowNew((v) => !v)}
              className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition"
            >
              {showNew ? "Cancel" : "+ Add category"}
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
              {verifiedCount} verified
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
              {reviewCount} in review
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              {placeholderCount} placeholder
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Warning about verification */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-xs text-yellow-900">
          <strong>Reminder:</strong> only mark content as <em>verified</em>{" "}
          after it has been reviewed with Deaf Zambian signers or a qualified
          ZSL interpreter. Add the name of the verifier and a link to the
          reference video.
        </div>

        {/* New category form */}
        {showNew && (
          <form
            onSubmit={handleCreate}
            className="bg-white shadow-sm rounded-lg p-5 mb-6 space-y-3"
          >
            <h2 className="font-semibold text-blue-900">Add a category</h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Greetings"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Hello / Good morning"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Short description"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add"}
            </button>
          </form>
        )}

        {/* Resource list */}
        <div className="space-y-3">
          {resources.map((r) => {
            const isEditing = editingId === r.id;
            const statusStyles: Record<string, string> = {
              verified: "border-green-700",
              in_review: "border-yellow-400",
              placeholder: "border-gray-300",
            };
            return (
              <div
                key={r.id}
                className={`bg-white shadow-sm rounded-lg p-4 border-l-4 ${statusStyles[r.verification_status]}`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Video URL (must be a stable, publicly accessible link)
                      </label>
                      <input
                        type="url"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Verified by (name of Deaf signer or interpreter)
                      </label>
                      <input
                        type="text"
                        value={editVerifiedBy}
                        onChange={(e) => setEditVerifiedBy(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name or organisation"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(r)}
                        disabled={saving}
                        className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-700 px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="ml-auto text-red-600 px-3 py-2 rounded-md text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 pt-1">
                      Saving with a video URL and existing verification status
                      will mark this as <strong>verified</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-yellow-700 tracking-widest mb-0.5">
                        {r.category.toUpperCase()}
                      </div>
                      <p className="font-medium text-blue-900 truncate">
                        {r.label}
                      </p>
                      {r.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {r.description}
                        </p>
                      )}
                      {r.video_url && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          🔗 {r.video_url}
                        </p>
                      )}
                      {r.verification_status === "verified" &&
                        r.verified_by && (
                          <p className="text-[11px] text-green-700 mt-0.5">
                            ✓ Verified by {r.verified_by}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {r.verification_status === "verified" ? (
                        <button
                          onClick={() => unmarkVerified(r)}
                          disabled={saving}
                          className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md"
                        >
                          Unverify
                        </button>
                      ) : r.verification_status === "in_review" ? (
                        <button
                          onClick={() => startEdit(r)}
                          className="text-xs px-3 py-1.5 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800"
                        >
                          Add video
                        </button>
                      ) : (
                        <button
                          onClick={() => markInReview(r)}
                          disabled={saving}
                          className="text-xs px-3 py-1.5 text-yellow-800 border border-yellow-300 rounded-md hover:bg-yellow-50"
                        >
                          Mark in review
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(r)}
                        className="text-xs px-3 py-1.5 text-blue-900 border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}