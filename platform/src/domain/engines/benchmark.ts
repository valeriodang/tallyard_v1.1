// Where a figure sits against benchmark quartiles, and the construction waste credits it earns (round 3,
// BRIEF section 15.7). For waste and material intensity, lower is better: applicants should tend to the median
// and the lower quartile (GLA guidance, Appendix 4).
import type { Quartiles } from '../reference/gla'
import { BREEAM_WST01_BANDS, HQM_WASTE_BANDS } from '../reference/schemes'

export type QuartilePosition = 'below_lower' | 'lower_to_median' | 'median_to_upper' | 'above_upper'

export const QUARTILE_POSITION_TEXT: Record<QuartilePosition, string> = {
  below_lower: 'Better than the lower quartile',
  lower_to_median: 'Between the lower quartile and the median',
  median_to_upper: 'Between the median and the upper quartile',
  above_upper: 'Worse than the upper quartile',
}

export function quartilePosition(value: number, q: Quartiles): QuartilePosition {
  if (value < q.lower) return 'below_lower'
  if (value <= q.median) return 'lower_to_median'
  if (value <= q.upper) return 'median_to_upper'
  return 'above_upper'
}

function bandFor(value: number, bands: { credits: string; atMost: number }[]): string | null {
  let best: string | null = null
  for (const b of bands) if (value <= b.atMost) best = b.credits
  return best
}

/** BREEAM Wst 01 credits for non-hazardous construction waste in t per m2 GIA, or null when none. */
export function breeamWasteCredits(tPerM2: number): string | null {
  return bandFor(tPerM2, BREEAM_WST01_BANDS)
}

export function hqmWasteCredits(tPerM2: number): string | null {
  return bandFor(tPerM2, HQM_WASTE_BANDS)
}
