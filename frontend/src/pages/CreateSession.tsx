import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

const SUBJECTS = ["Chemistry", "Biology", "Physics", "Mathematics", "General"] as const;
type Subject = typeof SUBJECTS[number];

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreateSession() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("General");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      navigate("/login");
      return;
    }

   const joinCode = generateJoinCode();
const sessionId = crypto.randomUUID();

const { error: sessionError } = await supabase
  .from("sessions")
  .insert({
    id: sessionId,
    created_by: userData.user.id,
    title,
    subject,
    join_code: joinCode,
  });

if (sessionError) {
  setLoading(false);
  setError(sessionError.message);
  return;
}

// Add creator as participant
const { error: partError } = await supabase.from("session_participants").insert({
  session_id: sessionId,
  user_id: userData.user.id,
});

setLoading(false);

if (partError) {
  setError("Session created but could not add you as a participant: " + partError.message);
  return;
}

navigate(`/session/${sessionId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto mt-12 px-4 pb-16">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Create a session</h2>
          <p className="text-gray-600 text-sm mb-6">
            Start a new communication session. You'll get a code to share with your student.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Session title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Photosynthesis introduction"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-2 rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create session"}
            </button>
          </form>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 text-sm text-gray-600 hover:text-blue-900"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}