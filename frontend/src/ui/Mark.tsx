/** The FarmSaathi mark: a stem and two leaves, drawn for the app rather than borrowed from an emoji. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M12 21V11" stroke="var(--moss-700)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 11c0-5 5-6 7-8 0 5-3 8-7 8Z" fill="var(--moss-500)" />
      <path d="M12 14.5c0-3.5-3.5-4.5-5-6 0 4 2.5 6 5 6Z" fill="var(--moss-300)" />
    </svg>
  );
}

const PETALS = [
  { angle: -55, rx: 78, ry: 30, fill: 'var(--moss-200)' },
  { angle: -20, rx: 92, ry: 34, fill: 'var(--moss-400)' },
  { angle: 15, rx: 88, ry: 32, fill: 'var(--moss-500)' },
  { angle: 50, rx: 70, ry: 26, fill: 'var(--moss-300)' },
  { angle: 85, rx: 60, ry: 22, fill: 'var(--moss-600)' },
];

/** The hero drawing: the mark's leaves at a larger scale, so the page and the logo read as one system. */
export function FarmIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <circle cx="200" cy="200" r="170" fill="var(--sand-100)" />
      <circle cx="120" cy="90" r="6" fill="var(--clay-300)" />
      <circle cx="320" cy="150" r="4" fill="var(--moss-300)" />
      <circle cx="80" cy="290" r="5" fill="var(--clay-200)" />
      <line x1="200" y1="330" x2="200" y2="215" stroke="var(--moss-700)" strokeWidth="3" strokeLinecap="round" />
      {PETALS.map((p) => (
        <ellipse key={p.angle} cx="200" cy="210" rx={p.rx} ry={p.ry} fill={p.fill} transform={`rotate(${p.angle} 200 210)`} />
      ))}
      <circle cx="200" cy="210" r="14" fill="var(--clay)" />
    </svg>
  );
}
