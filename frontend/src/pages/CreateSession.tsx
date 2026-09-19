import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createSession } from "../services/session.service";
import { getCurrentUser } from "../services/auth.service";
import Header from "../components/Header";

const SUBJECTS = [
  "Chemistry",
  "Biology",
  "Physics",
  "Mathematics",
  "General",
] as const;
type Subject = typeof SUBJECTS[number];

export default function CreateSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "community" ? "community" : "education";
  const isCommunity = mode === "community";

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("General");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const sessionId = await createSession({
        title,
        subject: isCommunity ? "General" : subject,
        session_type: mode,
        created_by: user.id,
      });

      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto mt-8 sm:mt-12 px-4 pb-16">
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">
            {isCommunity ? "Start a conversation" : "Create a session"}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isCommunity
              ? "You'll get a code to share with the other person."
              : "Start a new communication session. You'll get a code to share with your student."}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {isCommunity ? "Conversation title" : "Session title"}
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  isCommunity ? "e.g. Family chat" : "e.g. Photosynthesis introduction"
                }
              />
            </div>

            {!isCommunity && (
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading
                ? isCommunity
                  ? "Starting..."
                  : "Creating..."
                : isCommunity
                ? "Start conversation"
                : "Create session"}
            </button>
          </form>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 text-sm text-gray-600 hover:text-blue-900 py-2"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}