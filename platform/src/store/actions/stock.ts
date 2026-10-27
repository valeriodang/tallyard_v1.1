// Design from stock (round 3, BRIEF section 15.6): the architect loads a steel schedule and sets how it is matched
// against the stock the project can see. The match itself is worked out on reading, never stored.
import type { StockMatchSettings } from '../../domain/stockTypes'
import { DEFAULT_STOCK_MATCH, MAX_SCHEDULE_LINES } from '../../domain/reference/stockMatch'
import { SAMPLE_SCHEDULE_CSV } from '../../domain/reference/samples'
import { readSchedule } from '../../domain/engines/schedule'
import type { ActionResult, Actor, AppData } from '../types'
import { ERRORS, isProjectArchitect, projectOrgIds } from '../access'
import { log } from '../notifications'
import { acting, clean, fail, ok, withWorld } from './common'

export const STOCK_ERRORS = {
  offcut: 'Give the shortest offcut in metres, from 0.5 to 6.',
  fileName: 'Choose a CSV file.',
} as const

/** The project's matching settings, or the defaults when the architect has not set any. */
export function stockMatchOf(project: { stockMatch?: StockMatchSettings }): StockMatchSettings {
  return { ...DEFAULT_STOCK_MATCH, ...(project.stockMatch ?? {}) }
}

function architectOn(state: AppData, actor: Actor, projectId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  if (!state.world.projects[projectId]) return ERRORS.noProject
  if (!isProjectArchitect(state, actor.userId, projectId)) return ERRORS.role
  return a
}

/** The architect loads a schedule from a CSV file, or the sample with fileName null. Every line takes the steel need-by date. */
export function loadSteelSchedule(state: AppData, actor: Actor, projectId: string, csv: string | null, fileName: string | null): ActionResult<number> {
  const a = architectOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const p = state.world.projects[projectId]
  const name = fileName === null ? null : clean(fileName, 120)
  if (fileName !== null && !name) return fail(state, STOCK_ERRORS.fileName)
  const read = readSchedule(csv ?? SAMPLE_SCHEDULE_CSV, p.keyDates.steelNeedBy, MAX_SCHEDULE_LINES)
  if (read.error !== null) return fail(state, read.error)
  const w = structuredClone(state.world)
  w.projects[projectId].requirements = read.requirements
  w.projects[projectId].stockMatch = { ...stockMatchOf(p), fileName: name ?? 'Sample schedule', loadedOn: a.today }
  let s = withWorld(state, w)
  const members = read.requirements.reduce((t, r) => t + r.count, 0)
  s = log(s, { at: a.now, orgIds: projectOrgIds(p), projectId, buildingId: null, actorUserId: a.user.id, actor: a.user.name, text: `loaded a steel schedule of ${read.requirements.length} lines and ${members} members`, href: `/app/projects/${projectId}/matching` })
  return ok(s, read.requirements.length)
}

/** The architect clears the schedule. */
export function clearSteelSchedule(state: AppData, actor: Actor, projectId: string): ActionResult {
  const a = architectOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const w = structuredClone(state.world)
  w.projects[projectId].requirements = []
  w.projects[projectId].stockMatch = { ...stockMatchOf(state.world.projects[projectId]), fileName: null, loadedOn: null }
  return ok(withWorld(state, w))
}

export type StockMatchPatch = Partial<Pick<StockMatchSettings, 'cutToLength' | 'minOffcutM' | 'excessRule' | 'allowUnknownGrade'>>

/** The architect changes how the schedule is matched. */
export function saveStockMatch(state: AppData, actor: Actor, projectId: string, patch: StockMatchPatch): ActionResult {
  const a = architectOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  if (patch.minOffcutM !== undefined && (!Number.isFinite(patch.minOffcutM) || patch.minOffcutM < 0.5 || patch.minOffcutM > 6)) return fail(state, STOCK_ERRORS.offcut)
  const now = stockMatchOf(state.world.projects[projectId])
  const next: StockMatchSettings = {
    ...now,
    cutToLength: patch.cutToLength ?? now.cutToLength,
    minOffcutM: patch.minOffcutM ?? now.minOffcutM,
    excessRule: patch.excessRule ?? now.excessRule,
    allowUnknownGrade: patch.allowUnknownGrade ?? now.allowUnknownGrade,
  }
  const w = structuredClone(state.world)
  w.projects[projectId].stockMatch = next
  return ok(withWorld(state, w))
}
