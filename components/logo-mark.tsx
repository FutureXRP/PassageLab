// PassageLab — components/logo-mark.tsx
// Brand emblem: a tall guiding star rising from an open book, inside a compass
// ring. An on-brand SVG rendition of the PassageLab mark — transparent
// background so it sits cleanly on the dark nav, and crisp at any size (favicon
// → hero). Pure presentational component (no hooks); safe in client or server.
//
// To use the exact commissioned raster artwork instead, drop the cut-out icon at
// public/logo-icon.png and replace <LogoMark/> with:
//   <img src="/logo-icon.png" width={28} height={28} alt="PassageLab" />

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PassageLab"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="plgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0D89B" />
          <stop offset="0.55" stopColor="#C9973A" />
          <stop offset="1" stopColor="#9A6E25" />
        </linearGradient>
      </defs>
      {/* compass ring */}
      <circle cx="32" cy="25" r="13" stroke="url(#plgrad)" strokeWidth="2.2" />
      {/* faint compass ticks */}
      <g stroke="url(#plgrad)" strokeWidth="1" strokeLinecap="round" opacity="0.45">
        <line x1="41.5" y1="15.5" x2="43.6" y2="13.4" />
        <line x1="22.5" y1="15.5" x2="20.4" y2="13.4" />
        <line x1="41.5" y1="34.5" x2="43.6" y2="36.6" />
        <line x1="22.5" y1="34.5" x2="20.4" y2="36.6" />
      </g>
      {/* guiding star — tall, with a long spike descending into the book */}
      <path d="M32 6 L34.6 21 L45 25 L34.6 27.5 L32 52 L29.4 27.5 L19 25 L29.4 21 Z" fill="url(#plgrad)" />
      {/* open book — fanned pages */}
      <g stroke="url(#plgrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M31 52 Q20 47 10.5 47.5" />
        <path d="M31 53.8 Q20 49 10.5 49.5" />
        <path d="M31 55.6 Q20 51 10.5 51.5" />
        <path d="M33 52 Q44 47 53.5 47.5" />
        <path d="M33 53.8 Q44 49 53.5 49.5" />
        <path d="M33 55.6 Q44 51 53.5 51.5" />
        <path d="M32 51.5 L32 56" />
      </g>
      {/* ribbon bookmark */}
      <path d="M44.5 55 L48.5 55 L48.5 62 L46.5 59.6 L44.5 62 Z" fill="url(#plgrad)" />
    </svg>
  )
}
