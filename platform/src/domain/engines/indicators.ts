// The indicators panel (round 3, BRIEF section 15.8): reuse by mass in each building layer against the reuse
// toolkit's bands, the whole building against the conventional range, and the Level(s) 2.4 score of the new
// building's end of life under the statement's RICS scenario. Indicative, from the project's own bill.
import type { BillLine } from '../types'
import { CONVENTIONAL_REUSE_BY_MASS, LAYER_TARGET_BANDS } from '../reference/fcrbe'
import { splitCircularity } from './eol'
import type { BomRow } from './ces'

/** The toolkit layer each of the bill's layers falls in. Services sit outside the toolkit's bands. */
export const BILL_LAYER_BANDS: Record<string, string> = { Substructure: 'structure', Superstructure: 'structure', 'Shell/Skin': 'skin', Space: 'space_plan' }

export type BandPosition = 'below' | 'within' | 'above'

export function bandPosition(share: number, low: number, high: number): BandPosition {
  return share < low ? 'below' : share > high ? 'above' : 'within'
}

type ReusedLine = { line: BillLine; reusedPercent: number }

export type LayerIndicator = { id: string; label: string; reusedT: number; totalT: number; share: number; low: number; high: number; position: BandPosition }

/** Reuse by mass for each toolkit layer the bill has mass in, against its band. */
export function layerReuse(lines: ReusedLine[]): LayerIndicator[] {
  const out: LayerIndicator[] = []
  for (const b of LAYER_TARGET_BANDS) {
    const mine = lines.filter((l) => BILL_LAYER_BANDS[l.line.layer] === b.id)
    const totalT = mine.reduce((s, l) => s + l.line.massT, 0)
    if (totalT <= 0) continue
    const reusedT = mine.reduce((s, l) => s + l.line.massT * l.reusedPercent, 0)
    const share = reusedT / totalT
    out.push({ id: b.id, label: b.layer, reusedT, totalT, share, low: b.low, high: b.high, position: bandPosition(share, b.low, b.high) })
  }
  return out
}

/** Reuse by mass across the whole bill, against the range the toolkit found in conventional buildings. */
export function wholeReuse(lines: ReusedLine[]): { reusedT: number; totalT: number; share: number | null; position: BandPosition | null } {
  const totalT = lines.reduce((s, l) => s + l.line.massT, 0)
  const reusedT = lines.reduce((s, l) => s + l.line.massT * l.reusedPercent, 0)
  if (totalT <= 0) return { reusedT, totalT, share: null, position: null }
  const share = reusedT / totalT
  return { reusedT, totalT, share, position: bandPosition(share, CONVENTIONAL_REUSE_BY_MASS.low, CONVENTIONAL_REUSE_BY_MASS.high) }
}

/** The Level(s) 2.4 score of the bill's end of life: each line's split weighted by its mass. Null with no mass. */
export function endOfLifeScore(rows: Pick<BomRow, 'massT' | 'eol' | 'eolMaterial'>[]): number | null {
  const total = rows.reduce((s, r) => s + r.massT, 0)
  if (total <= 0) return null
  return rows.reduce((s, r) => s + r.massT * splitCircularity(r.eol, r.eolMaterial), 0) / total
}
