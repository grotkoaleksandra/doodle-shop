// Hand-drawn-style doodles. They all use currentColor, so they follow the red theme.
// The "wobble" filter roughens straight lines so they look sketched with a pen.
const svg = (cls, viewBox, inner) =>
  `<svg class="doodle ${cls}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g filter="url(#wobble)">${inner}</g></svg>`;

export const doodles = {
  filters: `<svg width="0" height="0" style="position:absolute"><defs>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
  </defs></svg>`,

  // shop logo: a little framed picture hanging from a nail
  logo: svg('logo-mark', '0 0 80 72', `
    <circle cx="40" cy="6" r="2"/>
    <path d="M40 8L18 24M40 8l22 16"/>
    <path d="M12 24h56v44H12z"/>
    <path d="M18 30h44v32H18z"/>
    <path d="M20 58l12-14 8 9 7-6 13 11"/>
    <circle cx="50" cy="38" r="3"/>`),

  // empty / placeholder: a frame with a smile
  frame: svg('frame', '0 0 120 100', `
    <path d="M10 8h100v84H10z"/>
    <path d="M22 20h76v60H22z"/>
    <circle cx="48" cy="44" r="2"/><circle cx="72" cy="44" r="2"/>
    <path d="M46 58c6 6 22 6 28 0"/>`),

  // a print rolling off a roller
  roller: svg('roller', '0 0 120 100', `
    <path d="M14 20h72"/><circle cx="14" cy="20" r="8"/><circle cx="86" cy="20" r="8"/>
    <path d="M22 28v54h56V28"/>
    <path d="M32 70l12-16 10 10 8-8 10 14"/><circle cx="62" cy="42" r="4"/>
    <path d="M94 20h12l4 6"/>`),

  pencil: svg('pencil', '0 0 120 60', `
    <path d="M10 40L90 12l14 8-80 28z"/>
    <path d="M90 12l4 12M24 48l-4-12"/>
    <path d="M104 20l10 3-8 6"/>
    <path d="M8 54c14-6 30 4 46-2"/>`),

  star: svg('star', '0 0 60 60', `
    <path d="M30 6l6 17 18 1-14 11 5 18-15-10-15 10 5-18L6 24l18-1z"/>`),

  squiggle: svg('squiggle', '0 0 200 20', `
    <path d="M4 12c12-10 20 8 32 0s20-10 32 0 20 8 32 0 20-10 32 0 20 8 32 0 20-8 28-2"/>`),

  arrow: svg('arrow', '0 0 40 24', `
    <path d="M3 16c8-10 20-12 32-4"/><path d="M28 6l7 6-8 4"/>`),
};
