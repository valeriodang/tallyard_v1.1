// Grading, hazards, yield, processing, warranty and the steel pathway of an item (round 3, BRIEF section 15.5). The
// owner and the surveyor write them; the surveyor only while the lot is private, as with the grades. For steel the
// record is the source of the four statuses buyers see: saving it sets the item's test status and usable grade.
import type { ActionResult, Actor, AppData } from '../types'
import type { InventoryItem } from '../../domain/types'
import type { ItemQuality, Processing, SteelCertificate, SteelRecord, WarrantyKind } from '../../domain/qualityTypes'
import { GRADING, PROCESSING_LABELS, WARRANTY_LABELS } from '../../domain/reference/grading'
import { HAZARDS } from '../../domain/reference/audit'
import { ASSESSMENT_LABELS, PROVENANCE_LABELS } from '../../domain/reference/steelAssessment'
import { statusFrom, usableGrade } from '../../domain/engines/steelAssessment'
import { ERRORS, buildingSide, canCaptureIn } from '../access'
import { acceptedReservation, lotOfItem } from '../lots'
import { acting, clean, fail, isIsoDate, ok, withWorld } from './common'

export const QUALITY_ERRORS = {
  noItem: 'That item could not be found.',
  locked: 'This item is shared or published. The owner can still change its quality record.',
  reserved: 'This item is reserved. Its record is fixed.',
  check: 'Choose checks from the list for this material.',
  hazard: 'Choose hazards from the list.',
  share: 'Enter a yield from 0 to 100%.',
  processing: 'Choose how it has been processed.',
  warranty: 'Choose a kind of warranty.',
  years: 'Enter whole years, up to 50.',
  steelOnly: 'Only structural steel has a steel record.',
  steel: 'Choose a provenance and an assessment from the list.',
  group: 'Give the group a short name.',
  samples: 'Enter the members tested as a whole number.',
  date: 'Enter a real date.',
  certificate: 'Give the certificate number and the lab.',
} as const

export function emptyQuality(now: string): ItemQuality {
  return { checks: {}, rejects: [], hazards: [], yieldShare: null, processing: 'as_removed', warranty: { kind: 'none', years: null, note: '' }, steel: null, updatedAt: now }
}

/** The owner or the surveyor acting on an item; the surveyor only while its lot is private. */
function editor(state: AppData, actor: Actor, itemId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  const item = state.world.items[itemId]
  if (!item) return QUALITY_ERRORS.noItem
  if (!canCaptureIn(state, actor.userId, item.buildingId)) return ERRORS.noAccess
  const lot = lotOfItem(state.world, itemId)
  if (lot && acceptedReservation(state, lot.id)) return QUALITY_ERRORS.reserved
  if (buildingSide(state, actor.userId, item.buildingId) !== 'owner' && lot && lot.visibility !== 'private') return QUALITY_ERRORS.locked
  return { a, item }
}

function withItem(state: AppData, item: InventoryItem): AppData {
  const w = structuredClone(state.world)
  w.items[item.id] = item
  return withWorld(state, w)
}

export type QualityPatch = {
  checks?: Record<string, boolean>
  rejects?: string[]
  hazards?: ItemQuality['hazards']
  yieldShare?: number | null
  processing?: Processing
  warranty?: { kind: WarrantyKind; years: number | null; note: string }
}

export function saveItemQuality(state: AppData, actor: Actor, itemId: string, patch: QualityPatch): ActionResult {
  const e = editor(state, actor, itemId)
  if (typeof e === 'string') return fail(state, e)
  const { a, item } = e
  const g = GRADING[item.family]
  const q: ItemQuality = structuredClone(item.quality ?? emptyQuality(a.now))
  if (patch.checks) {
    if (Object.keys(patch.checks).some((id) => !g.checks.some((c) => c.id === id))) return fail(state, QUALITY_ERRORS.check)
    q.checks = { ...q.checks, ...patch.checks }
  }
  if (patch.rejects) {
    if (patch.rejects.some((id) => !g.rejects.some((r) => r.id === id))) return fail(state, QUALITY_ERRORS.check)
    q.rejects = [...new Set(patch.rejects)]
  }
  if (patch.hazards) {
    if (patch.hazards.some((h) => !HAZARDS.some((x) => x.id === h.id) || !['suspected', 'confirmed', 'cleared'].includes(h.status))) return fail(state, QUALITY_ERRORS.hazard)
    q.hazards = patch.hazards.filter((h, i, all) => all.findIndex((x) => x.id === h.id) === i)
  }
  if (patch.yieldShare !== undefined) {
    if (patch.yieldShare !== null && !(Number.isFinite(patch.yieldShare) && patch.yieldShare >= 0 && patch.yieldShare <= 1)) return fail(state, QUALITY_ERRORS.share)
    q.yieldShare = patch.yieldShare
  }
  if (patch.processing !== undefined) {
    if (!(patch.processing in PROCESSING_LABELS)) return fail(state, QUALITY_ERRORS.processing)
    q.processing = patch.processing
  }
  if (patch.warranty) {
    const w = patch.warranty
    if (!(w.kind in WARRANTY_LABELS)) return fail(state, QUALITY_ERRORS.warranty)
    if (w.years !== null && !(Number.isInteger(w.years) && w.years >= 0 && w.years <= 50)) return fail(state, QUALITY_ERRORS.years)
    q.warranty = { kind: w.kind, years: w.kind === 'none' ? null : w.years, note: clean(w.note, 500) }
  }
  q.updatedAt = a.now
  return ok(withItem(state, { ...item, quality: q }))
}

export type SteelInput = Omit<SteelRecord, 'certificate'> & { certificate: SteelCertificate | null }

/** Saves an item's steel record and sets its test status and usable grade from it. */
export function saveSteelRecord(state: AppData, actor: Actor, itemId: string, input: SteelInput): ActionResult {
  const e = editor(state, actor, itemId)
  if (typeof e === 'string') return fail(state, e)
  const { a, item } = e
  if (item.family !== 'steel_section') return fail(state, QUALITY_ERRORS.steelOnly)
  if (!(input.provenance in PROVENANCE_LABELS) || !(input.assessment in ASSESSMENT_LABELS)) return fail(state, QUALITY_ERRORS.steel)
  const group = clean(input.groupId, 30)
  if (!group) return fail(state, QUALITY_ERRORS.group)
  if (!(Number.isInteger(input.samplesTested) && input.samplesTested >= 0 && input.samplesTested <= 10000)) return fail(state, QUALITY_ERRORS.samples)
  const answers = ['yes', 'no', 'unknown']
  if (Object.values(input.admissibility).some((x) => !answers.includes(x))) return fail(state, QUALITY_ERRORS.steel)
  let certificate: SteelCertificate | null = null
  if (input.certificate) {
    const c = input.certificate
    if (!clean(c.ref, 40) || !clean(c.lab, 80)) return fail(state, QUALITY_ERRORS.certificate)
    if (!isIsoDate(c.issuedOn)) return fail(state, QUALITY_ERRORS.date)
    if (!['S275', 'S355', 'unknown'].includes(c.grade)) return fail(state, QUALITY_ERRORS.steel)
    certificate = { ref: clean(c.ref, 40), lab: clean(c.lab, 80), issuedOn: c.issuedOn, grade: c.grade }
  }
  const steel: SteelRecord = { provenance: input.provenance, assessment: input.assessment, groupId: group, admissibility: { ...input.admissibility }, samplesTested: input.samplesTested, certificate }
  const q: ItemQuality = { ...structuredClone(item.quality ?? emptyQuality(a.now)), steel, updatedAt: a.now }
  return ok(withItem(state, { ...item, quality: q, testStatus: statusFrom(steel), grade: usableGrade(steel) }))
}

/**
 * The steel record after a testing company's results: an inspection takes it to S1 at least, a test to S3 at least
 * with the result's grade on a certificate. Used by the Testing tab, so its four statuses and the record agree.
 */
export function steelAfterResult(steel: SteelRecord, result: { testStatus: 'inspected' | 'tested'; grade: 'S275' | 'S355' | 'unknown' | null }, cert: { ref: string; lab: string; issuedOn: string }): SteelRecord {
  const order = ['S0', 'S1', 'S2', 'S3', 'S4'] as const
  const floor = result.testStatus === 'tested' ? 'S3' : 'S1'
  const assessment = order.indexOf(steel.assessment) >= order.indexOf(floor) ? steel.assessment : floor
  const certificate = result.testStatus === 'tested' ? { ...cert, grade: result.grade ?? steel.certificate?.grade ?? 'unknown' } : steel.certificate
  return { ...steel, assessment, certificate }
}
