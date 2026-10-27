// The owner's recovery plan (round 3, BRIEF section 15.6): a route for each item, chosen from nine. An item with no
// chosen route takes the suggested one, so the owner only records where they differ.
import { RECOVERY_ROUTES, type RecoveryRoute } from '../../domain/reference/recovery'
import type { ActionResult, Actor, AppData } from '../types'
import { ERRORS, isBuildingOwner } from '../access'
import { acting, fail, ok } from './common'

export const RECOVERY_ERRORS = {
  noItem: 'That item is not in this building.',
  route: 'Choose a route from the list.',
} as const

/** The owner sets an item's route, or clears it back to the suggestion with null. */
export function setItemRoute(state: AppData, actor: Actor, buildingId: string, itemId: string, route: RecoveryRoute | null): ActionResult {
  const a = acting(state, actor)
  if (typeof a === 'string') return fail(state, a)
  if (!state.world.buildings[buildingId]) return fail(state, ERRORS.noBuilding)
  if (!isBuildingOwner(state, actor.userId, buildingId)) return fail(state, ERRORS.noAccess)
  if (state.world.items[itemId]?.buildingId !== buildingId) return fail(state, RECOVERY_ERRORS.noItem)
  if (route !== null && !RECOVERY_ROUTES.some((r) => r.id === route)) return fail(state, RECOVERY_ERRORS.route)
  const plan = state.recoveryPlans[buildingId]
  const routes = { ...(plan?.routes ?? {}) }
  if (route === null) delete routes[itemId]
  else routes[itemId] = route
  return ok({ ...state, recoveryPlans: { ...state.recoveryPlans, [buildingId]: { routes, updatedAt: a.now, byUserId: a.user.id } } })
}
