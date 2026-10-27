// Audits of a donor building (round 3, BRIEF section 15.3). The owner or the appointed surveyor writes them; the
// deconstruction contractor reads them. Saving a field records nothing in the activity; creating, completing and
// reopening an audit do, and completing one tells the other sides. Every input is checked and trimmed here.
import type { ActionResult, Actor, AppData } from '../types'
import type { AuditIndependence, AuditRow, BrokerRoute, BrokerStatus, BuildingAudit, ExistingTreeAnswers, HazardEntry, PreDemolitionAudit, PreRedevelopmentAudit, RetentionFactorId, RetentionOption, RetentionScale } from '../../domain/auditTypes'
import { FAMILY_IDS } from '../../domain/reference/families'
import { FOLLOW_ON_ASSESSMENTS, HAZARDS, NRM_CATEGORIES, OPTION_KIND_LABELS, RETENTION_FACTORS, RETENTION_SCALE_LABELS } from '../../domain/reference/audit'
import { awaitsListing, checklistReady, draftQuantityFor, draftSpecFor, gradesFor, listableRows, preDemolitionChecklist, preRedevelopmentChecklist, rowsFromItems } from '../../domain/engines/audit'
import { ERRORS, auditOrgIds, canCaptureIn } from '../access'
import { mint } from '../ids'
import { log, notify } from '../notifications'
import { acting, clean, fail, isIsoDate, ok } from './common'
import { captureItem } from './surveyor'

export const AUDIT_ERRORS = {
  noAudit: 'That audit could not be found.',
  complete: 'This audit is complete. Reopen it to change it.',
  notReady: 'Finish the checklist before completing the audit.',
  number: 'Enter a number of zero or more.',
  share: 'Enter a share from 0 to 100%.',
  score: 'Scores run from 0 to 4.',
  band: 'Condition bands run from 1 to 6.',
  date: 'Enter a real date.',
  family: 'Choose a family from the list.',
  nrm: 'Choose an element category from the list.',
  label: 'Give it a name.',
  noLines: 'There are no lines that can be listed yet.',
  exists: 'This building already has an audit of that kind. Open it to carry on.',
} as const

const MAX_LINES = 400
const MAX_OPTIONS = 8

function auditOf(state: AppData, auditId: string): BuildingAudit | null {
  return state.audits[auditId] ?? null
}

/** The acting person may write the building's audits: its owner or its surveyor, never a contractor alone. */
function writer(state: AppData, actor: Actor, buildingId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  if (!state.world.buildings[buildingId]) return ERRORS.noBuilding
  if (!canCaptureIn(state, actor.userId, buildingId)) return ERRORS.noAccess
  return a
}

function withAudit(state: AppData, audit: BuildingAudit): AppData {
  return { ...state, audits: { ...state.audits, [audit.id]: audit } }
}

function num(x: unknown, opts: { max?: number; integer?: boolean } = {}): number | null | 'bad' {
  if (x === null || x === undefined || x === '') return null
  const n = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(n) || n < 0 || (opts.max !== undefined && n > opts.max) || (opts.integer && !Number.isInteger(n))) return 'bad'
  return n
}

export type CreateAuditInput = { buildingId: string; kind: BuildingAudit['kind'] }

export function createAudit(state: AppData, actor: Actor, input: CreateAuditInput): ActionResult<string> {
  const a = writer(state, actor, input.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (input.kind !== 'pre_redevelopment' && input.kind !== 'pre_demolition') return fail(state, ERRORS.role)
  if (Object.values(state.audits).some((x) => x.buildingId === input.buildingId && x.kind === input.kind)) return fail(state, AUDIT_ERRORS.exists)
  const m = mint(state, 'aud', (id) => !!state.audits[id])
  const base = { id: m.id, buildingId: input.buildingId, status: 'draft' as const, authorOrgId: a.org.id, authorUserId: a.user.id, createdAt: a.now, updatedAt: a.now, completedAt: null, auditorName: a.org.name, independence: 'not_declared' as const, reviewer: null, surveyedOn: null, summary: '' }
  const audit: BuildingAudit =
    input.kind === 'pre_redevelopment'
      ? { ...base, kind: 'pre_redevelopment', factors: Object.fromEntries(RETENTION_FACTORS.map((f) => [f.id, { scale: null, note: '' }])) as PreRedevelopmentAudit['factors'], tree: { feasibleToRetain: null, suitedInWhole: null, suitedInPart: null, recoverResidualValue: null }, options: [], preferredOptionId: null, justification: '', followOn: [] }
      : { ...base, kind: 'pre_demolition', deskStudy: { drawingsSeen: false, asbestosRegister: 'none', history: '' }, hazards: [], rows: [], targets: { reuseByMass: null, recoveryByWeight: null } }
  const b = state.world.buildings[input.buildingId]
  let s = withAudit(m.state, audit)
  s = log(s, { at: a.now, orgIds: auditOrgIds(b, input.kind), buildingId: b.id, projectId: null, actorUserId: a.user.id, actor: a.user.name, text: `started a ${input.kind === 'pre_redevelopment' ? 'pre-redevelopment' : 'pre-deconstruction'} audit`, href: `/app/buildings/${b.id}/audits/${audit.id}` })
  return ok(s, audit.id)
}

export type AuditPatch = {
  auditorName?: string
  independence?: AuditIndependence
  reviewer?: { name: string; organisation: string; reviewedOn: string | null; note: string } | null
  surveyedOn?: string | null
  summary?: string
  factor?: { id: RetentionFactorId; scale: RetentionScale | null; note: string }
  tree?: Partial<ExistingTreeAnswers>
  preferredOptionId?: string | null
  justification?: string
  followOn?: string[]
  deskStudy?: Partial<PreDemolitionAudit['deskStudy']>
  hazard?: HazardEntry
  targets?: Partial<PreDemolitionAudit['targets']>
}

/** Saves fields of an audit still in draft. Only the fields given change. */
export function saveAudit(state: AppData, actor: Actor, auditId: string, patch: AuditPatch): ActionResult {
  const audit = auditOf(state, auditId)
  if (!audit) return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  const next = structuredClone(audit) as BuildingAudit
  if (patch.auditorName !== undefined) next.auditorName = clean(patch.auditorName, 120)
  if (patch.independence !== undefined) {
    if (!['independent', 'design_team', 'contractor', 'owner', 'not_declared'].includes(patch.independence)) return fail(state, ERRORS.role)
    next.independence = patch.independence
  }
  if (patch.reviewer !== undefined) {
    if (patch.reviewer === null) next.reviewer = null
    else {
      if (patch.reviewer.reviewedOn !== null && !isIsoDate(patch.reviewer.reviewedOn)) return fail(state, AUDIT_ERRORS.date)
      next.reviewer = { name: clean(patch.reviewer.name, 120), organisation: clean(patch.reviewer.organisation, 120), reviewedOn: patch.reviewer.reviewedOn, note: clean(patch.reviewer.note, 1000) }
    }
  }
  if (patch.surveyedOn !== undefined) {
    if (patch.surveyedOn !== null && !isIsoDate(patch.surveyedOn)) return fail(state, AUDIT_ERRORS.date)
    next.surveyedOn = patch.surveyedOn
  }
  if (patch.summary !== undefined) next.summary = clean(patch.summary, 4000)
  if (next.kind === 'pre_redevelopment') {
    if (patch.factor) {
      if (!RETENTION_FACTORS.some((f) => f.id === patch.factor!.id) || (patch.factor.scale !== null && !(patch.factor.scale in RETENTION_SCALE_LABELS))) return fail(state, ERRORS.role)
      next.factors[patch.factor.id] = { scale: patch.factor.scale, note: clean(patch.factor.note, 1000) }
    }
    if (patch.tree) {
      for (const [k, v] of Object.entries(patch.tree)) {
        if (!(k in next.tree) || (v !== null && v !== 'yes' && v !== 'no')) return fail(state, ERRORS.role)
        ;(next.tree as Record<string, unknown>)[k] = v
      }
    }
    if (patch.preferredOptionId !== undefined) {
      if (patch.preferredOptionId !== null && !next.options.some((o) => o.id === patch.preferredOptionId)) return fail(state, ERRORS.role)
      next.preferredOptionId = patch.preferredOptionId
    }
    if (patch.justification !== undefined) next.justification = clean(patch.justification, 4000)
    if (patch.followOn !== undefined) next.followOn = patch.followOn.filter((x) => (FOLLOW_ON_ASSESSMENTS as readonly string[]).includes(x))
  } else {
    if (patch.deskStudy) {
      const d = patch.deskStudy
      if (d.asbestosRegister !== undefined && !['none', 'seen', 'refurbishment_survey'].includes(d.asbestosRegister)) return fail(state, ERRORS.role)
      next.deskStudy = { drawingsSeen: d.drawingsSeen ?? next.deskStudy.drawingsSeen, asbestosRegister: d.asbestosRegister ?? next.deskStudy.asbestosRegister, history: d.history !== undefined ? clean(d.history, 2000) : next.deskStudy.history }
    }
    if (patch.hazard) {
      const h = patch.hazard
      if (!HAZARDS.some((x) => x.id === h.id) || (h.status !== null && !['not_suspected', 'suspected', 'confirmed', 'removed'].includes(h.status)) || (h.basis !== null && !['era', 'survey', 'test'].includes(h.basis))) return fail(state, ERRORS.role)
      next.hazards = [...next.hazards.filter((x) => x.id !== h.id), { id: h.id, status: h.status, basis: h.basis, note: clean(h.note, 1000) }]
    }
    if (patch.targets) {
      for (const k of ['reuseByMass', 'recoveryByWeight'] as const) {
        if (patch.targets[k] === undefined) continue
        const v = num(patch.targets[k], { max: 1 })
        if (v === 'bad') return fail(state, AUDIT_ERRORS.share)
        next.targets[k] = v
      }
    }
  }
  next.updatedAt = actor.now
  return ok(withAudit(state, next))
}

export type AuditRowInput = Omit<AuditRow, 'id' | 'itemId'> & { id?: string }

/** Adds a line, or replaces the line with the same ID. */
export function saveAuditRow(state: AppData, actor: Actor, auditId: string, input: AuditRowInput): ActionResult<string> {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_demolition') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  if (!['reuse', 'recycle', 'waste'].includes(input.inventory)) return fail(state, ERRORS.role)
  if (input.family !== null && !FAMILY_IDS.includes(input.family)) return fail(state, AUDIT_ERRORS.family)
  if (!NRM_CATEGORIES.some((c) => c.code === input.nrm)) return fail(state, AUDIT_ERRORS.nrm)
  const quantity = num(input.quantity)
  const massT = num(input.massT)
  if (quantity === 'bad' || massT === 'bad') return fail(state, AUDIT_ERRORS.number)
  const scores = [num(input.extractability, { max: 4, integer: true }), num(input.quality, { max: 4, integer: true }), num(input.marketValue, { max: 4, integer: true })]
  if (scores.includes('bad')) return fail(state, AUDIT_ERRORS.score)
  const share = num(input.reusableShare, { max: 1 })
  if (share === 'bad') return fail(state, AUDIT_ERRORS.share)
  const band = input.cityBand === null ? null : num(input.cityBand, { max: 6, integer: true })
  if (band === 'bad' || band === 0) return fail(state, AUDIT_ERRORS.band)
  const routes: BrokerRoute[] = ['marketplace', 'reuse_on_site', 'other_outlet', 'none']
  const statuses: BrokerStatus[] = ['not_offered', 'offered', 'agreed']
  if (!routes.includes(input.broker.route) || !statuses.includes(input.broker.status)) return fail(state, ERRORS.role)
  if (!clean(input.description, 200)) return fail(state, AUDIT_ERRORS.label)
  const existing = input.id ? audit.rows.find((r) => r.id === input.id) : undefined
  if (!existing && audit.rows.length >= MAX_LINES) return fail(state, AUDIT_ERRORS.number)
  const id = existing?.id ?? nextLocalId(audit.id, 'r', audit.rows.map((r) => r.id))
  const row: AuditRow = {
    id,
    inventory: input.inventory,
    description: clean(input.description, 200),
    family: input.family,
    nrm: input.nrm,
    ewcCode: clean(input.ewcCode, 20),
    quantity,
    unit: clean(input.unit, 30),
    massT,
    extractability: scores[0] as number | null,
    quality: scores[1] as number | null,
    marketValue: scores[2] as number | null,
    reusableShare: input.inventory === 'reuse' ? share : null,
    cityBand: band,
    considerations: clean(input.considerations, 1000),
    broker: { route: input.broker.route, status: input.broker.status, outlet: clean(input.broker.outlet, 120) },
    itemId: existing?.itemId ?? null,
  }
  const rows = existing ? audit.rows.map((r) => (r.id === id ? row : r)) : [...audit.rows, row]
  return ok(withAudit(state, { ...audit, rows, updatedAt: actor.now }), id)
}

export function removeAuditRow(state: AppData, actor: Actor, auditId: string, rowId: string): ActionResult {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_demolition') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  return ok(withAudit(state, { ...audit, rows: audit.rows.filter((r) => r.id !== rowId), updatedAt: actor.now }))
}

/** Adds a line for every surveyed item of the building that is not in the audit yet. Returns how many. */
export function importSurveyedItems(state: AppData, actor: Actor, auditId: string): ActionResult<number> {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_demolition') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  const have = new Set(audit.rows.map((r) => r.itemId).filter(Boolean))
  const items = Object.values(state.world.items).filter((i) => i.buildingId === audit.buildingId && !have.has(i.id))
  const taken = audit.rows.map((r) => r.id)
  const rows = rowsFromItems(items, () => {
    const id = nextLocalId(audit.id, 'r', taken)
    taken.push(id)
    return id
  })
  if (rows.length === 0) return ok(state, 0)
  return ok(withAudit(state, { ...audit, rows: [...audit.rows, ...rows], updatedAt: actor.now }), rows.length)
}

export type RetentionOptionInput = Omit<RetentionOption, 'id'> & { id?: string }

export function saveRetentionOption(state: AppData, actor: Actor, auditId: string, input: RetentionOptionInput): ActionResult<string> {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_redevelopment') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  if (!(input.kind in OPTION_KIND_LABELS)) return fail(state, ERRORS.role)
  const label = clean(input.label, 80)
  if (!label) return fail(state, AUDIT_ERRORS.label)
  const shares = [num(input.superstructureRetainedShare, { max: 1 }), num(input.facadeRetainedShare, { max: 1 })]
  if (shares.includes('bad')) return fail(state, AUDIT_ERRORS.share)
  const nums = [num(input.giaM2), num(input.upfrontKgM2, { max: 10000 }), num(input.wlcKgM2, { max: 20000 }), num(input.demolishedAreaM2), num(input.demolitionKgM2, { max: 5000 })]
  if (nums.includes('bad')) return fail(state, AUDIT_ERRORS.number)
  const existing = input.id ? audit.options.find((o) => o.id === input.id) : undefined
  if (!existing && audit.options.length >= MAX_OPTIONS) return fail(state, AUDIT_ERRORS.number)
  const id = existing?.id ?? nextLocalId(audit.id, 'o', audit.options.map((o) => o.id))
  const [giaM2, upfrontKgM2, wlcKgM2, demolishedAreaM2, demolitionKgM2] = nums as (number | null)[]
  const option: RetentionOption = { id, label, kind: input.kind, superstructureRetainedShare: shares[0] as number | null, facadeRetainedShare: shares[1] as number | null, giaM2, upfrontKgM2, wlcKgM2, demolishedAreaM2, demolitionKgM2, note: clean(input.note, 1000) }
  const options = existing ? audit.options.map((o) => (o.id === id ? option : o)) : [...audit.options, option]
  return ok(withAudit(state, { ...audit, options, updatedAt: actor.now }), id)
}

export function removeRetentionOption(state: AppData, actor: Actor, auditId: string, optionId: string): ActionResult {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_redevelopment') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  return ok(withAudit(state, { ...audit, options: audit.options.filter((o) => o.id !== optionId), preferredOptionId: audit.preferredOptionId === optionId ? null : audit.preferredOptionId, updatedAt: actor.now }))
}

/** Completes an audit whose checklist is done, and tells the building's other sides. */
export function completeAudit(state: AppData, actor: Actor, auditId: string): ActionResult {
  const audit = auditOf(state, auditId)
  if (!audit) return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return ok(state)
  const b = state.world.buildings[audit.buildingId]
  const items = audit.kind === 'pre_redevelopment' ? preRedevelopmentChecklist(audit, b) : preDemolitionChecklist(audit, b)
  if (!checklistReady(items)) return fail(state, AUDIT_ERRORS.notReady)
  let s = withAudit(state, { ...audit, status: 'complete', completedAt: a.now, updatedAt: a.now })
  const kind = audit.kind === 'pre_redevelopment' ? 'pre-redevelopment' : 'pre-deconstruction'
  const href = `/app/buildings/${b.id}/audits/${audit.id}`
  s = log(s, { at: a.now, orgIds: auditOrgIds(b, audit.kind), buildingId: b.id, projectId: null, actorUserId: a.user.id, actor: a.user.name, text: `completed the ${kind} audit`, href })
  const others = auditOrgIds(b, audit.kind).filter((o) => o !== a.org.id)
  if (others.length > 0) s = notify(s, { orgIds: others, kind: 'audit', title: `${a.org.name} completed the ${kind} audit of ${b.name}`, body: audit.kind === 'pre_demolition' ? 'Read what comes out, where it goes and the reuse targets.' : 'Read whether the building can be kept and the options compared.', href, at: a.now, actorUserId: a.user.id })
  return ok(s)
}

export function reopenAudit(state: AppData, actor: Actor, auditId: string): ActionResult {
  const audit = auditOf(state, auditId)
  if (!audit) return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'draft') return ok(state)
  const b = state.world.buildings[audit.buildingId]
  let s = withAudit(state, { ...audit, status: 'draft', completedAt: null, updatedAt: a.now })
  s = log(s, { at: a.now, orgIds: auditOrgIds(b, audit.kind), buildingId: b.id, projectId: null, actorUserId: a.user.id, actor: a.user.name, text: `reopened the ${audit.kind === 'pre_redevelopment' ? 'pre-redevelopment' : 'pre-deconstruction'} audit`, href: `/app/buildings/${b.id}/audits/${audit.id}` })
  return ok(s)
}

export type DraftListingsResult = { created: number; marked: number; skipped: number }

/**
 * Turns the audit's reusable lines into private inventory items with their lots, so the owner can list them early
 * (the City asks for materials to be advertised on reuse platforms as early as possible). A line that came from a
 * surveyed item is only marked as offered on Tallyard. Steel and curtain wall need their surveyed sizes, so lines of
 * those families without an item are left for capture.
 */
export function createListingsFromAudit(state: AppData, actor: Actor, auditId: string): ActionResult<DraftListingsResult> {
  const audit = auditOf(state, auditId)
  if (!audit || audit.kind !== 'pre_demolition') return fail(state, AUDIT_ERRORS.noAudit)
  const a = writer(state, actor, audit.buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (audit.status === 'complete') return fail(state, AUDIT_ERRORS.complete)
  const eligible = listableRows(audit.rows)
  if (eligible.length === 0) return fail(state, AUDIT_ERRORS.noLines)
  let s = state
  let created = 0
  let marked = 0
  let skipped = 0
  const rows = [...audit.rows]
  for (const r of eligible) {
    const i = rows.findIndex((x) => x.id === r.id)
    if (r.itemId && s.world.items[r.itemId]) {
      if (awaitsListing(r, true)) marked++
      rows[i] = { ...r, broker: { ...r.broker, route: 'marketplace', status: r.broker.status === 'agreed' ? 'agreed' : 'offered' } }
      continue
    }
    const spec = draftSpecFor(r)
    const quantity = draftQuantityFor(r)
    if (!spec || !quantity) {
      skipped++
      continue
    }
    const g = gradesFor(r)
    const c = captureItem(s, actor, { buildingId: audit.buildingId, spec, quantity, condition: g.condition, recoverability: g.recoverability, location: '', notes: `From the pre-deconstruction audit: ${r.description}`, photoIds: [], expectedAvailableFrom: null })
    if (c.error || !c.value) {
      skipped++
      continue
    }
    s = c.state
    created++
    rows[i] = { ...r, itemId: c.value.itemId, broker: { ...r.broker, route: 'marketplace', status: 'offered' } }
  }
  const fresh = s.audits[auditId] as PreDemolitionAudit
  s = withAudit(s, { ...fresh, rows, updatedAt: actor.now })
  return ok(s, { created, marked, skipped })
}

/** The next free local ID for a line or an option, like aud_x9_r3. */
function nextLocalId(auditId: string, kind: 'r' | 'o', taken: string[]): string {
  let n = taken.length + 1
  while (taken.includes(`${auditId}_${kind}${n}`)) n++
  return `${auditId}_${kind}${n}`
}

