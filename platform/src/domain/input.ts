// Reading numbers as people type them into fields, so screens hand the store a value and never calculate (P2). Text that
// is not a number comes back as NaN, which the store's own checks refuse with their message.

const NUMBER = /^\d+(\.\d+)?$/

function numberOf(text: string): number {
  const plain = text.trim().replace(/,/g, '')
  return NUMBER.test(plain) ? Number(plain) : NaN
}

/** A percentage as typed, "35" or "35%", as a share from 0 to 1; null for an empty field. */
export function shareFromPercentText(text: string): number | null {
  const t = text.trim().replace(/%$/, '').trim()
  return t === '' ? null : numberOf(t) / 100
}

/** An amount as typed, with thousands commas allowed; null for an empty field. */
export function amountFromText(text: string): number | null {
  return text.trim() === '' ? null : numberOf(text)
}
