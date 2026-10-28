// Specification v2 and the client's procurement pack (round 3, BRIEF section 15.7). The client writes the pack: the
// reuse objective, the supply route, the clauses, the award weightings and the provisional sum. The architect writes
// the reuse clauses of the specification. Every input is checked and trimmed here.
import type { Ambition, AwardCriterion, AwardTemplateId, ProcurementPack, SpecClauseField, SpecClauseV2, SupplyRoute, TargetUnit } from '../../domain/procurementTypes'
import { AMBITIONS, AWARD_TEMPLATES, CLAUSE_LIBRARY, defaultClauseIds, PROVISIONAL_SHARE, SUPPLY_ROUTES } from '../../domain/reference/procurement'
import { awardProblem } from '../../domain/engines/procurement'
import type { ActionResult, Actor, AppData } from '../types'
import { ERRORS, isProjectArchitect, isProjectClient } from '../access'
import { acceptedReservation, lotByPublicId } from '../lots'
import { acting, clean, fail, ok } from './common'

export const PROCUREMENT_ERRORS = {
  ambition: 'Choose a level from the list.',
  unit: 'Choose value or mass.',
  target: 'Give the target as a percentage from 0.1 to 100.',
  route: 'Choose a supply route from the list.',
  clause: 'That clause is not in the library.',
  provisional: 'Give the provisional sum as a percentage from 0 to 50.',
  template: 'Choose a template from the list.',
  field: 'That field cannot be changed.',
  surplus: 'Give the surplus as a percentage from 0 to 50.',
} as const

/** The route a project starts with: free issue once the client holds reserved material, else sourced by the contractor. */
export function defaultRoute(state: AppData, projectId: string): SupplyRoute {
  return Object.values(state.reservations).some((r) => r.projectId === projectId && r.status === 'accepted') ? 'free_issue' : 'contractor_sourced'
}

/** The project's pack, or the starting one when the client has not saved any. */
export function packOf(state: AppData, projectId: string): ProcurementPack {
  const saved = state.procurement[projectId]
  if (saved) return saved
  const route = defaultRoute(state, projectId)
  return {
    ambition: 'ambitious',
    unit: 'value',
    targetShare: AMBITIONS.ambitious.share,
    route,
    clauseIds: defaultClauseIds(route),
    award: { template: 'urban_works', criteria: AWARD_TEMPLATES.urban_works.criteria.map((c) => ({ ...c })) },
    provisionalShare: PROVISIONAL_SHARE,
    updatedAt: '',
    byUserId: '',
  }
}

function clientOn(state: AppData, actor: Actor, projectId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  if (!state.world.projects[projectId]) return ERRORS.noProject
  if (!isProjectClient(state, actor.userId, projectId)) return ERRORS.role
  return a
}

function withPack(state: AppData, projectId: string, pack: ProcurementPack): AppData {
  return { ...state, procurement: { ...state.procurement, [projectId]: pack } }
}

export type PackPatch = { ambition?: Ambition; unit?: TargetUnit; targetShare?: number; route?: SupplyRoute; clauseIds?: string[]; provisionalShare?: number }

/**
 * The client changes the pack. Choosing a level sets its target unless one is given; choosing a route resets the
 * clauses to that route's set unless they are given.
 */
export function saveProcurement(state: AppData, actor: Actor, projectId: string, patch: PackPatch): ActionResult {
  const a = clientOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const now = packOf(state, projectId)
  if (patch.ambition !== undefined && !(patch.ambition in AMBITIONS)) return fail(state, PROCUREMENT_ERRORS.ambition)
  if (patch.unit !== undefined && patch.unit !== 'value' && patch.unit !== 'mass') return fail(state, PROCUREMENT_ERRORS.unit)
  if (patch.targetShare !== undefined && (!Number.isFinite(patch.targetShare) || patch.targetShare < 0.001 || patch.targetShare > 1)) return fail(state, PROCUREMENT_ERRORS.target)
  if (patch.route !== undefined && !(patch.route in SUPPLY_ROUTES)) return fail(state, PROCUREMENT_ERRORS.route)
  if (patch.clauseIds !== undefined && patch.clauseIds.some((id) => !CLAUSE_LIBRARY.some((c) => c.id === id))) return fail(state, PROCUREMENT_ERRORS.clause)
  if (patch.provisionalShare !== undefined && (!Number.isFinite(patch.provisionalShare) || patch.provisionalShare < 0 || patch.provisionalShare > 0.5)) return fail(state, PROCUREMENT_ERRORS.provisional)
  const ambition = patch.ambition ?? now.ambition
  const route = patch.route ?? now.route
  const clauseIds = patch.clauseIds ?? (patch.route !== undefined && patch.route !== now.route ? defaultClauseIds(route) : now.clauseIds)
  const pack: ProcurementPack = {
    ...now,
    ambition,
    unit: patch.unit ?? now.unit,
    targetShare: patch.targetShare ?? (patch.ambition !== undefined ? AMBITIONS[ambition].share : now.targetShare),
    route,
    // In library order, without repeats.
    clauseIds: CLAUSE_LIBRARY.filter((c) => clauseIds.includes(c.id)).map((c) => c.id),
    provisionalShare: patch.provisionalShare ?? now.provisionalShare,
    updatedAt: a.now,
    byUserId: a.user.id,
  }
  return ok(withPack(state, projectId, pack))
}

/** The client starts the award weightings from a template. */
export function setAwardTemplate(state: AppData, actor: Actor, projectId: string, template: Exclude<AwardTemplateId, 'custom'>): ActionResult {
  const a = clientOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  if (!(template in AWARD_TEMPLATES)) return fail(state, PROCUREMENT_ERRORS.template)
  const now = packOf(state, projectId)
  return ok(withPack(state, projectId, { ...now, award: { template, criteria: AWARD_TEMPLATES[template].criteria.map((c) => ({ ...c })) }, updatedAt: a.now, byUserId: a.user.id }))
}

/** The client sets its own weightings. They must add up to 100 and weight reuse. */
export function saveAwardCriteria(state: AppData, actor: Actor, projectId: string, criteria: AwardCriterion[]): ActionResult {
  const a = clientOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const tidy = criteria.slice(0, 12).map((c, i) => ({ id: c.id || `c${i + 1}`, label: clean(c.label, 120), weight: c.weight, reuse: c.reuse === true }))
  const problem = awardProblem(tidy)
  if (problem) return fail(state, problem)
  const now = packOf(state, projectId)
  const same = now.award.template !== 'custom' && JSON.stringify(AWARD_TEMPLATES[now.award.template].criteria) === JSON.stringify(tidy)
  return ok(withPack(state, projectId, { ...now, award: { template: same ? now.award.template : 'custom', criteria: tidy }, updatedAt: a.now, byUserId: a.user.id }))
}

const TEXT_FIELDS: SpecClauseField[] = ['location', 'tolerances', 'patina', 'operations', 'acceptance', 'fallback']

export type ClauseEdit = { field: SpecClauseField; text: string } | { field: 'route'; route: SupplyRoute | null } | { field: 'surplusShare'; share: number | null }

/** The architect's entry in one reuse clause of the specification. An empty text or null goes back to the generated text. */
export function editSpecClause(state: AppData, actor: Actor, projectId: string, publicId: string, edit: ClauseEdit): ActionResult {
  const a = acting(state, actor)
  if (typeof a === 'string') return fail(state, a)
  if (!state.world.projects[projectId]) return fail(state, ERRORS.noProject)
  if (!isProjectArchitect(state, actor.userId, projectId)) return fail(state, ERRORS.role)
  const spec = state.specs[projectId] ?? { header: '', clauseNotes: {}, updatedAt: null }
  const own: SpecClauseV2 = { ...(spec.clauses?.[publicId] ?? {}) }
  if (edit.field === 'route') {
    if (edit.route !== null && !(edit.route in SUPPLY_ROUTES)) return fail(state, PROCUREMENT_ERRORS.route)
    if (edit.route === null) delete own.route
    else own.route = edit.route
  } else if (edit.field === 'surplusShare') {
    if (edit.share !== null && (!Number.isFinite(edit.share) || edit.share < 0 || edit.share > 0.5)) return fail(state, PROCUREMENT_ERRORS.surplus)
    if (edit.share === null) delete own.surplusShare
    else own.surplusShare = edit.share
  } else {
    if (!TEXT_FIELDS.includes(edit.field)) return fail(state, PROCUREMENT_ERRORS.field)
    const text = clean(edit.text, 1000)
    if (text) own[edit.field] = text
    else delete own[edit.field]
  }
  const clauses = { ...(spec.clauses ?? {}) }
  if (Object.keys(own).length > 0) clauses[publicId] = own
  else delete clauses[publicId]
  return ok({ ...state, specs: { ...state.specs, [projectId]: { ...spec, clauses, updatedAt: a.now } } })
}

/** The route a clause starts with: free issue once the client holds it for the project, else the pack's route. */
export function clauseDefaultRoute(state: AppData, projectId: string, publicId: string): SupplyRoute {
  const lot = lotByPublicId(state.world, publicId)
  const held = lot ? acceptedReservation(state, lot.id) : null
  if (held?.projectId === projectId) return 'free_issue'
  return packOf(state, projectId).route
}
