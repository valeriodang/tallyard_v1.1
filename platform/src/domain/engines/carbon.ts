// F2. Upfront carbon avoided against buying new (modules A1 to A4), simplified method. Round 3 follows the RICS
// 2nd edition: reclaimed material counts its reprocessing only, the new product travels the default distance of its
// family's transport category (Table 17), and module D stays with the donor (BRIEF section 15.2).
import type { FamilyId, InventoryItem, SourceType } from '../types'
import { FAMILIES } from '../reference/families'
import type { Assumptions } from '../reference/assumptions'
import { factorQty, itemMeasures } from './measures'
import { TRANSPORT_DEFAULTS, type TransportCategory } from '../reference/rics'

export type CarbonInputs = {
  family: FamilyId
  sourceType: SourceType
  baselineQty: number
  baselineMassT: number
  reuseQty: number
  reuseMassT: number
  reuseKm: number
}

export type CarbonResult = {
  inputs: CarbonInputs
  k: number
  factorNew: number
  factorReuse: number
  /** Road kilometres for the new product, from its transport category. */
  newKm: number
  /** Sea kilometres for the new product (zero for UK-made products). */
  newSeaKm: number
  origin: TransportCategory
  road: number
  sea: number
  a13New: number
  a4New: number
  a13Reuse: number
  a4Reuse: number
  avoided: number
  percent: number
}

export function carbonAvoided(inputs: CarbonInputs, a: Assumptions): CarbonResult | null {
  if (inputs.sourceType === 'unused_surplus') return null
  const f = FAMILIES[inputs.family]
  const k = f.factorBasis === 't' ? 1 : 0.001
  const a13New = inputs.baselineQty * f.factorNew * k
  const t = TRANSPORT_DEFAULTS[f.newOrigin]
  const newKm = f.newOrigin === 'national' ? a.newKm : t.roadKm
  const a4New = inputs.baselineMassT * (newKm * a.road + t.seaKm * a.sea)
  const a13Reuse = inputs.reuseQty * f.factorReuse * k
  const a4Reuse = inputs.reuseMassT * inputs.reuseKm * a.road
  const avoided = a13New + a4New - (a13Reuse + a4Reuse)
  const percent = avoided / (a13New + a4New)
  return { inputs, k, factorNew: f.factorNew, factorReuse: f.factorReuse, newKm, newSeaKm: t.seaKm, origin: f.newOrigin, road: a.road, sea: a.sea, a13New, a4New, a13Reuse, a4Reuse, avoided, percent }
}

/** An item or listing: baseline is the reclaimed quantity itself, at the listing distance. */
export function itemCarbon(item: InventoryItem, sourceType: SourceType, a: Assumptions, reuseKm = a.listingKm): CarbonResult | null {
  const m = itemMeasures(item)
  const qty = factorQty(item.family, m)
  return carbonAvoided({ family: item.family, sourceType, baselineQty: qty, baselineMassT: m.massT, reuseQty: qty, reuseMassT: m.massT, reuseKm }, a)
}

/** Steel from a matcher allocation: baseline is the required members, reclaimed is the allocated pieces. */
export function steelAllocationCarbon(baselineMassT: number, stockMassT: number, reuseKm: number, a: Assumptions): CarbonResult {
  const r = carbonAvoided({ family: 'steel_section', sourceType: 'deconstruction', baselineQty: baselineMassT, baselineMassT, reuseQty: stockMassT, reuseMassT: stockMassT, reuseKm }, a)
  if (!r) throw new Error('Steel always has a carbon result')
  return r
}

/** Distance for a confirmed deal via a hub: the inbound allowance plus the real hub to project distance. */
export function confirmedHubKm(kmHubToProject: number, a: Assumptions): number {
  return a.hubAllowanceKm + kmHubToProject
}
