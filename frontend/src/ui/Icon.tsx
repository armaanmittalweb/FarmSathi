/** A small, consistent icon set: 24px grid, 2px round strokes, drawn for this app. Always paired with a word. */
const P: Record<string, string> = {
  ask: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5.5 11a6.5 6.5 0 0 0 13 0 M12 17.5V21 M8.5 21h7',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5.5 11a6.5 6.5 0 0 0 13 0 M12 17.5V21 M8.5 21h7',
  leaf: 'M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z M5 19l8-8',
  soil: 'M3 15h18 M3 19h18 M12 15V9 M12 9c0-2.8 2-4.5 5-4.5 0 2.8-2 4.5-5 4.5Z M12 11c0-2.2-1.6-3.5-4-3.5 0 2.2 1.6 3.5 4 3.5Z',
  weather: 'M8 6.5V4 M3.6 8.3 5.3 9.5 M12.4 8.3l-1.7 1.2 M4.5 13.5a3.5 3.5 0 1 1 6.7-1.6 M9 19h9a3 3 0 0 0 .5-6 4.5 4.5 0 0 0-8.7 1A2.5 2.5 0 0 0 9 19Z',
  schemes: 'M7 3h7l4 4v14H7Z M14 3v4h4 M10 11h5 M10 14.5h5 M10 18h3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  send: 'M4 12 20 4l-4 16-4-7-8-1Z M12 13l8-9',
  speaker: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4Z M15.5 9a4 4 0 0 1 0 6 M18 6.5a7.5 7.5 0 0 1 0 11',
  stop: 'M7 7h10v10H7Z',
  camera: 'M4 8h3l1.5-2.5h7L17 8h3v11H4Z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  image: 'M4 5h16v14H4Z M4 16l4.5-4.5 4 4 2.5-2.5L20 18 M15.5 9.5h.01',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z M15.5 15.5 20 20',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  back: 'M15 5 8 12l7 7',
  forward: 'M9 5l7 7-7 7',
  check: 'M5 12.5 10 17.5 19 7',
  warn: 'M12 4 2.8 19.5h18.4Z M12 10v4.5 M12 17.2v.01',
  offline: 'M3 3l18 18 M8.5 16.5a5 5 0 0 1 7 0 M5 12.8a10 10 0 0 1 4.2-2.4 M19 12.8a10 10 0 0 0-2.6-1.8 M2 9.2a14.5 14.5 0 0 1 4.3-2.7 M22 9.2A14.5 14.5 0 0 0 11 5.6 M12 20h.01',
  download: 'M12 4v11 M7 10.5l5 5 5-5 M5 20h14',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  close: 'M6 6l12 12 M18 6 6 18',
  plus: 'M12 5v14 M5 12h14',
  wind: 'M3 9h11a3 3 0 1 0-3-3 M3 13h15a3 3 0 1 1-3 3 M3 17h7',
  drop: 'M12 3.5S6 10 6 14a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5Z',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
  cloud: 'M7 18.5h10a4 4 0 0 0 .7-7.9A5.5 5.5 0 0 0 7.1 11 3.8 3.8 0 0 0 7 18.5Z',
  rain: 'M7 14.5h10a4 4 0 0 0 .7-7.9A5.5 5.5 0 0 0 7.1 7 3.8 3.8 0 0 0 7 14.5Z M8 17.5l-1 2.5 M12 17.5l-1 2.5 M16 17.5l-1 2.5',
  thunder: 'M7 14.5h10a4 4 0 0 0 .7-7.9A5.5 5.5 0 0 0 7.1 7 3.8 3.8 0 0 0 7 14.5Z M12.5 13l-2 4h3l-2 4',
  fog: 'M4 9h16 M6 13h12 M4 17h16',
  thermo: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z M12 9v7',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  chat: 'M5 5h14v10H10l-5 4Z',
  trash: 'M5 7h14 M9.5 7V4.5h5V7 M7 7l1 13h8l1-13',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v6 M12 7.5v.01',
  shield: 'M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6Z M9 12l2 2 4-4',
  phone: 'M8 3h8v18H8Z M11 18h2',
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 24, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : 'icon'} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  );
}

export function weatherIcon(code: number): IconName {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 95) return 'thunder';
  if (code >= 51) return 'rain';
  return 'cloud';
}
