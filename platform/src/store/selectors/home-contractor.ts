// The deconstruction contractor's dashboard (round 3, BRIEF section 15.2): the buildings an owner or surveyor
// appointed the firm to, the items still to date and the dates set, each building drawn from its survey. Stage 3
// adds methods, destinations and the true cost of waste. It reads only what the contractor side may see: no lots,
// prices, visibility or buyers.
import type { Typology } from '../../domain/v1types'
import { buildingSketch, type BuildingSketch } from '../../domain/sketch'
import { formatDate } from '../../domain/dates'
import type { AppData, Viewer } from '../types'
import { buildingSide, buildingsOfUser, roleOfUser, userOf } from '../access'
import { activityFor, firstName, greeting, longDate, todayOf, type ActivityRow } from './common'
import { itemsOf } from './owner'
import { activitySummary, typologyCounts, type ActivitySummary, type TileState } from './dashboard'

export type ContractorBuildingRow = {
  id: string
  name: string
  ownerName: string
  href: string
  availabilityHref: string
  itemCount: number
  datedCount: number
  dismantlingText: string
  sketch: BuildingSketch
  byTypology: Record<Typology, number>
}

export type ContractorDashboard = {
  greeting: string
  dateText: string
  tiles: { buildings: number; owners: number; dated: number; undated: number; undatedState: TileState | null; datedSubText: string; undatedSubText: string; buildingsSubText: string }
  buildings: ContractorBuildingRow[]
  activity: ActivityRow[]
  activitySummary: ActivitySummary
  firstRun: boolean
}

export function contractorDashboard(state: AppData, viewer: Viewer): ContractorDashboard | null {
  if (roleOfUser(state, viewer.userId) !== 'contractor') return null
  const user = userOf(state, viewer.userId)
  if (!user) return null
  const buildings: ContractorBuildingRow[] = buildingsOfUser(state, viewer.userId)
    .filter((b) => buildingSide(state, viewer.userId, b.id) === 'contractor')
    .map((b) => {
      const items = itemsOf(state, b.id)
      const families = items.map((i) => i.family)
      return {
        id: b.id,
        name: b.name,
        ownerName: b.ownerOrgId ? (state.world.orgs[b.ownerOrgId]?.name ?? '') : 'No owner yet',
        href: `/app/buildings/${b.id}`,
        availabilityHref: `/app/buildings/${b.id}/availability`,
        itemCount: items.length,
        datedCount: items.filter((i) => !!i.contractorAvailableFrom).length,
        dismantlingText: b.programme.dismantlingStart ? `Dismantling from ${formatDate(b.programme.dismantlingStart)}` : 'No dismantling date yet',
        sketch: buildingSketch({ id: b.id, storeys: b.storeys ?? null, structureType: b.structureType ?? '', structure: b.structure ?? [] }, families),
        byTypology: typologyCounts(families),
      }
    })
  const items = buildings.reduce((n, b) => n + b.itemCount, 0)
  const dated = buildings.reduce((n, b) => n + b.datedCount, 0)
  const waiting = buildings.filter((b) => b.datedCount < b.itemCount).length
  const owners = new Set(buildings.map((b) => b.ownerName)).size
  // Entries addressed to the firm: its own dates and the owners' invitations.
  const activity = activityFor(state, viewer)
  return {
    greeting: greeting(viewer.now, firstName(user.name)),
    dateText: longDate(todayOf(viewer)),
    tiles: {
      buildings: buildings.length,
      owners,
      dated,
      undated: items - dated,
      undatedState: items - dated > 0 ? { state: 'warning', label: 'To do' } : null,
      datedSubText: items === 0 ? 'No items recorded yet' : `Of ${items} ${items === 1 ? 'item' : 'items'}. The owner decides what buyers see`,
      undatedSubText: items - dated === 0 ? 'Nothing waiting on you' : 'Items with no expected date yet',
      buildingsSubText: waiting === 0 ? 'Every building dated' : `${waiting} ${waiting === 1 ? 'building' : 'buildings'} with items still to date`,
    },
    buildings,
    activity,
    activitySummary: activitySummary(activity),
    firstRun: buildings.length === 0,
  }
}
