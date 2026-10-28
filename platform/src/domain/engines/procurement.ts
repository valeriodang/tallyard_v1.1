// Specification v2 and the client's procurement pack (round 3, BRIEF section 15.7): each reuse clause in the FCRBE
// factsheet 12 structure, the clause library filled from the pack, the award weightings, and the schedule of
// reclaimed and new unit prices with a provisional sum. Pure: amounts are rounded to pence as each is made.
import type { FamilyId } from '../types'
import type { AwardCriterion, SpecClauseField, SpecClauseV2, SupplyRoute, TargetUnit } from '../procurementTypes'
import { FAMILIES } from '../reference/families'
import { GRADING } from '../reference/grading'
import { ROUTE_LABELS, SPEC_DEFAULTS } from '../reference/procurement'
import { roundPence, sumPence } from '../money'

export type ClauseRow = { field: SpecClauseField | 'route' | 'surplus' | 'storage' | 'marking'; label: string; value: string; edited: boolean }

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`

/** A reuse clause's rows: the architect's entries where made, else text generated from the family's guides. */
export function specClauseRows(family: FamilyId, own: SpecClauseV2 | undefined, defaultRoute: SupplyRoute): ClauseRow[] {
  const o = own ?? {}
  const g = GRADING[family]
  const d = SPEC_DEFAULTS[family]
  const label = FAMILIES[family].label.toLowerCase()
  const text = (field: SpecClauseField, generated: string): ClauseRow => ({ field, label: FIELD_LABELS[field], value: o[field]?.trim() ? o[field]!.trim() : generated, edited: !!o[field]?.trim() })
  const surplus = o.surplusShare ?? g.surplusShare
  return [
    { field: 'route', label: 'Supply route', value: ROUTE_LABELS[o.route ?? defaultRoute], edited: o.route !== undefined },
    text('location', 'To be confirmed on the drawings.'),
    text('tolerances', d.tolerances),
    text('patina', d.patina),
    text('operations', d.operations),
    text('acceptance', `Accept against: ${g.checks.map((c) => lowerFirst(c.label)).join('; ')}. Reject: ${g.rejects.map((r) => lowerFirst(r.label)).join('; ')}.`),
    { field: 'surplus', label: 'Surplus for repairs', value: surplus > 0 ? `${pct(surplus)} over the quantity needed` : 'None', edited: o.surplusShare !== undefined },
    { field: 'storage', label: 'Storage', value: g.storage, edited: false },
    text('fallback', `New ${label} of the same performance, where the reclaimed items cannot be obtained within the estimated price range.`),
    { field: 'marking', label: 'Marking', value: 'CE or UKCA marking is asked of new products only. Reclaimed items are accepted on the evidence in this clause.', edited: false },
  ]
}

export const FIELD_LABELS: Record<SpecClauseField, string> = {
  location: 'Location',
  tolerances: 'Ranges and tolerances',
  patina: 'Accepted patina',
  operations: 'Operations on this batch',
  acceptance: 'Acceptance',
  fallback: 'New fallback',
}

function lowerFirst(s: string): string {
  // Keep acronyms and standards as written: lower only a capital followed by a lower-case letter.
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s
}

export type ClauseFill = { targetShare: number; unit: TargetUnit; reviewCap: number; provisionalShare: number }

/** A library clause with its placeholders filled. */
export function fillClause(text: string, f: ClauseFill): string {
  return text
    .replace('{target}', `at least ${pct(f.targetShare)}`)
    .replace('{unit}', f.unit === 'value' ? 'by value' : 'by mass')
    .replace('{reviewCap}', pct(f.reviewCap))
    .replace('{provisional}', pct(f.provisionalShare))
}

/** The first problem with the award weightings, or null: whole numbers from 0 to 100, totalling 100, with a reuse criterion. */
export function awardProblem(criteria: AwardCriterion[]): string | null {
  if (criteria.length === 0) return 'Add at least one criterion.'
  if (criteria.some((c) => !Number.isInteger(c.weight) || c.weight < 0 || c.weight > 100)) return 'Give each weight as a whole number from 0 to 100.'
  if (criteria.some((c) => !c.label.trim())) return 'Name each criterion.'
  const total = criteria.reduce((s, c) => s + c.weight, 0)
  if (total !== 100) return `The weights add up to ${total}. They must add up to 100.`
  if (!criteria.some((c) => c.reuse && c.weight > 0)) return 'Give reuse a weight in at least one criterion: the toolkit asks for a reuse criterion in every contract.'
  return null
}

export function reuseWeight(criteria: AwardCriterion[]): number {
  return criteria.filter((c) => c.reuse).reduce((s, c) => s + c.weight, 0)
}

export type PriceInput = { publicId: string; title: string; family: FamilyId; units: number; unitLabel: string; low: number; high: number; guide: number }

export type PriceRow = PriceInput & { newPrice: number; reclaimedLow: number; reclaimedHigh: number; reclaimedGuide: number; newCost: number }

export type PriceSchedule = { rows: PriceRow[]; reclaimedLow: number; reclaimedHigh: number; reclaimedGuide: number; newCost: number; provisional: number }

/** The schedule of reclaimed and new unit prices, the estimated price range and a provisional sum on the guide total. */
export function priceSchedule(items: PriceInput[], provisionalShare: number): PriceSchedule {
  const rows = items.map((i) => {
    const newPrice = FAMILIES[i.family].newPrice
    return { ...i, newPrice, reclaimedLow: roundPence(i.units * i.low), reclaimedHigh: roundPence(i.units * i.high), reclaimedGuide: roundPence(i.units * i.guide), newCost: roundPence(i.units * newPrice) }
  })
  const reclaimedGuide = sumPence(rows.map((r) => r.reclaimedGuide))
  return {
    rows,
    reclaimedLow: sumPence(rows.map((r) => r.reclaimedLow)),
    reclaimedHigh: sumPence(rows.map((r) => r.reclaimedHigh)),
    reclaimedGuide,
    newCost: sumPence(rows.map((r) => r.newCost)),
    provisional: roundPence(reclaimedGuide * provisionalShare),
  }
}
