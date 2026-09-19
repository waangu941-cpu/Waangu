import Logo from "./Logo";

interface BrandPanelProps {
  headline?: string;
  subheadline?: string;
}

const FEATURES = [
  { icon: "💬", label: "Real-time captions" },
  { icon: "🎤", label: "Speech to text" },
  { icon: "🔊", label: "Text to speech" },
  { icon: "🏥", label: "Accessible places" },
];

const SUBJECTS = ["Chemistry", "Biology", "Physics", "Mathematics", "Projects"];

export default function BrandPanel({
  headline = "Inclusive Education for a Brighter Future",
  subheadline = "Empowering Deaf and hearing students to learn together with real-time captions and speech — built for Zambian classrooms.",
}: BrandPanelProps) {
  return (
    <aside className="relative hidden lg:flex lg:w-3/5 overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/icon.png')" }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/95 via-[#1e40af]/85 to-[#15803d]/90"
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#eab308]/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 w-full">
        <div className="flex items-center gap-4">
          <Logo className="h-14 w-14 xl:h-16 xl:w-16" />
          <div>
            <div className="text-2xl xl:text-3xl font-bold leading-none tracking-tight drop-shadow-md">
              EduMarket <span className="text-[#eab308]">Zambia</span>
            </div>
            <div className="mt-1 text-[10px] xl:text-xs font-semibold tracking-[0.2em] text-[#eab308]">
              LEARN • TEACH • CONNECT
            </div>
          </div>
        </div>

        <div className="max-w-xl py-10">
          <h1 className="text-3xl xl:text-5xl font-bold leading-tight mb-4 drop-shadow-lg">
            {headline.split(" ").map((word, i) =>
              /brighter|future|Movement/i.test(word) ? (
                <span key={i} className="text-[#eab308]">
                  {word}{" "}
                </span>
              ) : (
                <span key={i}>{word} </span>
              )
            )}
          </h1>
          <p className="text-base xl:text-lg text-blue-50 leading-relaxed drop-shadow-md">
            {subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-2 xl:gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3 xl:px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-medium shadow-sm"
              >
                <span className="text-base">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1 w-8 rounded-full bg-[#eab308]" />
            <span className="text-xs xl:text-sm font-semibold text-[#eab308] tracking-wide">
              Different Abilities, Same Dreams
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs xl:text-sm text-blue-100">
            <span className="font-medium text-white">Subjects:</span>
            {SUBJECTS.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}