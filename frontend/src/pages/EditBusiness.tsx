import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBusiness, updateBusiness } from "../services/business.service";
import { getCurrentUser } from "../services/auth.service";
import { useToast } from "../hooks/useToast";
import Header from "../components/Header";
import type { Business } from "../types";

const CATEGORIES = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Bank",
  "Electronics",
  "Grocery",
  "Restaurant",
  "Hotel",
  "Clothing",
  "Services",
  "Education",
  "Government Office",
  "Police Station",
  "Church",
  "Mosque",
  "Temple",
  "Community Organisation",
  "NGO",
  "Other",
];

export default function EditBusiness() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const b = await getBusiness(id);
        if (!b) {
          setError("Business not found.");
          setLoading(false);
          return;
        }
        if (b.owner_id !== user.id) {
          setError("You don't have permission to edit this business.");
          setLoading(false);
          return;
        }
        setBusiness(b);
        setName(b.name);
        setLocation(b.location ?? "");
        setDescription(b.description ?? "");

        const known = CATEGORIES.includes(b.category ?? "");
        if (known) {
          setCategory(b.category ?? CATEGORIES[0]);
        } else if (b.category) {
          setCategory("Other");
          setCustomCategory(b.category);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load business.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !business) return;
    setError(null);
    setSaving(true);

    try {
      const finalCategory =
        category === "Other" && customCategory.trim()
          ? customCategory.trim()
          : category;

      await updateBusiness({
        id,
        name: name.trim(),
        category: finalCategory,
        location: location.trim(),
        description: description.trim(),
      });

      push("Business updated.", "success");
      navigate(`/business/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save changes.";
      setError(msg);
      push("Could not save changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-600">
          <div className="inline-block animate-pulse">
            <div className="text-4xl mb-2">✏️</div>
            <p>Loading business…</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Error state (couldn't load or not owner) ───────────────────────────
  if (error && !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-900 underline"
          >
            Back to dashboard
          </button>
        </main>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />

      <main className="max-w-md mx-auto px-4 py-6 sm:py-10 pb-16">
        {/* Header card */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white rounded-xl shadow-md p-5 mb-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-[#eab308] mb-1">
            EDIT BUSINESS
          </div>
          <h1 className="text-2xl font-bold leading-tight truncate">
            {business?.name}
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Update your business details.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-sm rounded-xl p-5 sm:p-6 space-y-5"
        >
          {/* Business name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Business name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
              placeholder="e.g. ABC Electronics"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {category === "Other" && (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type your category"
                className="w-full mt-2 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
              />
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
              placeholder="e.g. Lusaka"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition resize-none"
              placeholder="What does your business do?"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/business/${id}`)}
              className="w-full sm:w-auto flex-1 text-gray-700 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex-1 bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e40af] active:bg-[#1e40af] transition disabled:opacity-50 shadow-sm min-h-[48px]"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-6 text-sm text-gray-600 hover:text-blue-900 py-2"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  );
}