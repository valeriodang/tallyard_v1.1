// The tested-for-reuse label (round 3, BRIEF section 15.5): a printable tag, like an electrical safety test label,
// for an item that has reached a tested or certified status. It carries only what a listing shows: the public ID, the
// title, the status, the steel codes, the tester and the date. Pure: it returns the SVG text.

export type LabelInput = {
  publicId: string
  title: string
  statusText: string
  /** For steel, the provenance and assessment codes, like "P1, S3". */
  codes: string | null
  tester: string
  testedOnText: string
  /** The address the label points to, shown under the ID. */
  path: string
}

const W = 360
const H = 200

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Shortens text to fit a line of the label, ending on a whole word where it can. */
export function fitLine(s: string, max: number): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  // The cut already ends a word when the next character is a space.
  if (s[max - 1] === ' ') return `${cut.trimEnd()}...`
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}...`
}

export function reuseLabelSvg(x: LabelInput): string {
  const line = (y: number, text: string, size: number, weight = 400, fill = '#1c1917') => `<text x="20" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(text)}</text>`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`Tested for reuse, ${x.publicId}`)}">`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="#ffffff" stroke="#1f6b4f" stroke-width="2"/>`,
    `<rect x="1" y="1" width="${W - 2}" height="40" rx="10" fill="#1f6b4f"/>`,
    `<rect x="1" y="30" width="${W - 2}" height="11" fill="#1f6b4f"/>`,
    line(27, 'Tested for reuse', 16, 700, '#ffffff'),
    line(68, x.publicId, 22, 700),
    line(86, x.path, 11, 400, '#57534e'),
    line(110, fitLine(x.title, 46), 13, 500),
    line(132, fitLine(x.codes ? `${x.statusText}, ${x.codes}` : x.statusText, 46), 13),
    line(154, fitLine(`Tested by ${x.tester}`, 50), 12, 400, '#44403c'),
    line(174, `On ${x.testedOnText}`, 12, 400, '#44403c'),
    `<text x="${W - 20}" y="174" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="11" fill="#78716c">Tallyard</text>`,
    '</svg>',
  ].join('')
}
