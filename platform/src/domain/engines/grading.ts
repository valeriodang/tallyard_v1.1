// Grading, assurance and what a buyer learns of an item's quality (round 3, BRIEF section 15.5). Pure: the store and
// the screens call these and never compute (P2).
import type { FamilyId, InventoryItem, TestStatus } from '../types'
import type { AssuranceTier, ItemQuality, PublicQuality, WarrantyKind } from '../qualityTypes'
import { FAMILIES } from '../reference/families'
import { GRADING, LAYER_NEEDS } from '../reference/grading'

export type GradingVerdict = {
  rejected: boolean
  rejectLabels: string[]
  checksDone: number
  checksTotal: number
  /** The checks still to tick, by label. */
  missing: string[]
}

export function gradingVerdict(family: FamilyId, q: ItemQuality | null | undefined): GradingVerdict {
  const g = GRADING[family]
  const rejects = new Set(q?.rejects ?? [])
  const rejectLabels = g.rejects.filter((r) => rejects.has(r.id)).map((r) => r.label)
  const done = g.checks.filter((c) => q?.checks[c.id] === true)
  return { rejected: rejectLabels.length > 0, rejectLabels, checksDone: done.length, checksTotal: g.checks.length, missing: g.checks.filter((c) => q?.checks[c.id] !== true).map((c) => c.label) }
}

/** The strongest assurance an item has: a warranty, then a test or certificate, then an inspection, else the seller's word. */
export function assuranceTier(testStatus: TestStatus, warranty: WarrantyKind): AssuranceTier {
  if (warranty !== 'none') return 'warranted'
  if (testStatus === 'tested' || testStatus === 'certified') return 'tested'
  if (testStatus === 'inspected') return 'inspected'
  return 'declared'
}

/** What the family's building layer asks for. */
export function layerNeed(family: FamilyId): AssuranceTier {
  return LAYER_NEEDS[FAMILIES[family].layer] ?? 'declared'
}

/**
 * Whether an item meets its layer's need. A warranty does not stand in for test proof in the structure, and a test
 * or a warranty is more than an inspection.
 */
export function meetsLayerNeed(need: AssuranceTier, has: { testStatus: TestStatus; warranty: WarrantyKind }): boolean {
  const tested = has.testStatus === 'tested' || has.testStatus === 'certified'
  const warranted = has.warranty !== 'none'
  if (need === 'tested') return tested
  if (need === 'warranted') return warranted
  if (need === 'inspected') return has.testStatus !== 'untested' || warranted
  return true
}

/** The quantity expected to be usable after removal, in the family's units. */
export function usableQuantity(units: number, yieldShare: number): number {
  return units * yieldShare
}

/** The quantity to order to end up with what is needed, with the family's surplus for breakage and cutting. */
export function orderQuantity(needed: number, surplusShare: number): number {
  return needed * (1 + surplusShare)
}

/** What a buyer learns of an item's quality: fixed values only, never notes, names, groups or certificate numbers. */
export function publicQualityOf(item: Pick<InventoryItem, 'testStatus' | 'quality'>): PublicQuality {
  const q = item.quality ?? null
  const warranty = q?.warranty.kind ?? 'none'
  return {
    assurance: assuranceTier(item.testStatus, warranty),
    processing: q?.processing ?? 'as_removed',
    warranty,
    steel: q?.steel ? { provenance: q.steel.provenance, assessment: q.steel.assessment } : null,
    hazards: (q?.hazards ?? []).filter((h) => h.status === 'confirmed').map((h) => h.id),
  }
}
