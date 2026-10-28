// The recovery plan's routes (round 3, BRIEF section 15.6): each item's route, suggested from the ranking and the
// pre-deconstruction audit unless the owner chose one, the Level(s) 2.4 score of the plan against the RICS
// business-as-usual case, and each family's cascade of uses. Owner only.
import type { PreDemolitionAudit } from '../../domain/auditTypes'
import { CASCADES, RECOVERY_ROUTES, ROUTE_LABELS, type RecoveryRoute } from '../../domain/reference/recovery'
import { LEVELS_COEFFICIENTS } from '../../domain/reference/levels'
import { itemMeasures } from '../../domain/engines/measures'
import { isReuseRoute, planSummary, suggestedRoute } from '../../domain/engines/recovery'
import { titleFor } from '../../domain/reference/families'
import * as f from '../../domain/format'
import type { AppData, Viewer } from '../types'
import { buildingHeader, priorityFor } from './owner'
import { stacked } from './roles-views'

export type RecoveryPlanRow = {
  itemId: string
  tag: string
  title: string
  massT: number
  massText: string
  route: RecoveryRoute
  routeLabel: string
  suggested: RecoveryRoute
  suggestedLabel: string
  /** True when the owner chose the route; false when it is the suggestion. */
  chosen: boolean
  reuse: boolean
  coefficientText: string
  cascade: string[]
}

/** One route's mass and share of the plan; at and size place it on a bar of 100. */
export type RouteShare = { route: RecoveryRoute; label: string; massT: number; share: number; text: string; reuse: boolean; at: number; size: number }

export type RecoveryPlanView = {
  canEdit: boolean
  rows: RecoveryPlanRow[]
  options: { value: RecoveryRoute; label: string; text: string }[]
  scoreText: string
  bauScoreText: string
  reusedText: string
  gainText: string
  totalText: string
  byRoute: RouteShare[]
  note: string
  empty: boolean
}

const NOTE =
  'Level(s) 2.4 weights each route by mass: reuse scores 0.9 to 1.0, recycling 0.5 to 0.75, energy recovery 0.15 and landfill 0.01. Business as usual is the RICS 2nd edition split for each material.'

function score(x: number | null): string {
  return x === null ? 'Not scored' : x.toFixed(2)
}

/** The broker route the building's pre-deconstruction audit gives the item, if any. */
function auditRouteOf(state: AppData, buildingId: string, itemId: string) {
  const audit = Object.values(state.audits).find((x): x is PreDemolitionAudit => x.buildingId === buildingId && x.kind === 'pre_demolition')
  return audit?.rows.find((r) => r.itemId === itemId)?.broker.route ?? null
}

/** Each ranked item's route: the owner's choice, else the one suggested. */
function routedItems(state: AppData, buildingId: string) {
  const chosen = state.recoveryPlans[buildingId]?.routes ?? {}
  return priorityFor(state, buildingId).rows.map((p) => {
    const item = state.world.items[p.itemId]
    const suggested = suggestedRoute(item.family, p.route, auditRouteOf(state, buildingId, item.id))
    return { item, suggested, route: chosen[item.id] ?? suggested, chosen: chosen[item.id] !== undefined }
  })
}

/** The recovery plan's totals for a building, for the plan itself and the owner's indicators. */
export function recoverySummaryOf(state: AppData, buildingId: string) {
  return planSummary(routedItems(state, buildingId).map((r) => ({ family: r.item.family, massT: itemMeasures(r.item).massT, route: r.route })))
}

export function recoveryPlanView(state: AppData, viewer: Viewer, buildingId: string): RecoveryPlanView | null {
  const header = buildingHeader(state, viewer, buildingId)
  if (!header || header.side !== 'owner') return null
  const rows: RecoveryPlanRow[] = routedItems(state, buildingId).map(({ item, suggested, route, chosen }) => {
    const massT = itemMeasures(item).massT
    const levels = RECOVERY_ROUTES.find((r) => r.id === route)!.levels
    return {
      itemId: item.id,
      tag: item.tag,
      title: titleFor(item.spec),
      massT,
      massText: f.massT(massT),
      route,
      routeLabel: ROUTE_LABELS[route],
      suggested,
      suggestedLabel: ROUTE_LABELS[suggested],
      chosen,
      reuse: isReuseRoute(route),
      coefficientText: `${LEVELS_COEFFICIENTS[levels].label}, ${LEVELS_COEFFICIENTS[levels].coefficient.toFixed(2)}`,
      cascade: CASCADES[item.family],
    }
  })
  const s = planSummary(rows.map((r) => ({ family: state.world.items[r.itemId].family, massT: r.massT, route: r.route })))
  const bar = stacked(s.byRoute.map((x) => (s.totalT > 0 ? (100 * x.massT) / s.totalT : 0)))
  return {
    canEdit: true,
    rows,
    options: RECOVERY_ROUTES.map((r) => ({ value: r.id, label: r.label, text: r.text })),
    scoreText: score(s.levelsScore),
    bauScoreText: score(s.bauLevelsScore),
    reusedText: f.massT(s.reusedT),
    gainText: `${s.gainT >= 0 ? '' : 'minus '}${f.massT(Math.abs(s.gainT))}`,
    totalText: f.massT(s.totalT),
    byRoute: s.byRoute.map((x, i) => {
      const share = s.totalT > 0 ? x.massT / s.totalT : 0
      return { route: x.route, label: ROUTE_LABELS[x.route], massT: x.massT, share, text: `${f.massT(x.massT)}, ${f.percent(share)}`, reuse: isReuseRoute(x.route), ...bar[i] }
    }),
    note: NOTE,
    empty: rows.length === 0,
  }
}
