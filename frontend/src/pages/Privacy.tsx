import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Privacy() {
  const lastUpdated = "September 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header — no logged-in menu */}
      <header className="bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white shadow-md">
        <div className="h-1 bg-[#eab308]" />
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
              <Logo className="h-8 w-8" />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">
                EduMarket <span className="text-[#eab308]">Zambia</span>
              </div>
              <div className="text-[10px] font-semibold tracking-[0.15em] text-[#eab308]">
                LEARN • TEACH • CONNECT
              </div>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-sm px-3 py-1.5 bg-[#eab308] text-blue-900 rounded-md font-medium hover:bg-yellow-300 transition"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8">
          <div className="text-xs font-semibold text-yellow-600 tracking-widest mb-1">
            PRIVACY
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated} · Version 1.0
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8 space-y-8 text-gray-800 leading-relaxed">
          {/* Intro */}
          <section>
            <p className="mb-3">
              EduMarket Zambia is an inclusive communication platform for
              education, community, and business use in Zambia. This policy
              explains what we collect, why, who can see it, how long we keep
              it, and what rights you have.
            </p>
            <p>
              We designed this platform to align with the principles of the{" "}
              <strong>Zambian Data Protection Act, 2021</strong>. We do not
              claim any government certification. If you believe we are not
              meeting the standards of that Act, please contact us using the
              details at the end of this page.
            </p>
          </section>

          {/* What we collect */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              1. What we collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information:</strong> your email address, a
                display name you choose, and your role (for example teacher,
                student, business owner).
              </li>
              <li>
                <strong>Session information:</strong> the sessions and
                conversations you create or join, including a six-character
                join code and timestamps.
              </li>
              <li>
                <strong>Messages and captions:</strong> text you type and
                captions generated from speech. These are stored to keep the
                conversation history available to session participants.
              </li>
              <li>
                <strong>Voice audio (temporary):</strong> when a hearing user
                speaks, short audio clips are sent to our server to be
                converted into text captions. In the current version, audio
                clips are <strong>not stored</strong> — they are processed and
                discarded immediately.
              </li>
              <li>
                <strong>Business information</strong> (if you register one):
                business name, category, location, and optional description.
              </li>
              <li>
                <strong>Basic technical data:</strong> error logs that help us
                fix bugs. We do not use third-party analytics trackers.
              </li>
            </ul>
          </section>

          {/* What we do not do */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              2. What we do not do
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not sell your data.</li>
              <li>
                We do not store audio recordings after transcription is
                complete.
              </li>
              <li>
                We do not use your messages or captions to train AI models
                without your explicit consent.
              </li>
              <li>
                We do not show ads, and we do not embed third-party
                advertising trackers.
              </li>
              <li>
                We do not require you to disclose a disability to use
                accessibility features.
              </li>
            </ul>
          </section>

          {/* Who can see what */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              3. Who can see your information
            </h2>
            <p className="mb-3">
              Access to your data is controlled at the database level using
              row-level security. In practice, this means:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Messages and captions</strong> are visible only to
                participants of that specific session.
              </li>
              <li>
                <strong>Education sessions</strong> are visible to their
                creator and participants.
              </li>
              <li>
                <strong>Business QR conversations</strong> are visible only to
                the customer who started them and to staff of that business.
                Customers cannot see each other&apos;s conversations.
              </li>
              <li>
                <strong>Your profile</strong> is visible to you. Other users
                cannot browse profiles.
              </li>
              <li>
                <strong>Business listings</strong> (name, category, location,
                description) are public so people can discover them in the
                Places directory.
              </li>
            </ul>
          </section>

          {/* Minors */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              4. Students and minors
            </h2>
            <p className="mb-3">
              Many users of this platform are school students who may be under
              18. We treat their data with extra care:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Accounts for minors should be created with the knowledge and
                consent of a parent, guardian, or school administrator.
              </li>
              <li>
                Transcripts of classroom sessions are intended for use during
                the lesson. We do not sell or share them with third parties.
              </li>
              <li>
                If you are a parent or guardian and wish to review, correct, or
                delete your child&apos;s data, contact us using the details
                below.
              </li>
            </ul>
          </section>

          {/* Retention */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              5. How long we keep things
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account:</strong> kept while your account is active.
              </li>
              <li>
                <strong>Messages and captions:</strong> kept while the session
                exists. You can delete a session you created from your
                dashboard, which removes all its messages.
              </li>
              <li>
                <strong>Audio clips:</strong> not retained — deleted after
                transcription.
              </li>
              <li>
                <strong>Business listings:</strong> kept while the business is
                active. Owners can delete their business at any time.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              During a pilot deployment, we may apply shorter retention
              policies (for example, auto-deleting sessions after 30 days).
              Such changes will be shown on this page.
            </p>
          </section>

          {/* Your rights */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              6. Your rights
            </h2>
            <p className="mb-3">Under the Zambian Data Protection Act, 2021, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct data that is inaccurate.</li>
              <li>
                Request deletion of your data (some data may need to be
                retained for legal or safeguarding reasons).
              </li>
              <li>Object to certain processing.</li>
              <li>
                Lodge a complaint with the Data Protection Commissioner of
                Zambia.
              </li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us using the details at the
              end of this page.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              7. Security
            </h2>
            <p>
              We use industry-standard encryption in transit (HTTPS) and
              rely on managed infrastructure providers for encryption at rest.
              Access to data is restricted by role. Passwords are handled by
              our authentication provider and are never stored in plain text.
              No system is perfect; if you believe your account has been
              compromised, contact us immediately.
            </p>
          </section>

          {/* Sharing */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              8. Third-party services
            </h2>
            <p className="mb-3">
              We rely on the following service categories to operate:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Managed database and authentication</strong> (Supabase)
                — hosts account data, sessions, and messages.
              </li>
              <li>
                <strong>Server infrastructure</strong> for speech-to-text and
                text-to-speech processing.
              </li>
              <li>
                <strong>Optional AI providers</strong> for transcript
                summarisation and language assistance, used only when those
                features are active.
              </li>
            </ul>
            <p className="mt-3">
              We choose providers that meet reasonable security and privacy
              standards. We do not share your data for marketing purposes.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              9. Changes to this policy
            </h2>
            <p>
              We may update this policy as the platform evolves. When we make
              material changes, we will update the &quot;Last updated&quot;
              date at the top and, where appropriate, notify you within the
              app.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-blue-900 mb-3">
              10. Contact us
            </h2>
            <p className="mb-3">
              If you have questions, requests, or concerns about how your data
              is handled:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Email:{" "}
                <a
                  href="mailto:privacy@edumarket.zm"
                  className="text-blue-900 underline"
                >
                  privacy@edumarket.zm
                </a>{" "}
                <span className="text-xs text-gray-500">
                  (placeholder — update before launch)
                </span>
              </li>
              <li>Organisation: EduMarket Zambia</li>
              <li>Location: Lusaka, Zambia</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              You also have the right to contact the Data Protection
              Commissioner of Zambia directly.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-blue-900 hover:underline font-medium"
          >
            ← Back to EduMarket Zambia
          </Link>
        </div>
      </main>
    </div>
  );
}