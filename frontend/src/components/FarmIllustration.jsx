/**
 * Abstract botanical mark built from simple rotated ellipses — deliberately
 * not a literal "farmer in a field" stock illustration. Echoes the Logo
 * mark's leaf shapes at a larger scale so the brand feels systematic
 * rather than a logo plus an unrelated hero graphic bolted on.
 */
export default function FarmIllustration({ className = "" }) {
  const petals = [
    { angle: -55, rx: 78, ry: 30, cx: 200, cy: 210, className: "fill-moss-200" },
    { angle: -20, rx: 92, ry: 34, cx: 200, cy: 210, className: "fill-moss-400" },
    { angle: 15, rx: 88, ry: 32, cx: 200, cy: 210, className: "fill-moss-500" },
    { angle: 50, rx: 70, ry: 26, cx: 200, cy: 210, className: "fill-moss-300" },
    { angle: 85, rx: 60, ry: 22, cx: 200, cy: 210, className: "fill-moss-600" },
  ];

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <circle cx="200" cy="200" r="170" className="fill-sand-100" />
      <circle cx="120" cy="90" r="6" className="fill-clay-300" />
      <circle cx="320" cy="150" r="4" className="fill-moss-300" />
      <circle cx="80" cy="290" r="5" className="fill-clay-200" />

      <line x1="200" y1="330" x2="200" y2="215" stroke="currentColor" className="text-moss-700" strokeWidth="3" strokeLinecap="round" />

      {petals.map((p, i) => (
        <ellipse
          key={i}
          cx={p.cx}
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          className={p.className}
          transform={`rotate(${p.angle} ${p.cx} ${p.cy})`}
        />
      ))}

      <circle cx="200" cy="210" r="14" className="fill-clay-500" />
    </svg>
  );
}
