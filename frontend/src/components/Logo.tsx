interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
}

export default function Logo({ className = "h-12 w-12" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EduMarket Zambia logo"
    >
      {/* Graduation cap (top) */}
      <path d="M 28 24 L 50 13 L 72 24 L 50 35 Z" fill="#1e3a8a" />
      <path d="M 28 24 L 50 13 L 50 35 Z" fill="#1e40af" />
      <rect x="49" y="24" width="2" height="14" fill="#1e3a8a" />
      <circle cx="50" cy="40" r="3.5" fill="#eab308" />

      {/* Open book — left page (blue) */}
      <path
        d="M 14 48 Q 14 44 50 48 L 50 82 Q 14 78 14 74 Z"
        fill="#1e3a8a"
      />
      {/* Open book — right page (green) */}
      <path
        d="M 86 48 Q 86 44 50 48 L 50 82 Q 86 78 86 74 Z"
        fill="#15803d"
      />
      {/* Center spine line */}
      <line x1="50" y1="48" x2="50" y2="82" stroke="#fefce8" strokeWidth="1.5" />

      {/* Yellow bookmark accent */}
      <path d="M 44 48 L 56 48 L 56 68 L 50 63 L 44 68 Z" fill="#eab308" />

      {/* Tiny leaf accents on right page (green) */}
      <path d="M 60 58 Q 66 54 70 58 Q 66 62 60 62 Z" fill="#fefce8" opacity="0.7" />
      <path d="M 60 66 Q 66 62 72 66 Q 66 70 60 70 Z" fill="#fefce8" opacity="0.7" />
    </svg>
  );
}