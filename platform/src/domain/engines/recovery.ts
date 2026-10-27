// The recovery plan, version 2 (round 3, BRIEF section 15.6): a route for each item from nine, the Level(s) 2.4 score
// of the plan, and how much more it reuses than the RICS business-as-usual case. Pure: the store and the screens
// call these and never compute (P2).
import type { FamilyId } from '../types'
import { FALLBACK_ROUTE, RECOVERY_ROUTES, type RecoveryRoute } from '../reference/recovery'
import { circularityScore } from './circularity'
import { FAMILY_EOL_MATERIAL, familyBauSplit, reuseGainOverBau, splitCircularity } from './eol'

/**
 * The route suggested for an item: kept or reused on site when the audit says so, reused elsewhere when it is worth
 * recovering, else the family's usual route when it is not reused.
 */
export function suggestedRoute(family: FamilyId, priority: 'recover' | 'recycle', auditRoute: 'reuse_on_site' | 'marketplace' | 'other_outlet' | 'none' | null): RecoveryRoute {
  if (priority === 'recover' && auditRoute === 'reuse_on_site') return 'reuse_on_site'
  if (priority === 'recover') return 'reuse_off_site'
  return FALLBACK_ROUTE[family]
}

export function isReuseRoute(route: RecoveryRoute): boolean {
  return RECOVERY_ROUTES.find((r) => r.id === route)!.reuse
}

export type PlannedItem = { family: FamilyId; massT: number; route: RecoveryRoute }

export type PlanSummary = {
  totalT: number
  /** Tonnes by route, in route order, only the routes used. */
  byRoute: { route: RecoveryRoute; massT: number }[]
  reusedT: number
  /** The Level(s) 2.4 score of the plan, 0 to 1. Null with no mass. */
  levelsScore: number | null
  /** The score the same items would have going the RICS business-as-usual way for their material. Null with no mass. */
  bauLevelsScore: number | null
  /** Tonnes the business-as-usual case would reuse of the same items, and the plan's gain over it. */
  bauReusedT: number
  gainT: number
}

export function planSummary(items: PlannedItem[]): PlanSummary {
  const byRoute = RECOVERY_ROUTES.map((r) => ({ route: r.id, massT: items.filter((i) => i.route === r.id).reduce((s, i) => s + i.massT, 0) })).filter((x) => x.massT > 0)
  let bauReusedT = 0
  let reusedT = 0
  for (const i of items) {
    const g = reuseGainOverBau(i.family, i.massT, isReuseRoute(i.route) ? 1 : 0)
    bauReusedT += g.bauReusedT
    reusedT += g.reusedT
  }
  const totalT = items.reduce((s, i) => s + i.massT, 0)
  return {
    totalT,
    byRoute,
    reusedT,
    levelsScore: circularityScore(items.map((i) => ({ massT: i.massT, route: RECOVERY_ROUTES.find((r) => r.id === i.route)!.levels }))),
    bauLevelsScore: totalT > 0 ? items.reduce((s, i) => s + i.massT * splitCircularity(familyBauSplit(i.family), FAMILY_EOL_MATERIAL[i.family].material), 0) / totalT : null,
    bauReusedT,
    gainT: reusedT - bauReusedT,
  }
}
