// Hand-drawn-style doodles. They all use currentColor, so they follow the red theme.
// The "wobble" filter roughens straight lines so they look sketched with a pen.
const svg = (cls, viewBox, inner) =>
  `<svg class="doodle ${cls}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g filter="url(#wobble)">${inner}</g></svg>`;

export const doodles = {
  filters: `<svg width="0" height="0" style="position:absolute"><defs>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
  </defs></svg>`,

  // shop logo: a hanger with a price tag dangling off it
  logo: svg('logo-mark', '0 0 80 64', `
    <path d="M40 14c0-5 4-8 8-6s3 7-1 9l-7 5"/>
    <path d="M40 22L6 44c-3 2-2 5 2 5h64c4 0 5-3 2-5L40 22"/>
    <path d="M52 49l2 10 10-3-3-8"/>
    <circle cx="58" cy="54" r="1.2"/>`),

  hanger: svg('hanger', '0 0 120 90', `
    <path d="M60 20c0-7 5-11 11-9s5 10-1 13l-10 7"/>
    <path d="M60 31L10 62c-4 3-3 7 3 7h94c6 0 7-4 3-7L60 31"/>
    <path d="M30 80c10-4 20 4 30 0s20-4 30 0"/>`),

  bag: svg('bag', '0 0 100 110', `
    <path d="M18 36h64l-5 64H23z"/>
    <path d="M36 44V28c0-10 6-16 14-16s14 6 14 16v16"/>
    <path d="M40 66c3 4 17 4 20 0"/>
    <circle cx="40" cy="56" r="1.5"/><circle cx="60" cy="56" r="1.5"/>`),

  sweater: svg('sweater', '0 0 120 100', `
    <path d="M42 12c4 6 32 6 36 0l22 10 14 30-14 6-6-12v48H26V46l-6 12-14-6 14-30z"/>
    <path d="M44 12c4 10 28 10 32 0"/>
    <path d="M40 60h40M40 72h40M40 84h40" stroke-dasharray="3 5"/>`),

  star: svg('star', '0 0 60 60', `
    <path d="M30 6l6 17 18 1-14 11 5 18-15-10-15 10 5-18L6 24l18-1z"/>`),

  squiggle: svg('squiggle', '0 0 200 20', `
    <path d="M4 12c12-10 20 8 32 0s20-10 32 0 20 8 32 0 20-10 32 0 20 8 32 0 20-8 28-2"/>`),

  arrow: svg('arrow', '0 0 40 24', `
    <path d="M3 16c8-10 20-12 32-4"/><path d="M28 6l7 6-8 4"/>`),
};
