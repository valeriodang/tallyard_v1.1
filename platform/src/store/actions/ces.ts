// The consultant's circular economy statement workspace (round 3, BRIEF section 15.7): whether a statement is needed
// and at which stage, the decision tree, the layers, the bill's end-of-life scenario, waste estimates, targets, the
// post-construction report and the audits. Consultant only. Every input is checked and trimmed here.
import type { Achievement, CesLayer, CesRecord, CityRecord, DesignApproach, ExistingQuestion, LeedInputs, Lesson, WasteRoutes, WasteStream, YesNo } from '../../domain/cesTypes'
import { CES_STAGES, GLA_TARGETS, REFERRAL_CRITERIA, type CesStage } from '../../domain/reference/gla'
import { EOL_SCENARIOS, type EolScenarioId } from '../../domain/reference/rics'
import { CES_LAYERS, DESIGN_APPROACHES, EXISTING_QUESTIONS, WASTE_STREAMS } from '../../domain/reference/ces'
import type { ActionResult, Actor, AppData } from '../types'
import { ERRORS, projectSide } from '../access'
import { LEED_TYPE_LABELS } from '../../domain/reference/schemes'
import { mint } from '../ids'
import { acting, clean, fail, ok } from './common'

export const CES_ERRORS = {
  referral: 'That criterion is not in the list.',
  stage: 'Choose a stage from the list.',
  question: 'That question is not on the decision tree.',
  answer: 'Answer yes or no.',
  layer: 'That layer is not in the list.',
  approach: 'Choose approaches from the list.',
  scenario: 'Choose a scenario from the list.',
  cost: 'Give the material cost in pounds, more than 0.',
  stream: 'That waste stream is not in the list.',
  tonnes: 'Give the tonnes as a number of 0 or more.',
  share: 'Give each route as a percentage from 0 to 100.',
  overfull: 'The routes add up to more than 100%.',
  target: 'That target is not in the list.',
  rate: 'Give the rate as a percentage from 0 to 100.',
  text: 'Write the measure and what was done.',
  lessonText: 'Write the lesson and what to do next time.',
  noEntry: 'That entry could not be found.',
} as const

/** The stage a project starts at: pre-application until RIBA stage 3, the full application from there. */
function defaultStage(ribaStage: number): CesStage {
  return ribaStage >= 3 ? 'full' : 'pre_app'
}

export const NO_CITY: CityRecord = {
  options: [],
  preferredId: null,
  justification: '',
  reviewer: { name: '', organisation: '', years: null, signedOffOn: null },
  catalogue: [],
  scheduleBands: {},
  passports: [],
  updates: { stage4: null, stage6: null },
}

export const NO_LEED: LeedInputs = { onsiteReused: null, onsiteTotal: null, furnitureReused: null, furnitureTotal: null, offsite: {}, separatedShare: null, mixedRate: null, targetedT: null }

export function cesOf(state: AppData, projectId: string): CesRecord {
  const saved = state.ces[projectId]
  // A record saved before stage 6c has no City or LEED part yet.
  if (saved) return { ...saved, city: saved.city ?? NO_CITY, leed: saved.leed ?? NO_LEED }
  return {
    referralIds: [],
    localRequirement: false,
    stage: defaultStage(state.world.projects[projectId]?.ribaStage ?? 0),
    existing: {},
    justification: '',
    layers: {},
    eolScenario: null,
    materialCost: null,
    waste: {},
    aiming: {},
    achieved: {},
    achievements: [],
    lessons: [],
    audits: { preRedevelopment: false, preDemolition: false },
    city: NO_CITY,
    leed: NO_LEED,
    updatedAt: null,
    updatedByUserId: null,
  }
}

export function consultantOn(state: AppData, actor: Actor, projectId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  if (!state.world.projects[projectId]) return ERRORS.noProject
  if (projectSide(state, actor.userId, projectId) !== 'consultant') return ERRORS.role
  return a
}

/** Changes the project's record as the consultant, or fails with the change's error. */
export function saveCes(state: AppData, actor: Actor, projectId: string, change: (r: CesRecord) => CesRecord | string): ActionResult {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const next = change(cesOf(state, projectId))
  if (typeof next === 'string') return fail(state, next)
  return ok({ ...state, ces: { ...state.ces, [projectId]: { ...next, updatedAt: a.now, updatedByUserId: a.user.id } } })
}

export type CesSettings = { referralIds?: string[]; localRequirement?: boolean; stage?: CesStage; eolScenario?: EolScenarioId | null; materialCost?: number | null; audits?: Partial<CesRecord['audits']> }

export function saveCesSettings(state: AppData, actor: Actor, projectId: string, s: CesSettings): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (s.referralIds && s.referralIds.some((id) => !REFERRAL_CRITERIA.some((c) => c.id === id))) return CES_ERRORS.referral
    if (s.stage !== undefined && !CES_STAGES.includes(s.stage)) return CES_ERRORS.stage
    if (s.eolScenario !== undefined && s.eolScenario !== null && !(s.eolScenario in EOL_SCENARIOS)) return CES_ERRORS.scenario
    if (s.materialCost !== undefined && s.materialCost !== null && (!Number.isFinite(s.materialCost) || s.materialCost <= 0)) return CES_ERRORS.cost
    return {
      ...r,
      referralIds: s.referralIds ? REFERRAL_CRITERIA.filter((c) => s.referralIds!.includes(c.id)).map((c) => c.id) : r.referralIds,
      localRequirement: s.localRequirement ?? r.localRequirement,
      stage: s.stage ?? r.stage,
      eolScenario: s.eolScenario !== undefined ? s.eolScenario : r.eolScenario,
      materialCost: s.materialCost !== undefined ? s.materialCost : r.materialCost,
      audits: { ...r.audits, ...(s.audits ?? {}) },
    }
  })
}

/** An answer on the decision tree for existing buildings, or null to clear it. */
export function answerExisting(state: AppData, actor: Actor, projectId: string, question: ExistingQuestion, answer: YesNo | null): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (!EXISTING_QUESTIONS.some((q) => q.id === question)) return CES_ERRORS.question
    if (answer !== null && answer !== 'yes' && answer !== 'no') return CES_ERRORS.answer
    const existing = { ...r.existing }
    if (answer === null) delete existing[question]
    else existing[question] = answer
    return { ...r, existing }
  })
}

export function saveJustification(state: AppData, actor: Actor, projectId: string, text: string): ActionResult {
  return saveCes(state, actor, projectId, (r) => ({ ...r, justification: clean(text, 4000) }))
}

export function saveLayer(state: AppData, actor: Actor, projectId: string, layer: CesLayer, input: { approaches?: DesignApproach[]; response?: string }): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (!CES_LAYERS.some((l) => l.id === layer)) return CES_ERRORS.layer
    if (input.approaches && input.approaches.some((x) => !DESIGN_APPROACHES.some((d) => d.id === x))) return CES_ERRORS.approach
    const now = r.layers[layer] ?? { approaches: [], response: '' }
    const next = {
      approaches: input.approaches ? DESIGN_APPROACHES.filter((d) => input.approaches!.includes(d.id)).map((d) => d.id) : now.approaches,
      response: input.response !== undefined ? clean(input.response, 2000) : now.response,
    }
    return { ...r, layers: { ...r.layers, [layer]: next } }
  })
}

const ROUTE_KEYS: (keyof WasteRoutes)[] = ['reuseOnsite', 'reuseOffsite', 'recycleOnsite', 'recycleOffsite', 'landfill', 'other']
const NO_ROUTES: WasteRoutes = { reuseOnsite: 0, reuseOffsite: 0, recycleOnsite: 0, recycleOffsite: 0, landfill: 0, other: 0 }

/** An estimate for a waste stream: tonnes, and the share of each route as a fraction. */
export function saveWaste(state: AppData, actor: Actor, projectId: string, stream: WasteStream, input: { tonnes?: number | null; routes?: Partial<WasteRoutes>; source?: string }): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (!WASTE_STREAMS.some((w) => w.id === stream)) return CES_ERRORS.stream
    if (input.tonnes !== undefined && input.tonnes !== null && (!Number.isFinite(input.tonnes) || input.tonnes < 0)) return CES_ERRORS.tonnes
    const now = r.waste[stream] ?? { tonnes: null, routes: NO_ROUTES, source: '' }
    const routes = { ...now.routes }
    for (const k of ROUTE_KEYS) {
      const v = input.routes?.[k]
      if (v === undefined) continue
      if (!Number.isFinite(v) || v < 0 || v > 1) return CES_ERRORS.share
      routes[k] = v
    }
    if (ROUTE_KEYS.reduce((s, k) => s + routes[k], 0) > 1 + 1e-9) return CES_ERRORS.overfull
    return { ...r, waste: { ...r.waste, [stream]: { tonnes: input.tonnes !== undefined ? input.tonnes : now.tonnes, routes, source: input.source !== undefined ? clean(input.source, 200) : now.source } } }
  })
}

/** What the scheme aims for on a GLA target, or what it achieved, as a fraction; null clears it. */
export function setTargetRate(state: AppData, actor: Actor, projectId: string, targetId: string, which: 'aiming' | 'achieved', rate: number | null): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (!GLA_TARGETS.some((t) => t.id === targetId)) return CES_ERRORS.target
    if (rate !== null && (!Number.isFinite(rate) || rate < 0 || rate > 1)) return CES_ERRORS.rate
    const next = { ...r[which] }
    if (rate === null) delete next[targetId]
    else next[targetId] = rate
    return { ...r, [which]: next }
  })
}

export function addAchievement(state: AppData, actor: Actor, projectId: string, measure: string, action: string): ActionResult<string> {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const m = clean(measure, 300)
  const done = clean(action, 2000)
  if (!m || !done) return fail(state, CES_ERRORS.text)
  const id = mint(state, 'ach', (x) => cesOf(state, projectId).achievements.some((e) => e.id === x))
  const r = cesOf(id.state, projectId)
  const entry: Achievement = { id: id.id, measure: m, action: done }
  return ok({ ...id.state, ces: { ...id.state.ces, [projectId]: { ...r, achievements: [...r.achievements, entry], updatedAt: a.now, updatedByUserId: a.user.id } } }, id.id)
}

export function addLesson(state: AppData, actor: Actor, projectId: string, description: string, solution: string): ActionResult<string> {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const d = clean(description, 1000)
  const s = clean(solution, 2000)
  if (!d || !s) return fail(state, CES_ERRORS.lessonText)
  const id = mint(state, 'les', (x) => cesOf(state, projectId).lessons.some((e) => e.id === x))
  const r = cesOf(id.state, projectId)
  const entry: Lesson = { id: id.id, description: d, solution: s }
  return ok({ ...id.state, ces: { ...id.state.ces, [projectId]: { ...r, lessons: [...r.lessons, entry], updatedAt: a.now, updatedByUserId: a.user.id } } }, id.id)
}

export function removeCesEntry(state: AppData, actor: Actor, projectId: string, kind: 'achievements' | 'lessons', id: string): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    if (!r[kind].some((e) => e.id === id)) return CES_ERRORS.noEntry
    return { ...r, [kind]: r[kind].filter((e) => e.id !== id) }
  })
}

export const LEED_ERRORS = {
  amount: 'Give the cost as a number of 0 or more.',
  overTotal: 'The reused part cannot be more than the total.',
  type: 'That material type is not in the list.',
  share: 'Give the share as a percentage from 0 to 100.',
  tonnes: 'Give the tonnes as a number of 0 or more.',
} as const

/** The consultant's inputs to the LEED v5 interiors calculators; fields left out stay as they are. */
export function saveLeedInputs(state: AppData, actor: Actor, projectId: string, patch: Partial<LeedInputs>): ActionResult {
  return saveCes(state, actor, projectId, (r) => {
    const next: LeedInputs = { ...r.leed, ...patch, offsite: { ...r.leed.offsite, ...(patch.offsite ?? {}) } }
    const bad = (x: number | null) => x !== null && (!Number.isFinite(x) || x < 0)
    for (const k of ['onsiteReused', 'onsiteTotal', 'furnitureReused', 'furnitureTotal'] as const) if (bad(next[k])) return LEED_ERRORS.amount
    if (next.onsiteReused !== null && next.onsiteTotal !== null && next.onsiteReused > next.onsiteTotal) return LEED_ERRORS.overTotal
    if (next.furnitureReused !== null && next.furnitureTotal !== null && next.furnitureReused > next.furnitureTotal) return LEED_ERRORS.overTotal
    for (const [type, share] of Object.entries(next.offsite)) {
      if (!(type in LEED_TYPE_LABELS)) return LEED_ERRORS.type
      if (share === undefined || !Number.isFinite(share) || share < 0 || share > 1) return LEED_ERRORS.share
    }
    for (const k of ['separatedShare', 'mixedRate'] as const) if (next[k] !== null && (!Number.isFinite(next[k]) || next[k]! < 0 || next[k]! > 1)) return LEED_ERRORS.share
    if (bad(next.targetedT)) return LEED_ERRORS.tonnes
    // A cleared share is dropped rather than kept as nought.
    const offsite = Object.fromEntries(Object.entries(next.offsite).filter(([, v]) => v !== undefined && v > 0)) as LeedInputs['offsite']
    return { ...r, leed: { ...next, offsite } }
  })
}
