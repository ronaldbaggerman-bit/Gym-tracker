// Subtle carbon-fiber SVG tile as data URI. We percent-encode the SVG so it can be used as an image URI.
const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
  <rect width='40' height='40' fill='%230e0e10' />
  <g stroke='%23161618' stroke-width='1' opacity='0.15'>
    <path d='M0 10 L10 0 M10 40 L40 10 M-10 20 L20 50' />
  </g>
  <g stroke='%231a1a1c' stroke-width='1' opacity='0.08'>
    <path d='M0 30 L10 40 M-10 10 L10 30' />
  </g>
</svg>
`;

export const CARBON_SVG_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
