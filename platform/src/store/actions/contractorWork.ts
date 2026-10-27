// The deconstruction contractor's workspace (round 3, BRIEF section 15.4): how each item comes out, where every stream
// goes with its duty of care papers, the firm's register of carriers, and title to the arisings, which the owner may
// pass to the contractor so that it lists and sells what comes out. The contractor writes its records; the owner
// reads them. Every input is checked and trimmed here.
import type { Destination } from '../../domain/types'
import type { BuildingWork, Carrier, CarrierTier, DestinationEntry, DismantlingMethod, ItemMethod } from '../../domain/contractorTypes'
import type { PreDemolitionAudit } from '../../domain/auditTypes'
import type { ActionResult, Actor, AppData } from '../types'
import { DESTINATION_ORDER, METHOD_LABELS, forecastFromAudit } from '../../domain/engines/contractorWork'
import { ERRORS, buildingOrgIds, canBeContractor, isBuildingContractor, isBuildingOwner } from '../access'
import { log, notify } from '../notifications'
import { acting, clean, fail, isIsoDate, ok, withWorld } from './common'

export const WORK_ERRORS = {
  noItem: 'That item is not in this building.',
  method: 'Choose a method from the list.',
  score: 'Extractability runs from 0 to 4.',
  number: 'Enter tonnes of zero or more.',
  route: 'Choose where it goes.',
  date: 'Enter a real date.',
  label: 'Describe the stream.',
  noEntry: 'That stream could not be found.',
  carrier: 'Choose a carrier from your register.',
  carrierName: 'Give the carrier a name.',
  tier: 'Choose upper or lower tier.',
  carrierInUse: 'A stream names this carrier. Change the stream first.',
  noAudit: 'This building has no pre-deconstruction audit yet.',
  noContractor: 'Appoint a deconstruction contractor first.',
  openRequests: 'Answer the open requests on this building first, so no buyer is left waiting on the wrong seller.',
} as const

const MAX_DESTINATIONS = 300
const MAX_CARRIERS = 40

function num(x: unknown, max?: number): number | null | 'bad' {
  if (x === null || x === undefined || x === '') return null
  const n = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(n) || n < 0 || (max !== undefined && n > max)) return 'bad'
  return n
}

/** The appointed contractor acting on its building. */
function contractorOn(state: AppData, actor: Actor, buildingId: string) {
  const a = acting(state, actor)
  if (typeof a === 'string') return a
  if (!state.world.buildings[buildingId]) return ERRORS.noBuilding
  if (!isBuildingContractor(state, actor.userId, buildingId)) return ERRORS.noAccess
  return a
}

/** The building's records for its current contractor, or a fresh set when it has none yet (or a new contractor). */
export function workFor(state: AppData, buildingId: string): BuildingWork | null {
  const b = state.world.buildings[buildingId]
  if (!b || !b.contractorOrgId) return null
  const w = state.contractorWork.buildings[buildingId]
  return w && w.contractorOrgId === b.contractorOrgId ? w : null
}

function withWork(state: AppData, work: BuildingWork): AppData {
  return { ...state, contractorWork: { ...state.contractorWork, buildings: { ...state.contractorWork.buildings, [work.buildingId]: work } } }
}

function current(state: AppData, buildingId: string, now: string): BuildingWork {
  const b = state.world.buildings[buildingId]
  return workFor(state, buildingId) ?? { buildingId, contractorOrgId: b.contractorOrgId!, methods: {}, destinations: [], updatedAt: now }
}

export type MethodInput = { method: DismantlingMethod | null; extractability: number | null; protection: string; note: string }

/** The contractor records how an item comes out. */
export function setItemMethod(state: AppData, actor: Actor, buildingId: string, itemId: string, input: MethodInput): ActionResult {
  const a = contractorOn(state, actor, buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (state.world.items[itemId]?.buildingId !== buildingId) return fail(state, WORK_ERRORS.noItem)
  if (input.method !== null && !(input.method in METHOD_LABELS)) return fail(state, WORK_ERRORS.method)
  const e = num(input.extractability, 4)
  if (e === 'bad' || (e !== null && !Number.isInteger(e))) return fail(state, WORK_ERRORS.score)
  const work = current(state, buildingId, a.now)
  const method: ItemMethod = { method: input.method, extractability: e, protection: clean(input.protection, 500), note: clean(input.note, 1000), updatedAt: a.now, byUserId: a.user.id }
  return ok(withWork(state, { ...work, methods: { ...work.methods, [itemId]: method }, updatedAt: a.now }))
}

export type DestinationInput = Omit<DestinationEntry, 'id' | 'auditRowId'> & { id?: string }

/** The contractor adds a stream to the destination log, or updates one. */
export function saveDestination(state: AppData, actor: Actor, buildingId: string, input: DestinationInput): ActionResult<string> {
  const a = contractorOn(state, actor, buildingId)
  if (typeof a === 'string') return fail(state, a)
  if (!clean(input.description, 200)) return fail(state, WORK_ERRORS.label)
  if (!DESTINATION_ORDER.includes(input.route as Destination)) return fail(state, WORK_ERRORS.route)
  const forecastT = num(input.forecastT)
  const actualT = num(input.actualT)
  if (forecastT === 'bad' || actualT === 'bad') return fail(state, WORK_ERRORS.number)
  if (input.movedOn !== null && !isIsoDate(input.movedOn)) return fail(state, WORK_ERRORS.date)
  const carriers = state.contractorWork.carriers[a.org.id] ?? []
  if (input.carrierId !== null && !carriers.some((c) => c.id === input.carrierId)) return fail(state, WORK_ERRORS.carrier)
  const work = current(state, buildingId, a.now)
  const existing = input.id ? work.destinations.find((d) => d.id === input.id) : undefined
  if (input.id && !existing) return fail(state, WORK_ERRORS.noEntry)
  if (!existing && work.destinations.length >= MAX_DESTINATIONS) return fail(state, WORK_ERRORS.number)
  const id = existing?.id ?? nextId(`${buildingId}_d`, work.destinations.map((d) => d.id))
  const entry: DestinationEntry = {
    id,
    description: clean(input.description, 200),
    ewcCode: clean(input.ewcCode, 20),
    route: input.route,
    forecastT,
    actualT,
    carrierId: input.carrierId,
    facility: clean(input.facility, 120),
    permitRef: clean(input.permitRef, 60),
    transferNoteRef: clean(input.transferNoteRef, 60),
    movedOn: input.movedOn,
    auditRowId: existing?.auditRowId ?? null,
    note: clean(input.note, 1000),
  }
  const destinations = existing ? work.destinations.map((d) => (d.id === id ? entry : d)) : [...work.destinations, entry]
  let s = withWork(state, { ...work, destinations, updatedAt: a.now })
  // The owner hears the first time a stream is weighed out, so the record of what went where builds as it happens.
  if (actualT !== null && (existing?.actualT ?? null) === null) {
    const b = state.world.buildings[buildingId]
    s = log(s, { at: a.now, orgIds: buildingOrgIds(b), buildingId, projectId: null, actorUserId: a.user.id, actor: a.user.name, text: `logged ${entry.description} as moved`, href: `/app/buildings/${buildingId}/destinations` })
  }
  return ok(s, id)
}

export function removeDestination(state: AppData, actor: Actor, buildingId: string, entryId: string): ActionResult {
  const a = contractorOn(state, actor, buildingId)
  if (typeof a === 'string') return fail(state, a)
  const work = workFor(state, buildingId)
  if (!work || !work.destinations.some((d) => d.id === entryId)) return fail(state, WORK_ERRORS.noEntry)
  return ok(withWork(state, { ...work, destinations: work.destinations.filter((d) => d.id !== entryId), updatedAt: a.now }))
}

/** Adds the forecast of every audit line not yet in the log. Returns how many streams were added. */
export function forecastDestinationsFromAudit(state: AppData, actor: Actor, buildingId: string): ActionResult<number> {
  const a = contractorOn(state, actor, buildingId)
  if (typeof a === 'string') return fail(state, a)
  const audit = Object.values(state.audits).find((x): x is PreDemolitionAudit => x.buildingId === buildingId && x.kind === 'pre_demolition')
  if (!audit) return fail(state, WORK_ERRORS.noAudit)
  const work = current(state, buildingId, a.now)
  const have = new Set(work.destinations.map((d) => d.auditRowId).filter(Boolean))
  const taken = work.destinations.map((d) => d.id)
  const added = forecastFromAudit(
    audit.rows.filter((r) => !have.has(r.id)),
    () => {
      const id = nextId(`${buildingId}_d`, taken)
      taken.push(id)
      return id
    },
  )
  if (added.length === 0) return ok(state, 0)
  return ok(withWork(state, { ...work, destinations: [...work.destinations, ...added], updatedAt: a.now }), added.length)
}

export type CarrierInput = Omit<Carrier, 'id'> & { id?: string }

/** A deconstruction firm adds a carrier to its register, or updates one. */
export function saveCarrier(state: AppData, actor: Actor, input: CarrierInput): ActionResult<string> {
  const a = acting(state, actor)
  if (typeof a === 'string') return fail(state, a)
  if (!canBeContractor(a.role)) return fail(state, ERRORS.role)
  const name = clean(input.name, 120)
  if (!name) return fail(state, WORK_ERRORS.carrierName)
  if (input.tier !== 'upper' && input.tier !== 'lower') return fail(state, WORK_ERRORS.tier)
  if (input.expiresOn !== null && !isIsoDate(input.expiresOn)) return fail(state, WORK_ERRORS.date)
  const list = state.contractorWork.carriers[a.org.id] ?? []
  const existing = input.id ? list.find((c) => c.id === input.id) : undefined
  if (input.id && !existing) return fail(state, WORK_ERRORS.carrier)
  if (!existing && list.length >= MAX_CARRIERS) return fail(state, WORK_ERRORS.carrier)
  const id = existing?.id ?? nextId(`${a.org.id}_c`, list.map((c) => c.id))
  const carrier: Carrier = { id, name, registration: clean(input.registration, 30).toUpperCase(), tier: input.tier as CarrierTier, expiresOn: input.expiresOn }
  const next = existing ? list.map((c) => (c.id === id ? carrier : c)) : [...list, carrier]
  return ok({ ...state, contractorWork: { ...state.contractorWork, carriers: { ...state.contractorWork.carriers, [a.org.id]: next } } }, id)
}

export function removeCarrier(state: AppData, actor: Actor, carrierId: string): ActionResult {
  const a = acting(state, actor)
  if (typeof a === 'string') return fail(state, a)
  if (!canBeContractor(a.role)) return fail(state, ERRORS.role)
  const list = state.contractorWork.carriers[a.org.id] ?? []
  if (!list.some((c) => c.id === carrierId)) return fail(state, WORK_ERRORS.carrier)
  const inUse = Object.values(state.contractorWork.buildings).some((w) => w.contractorOrgId === a.org.id && w.destinations.some((d) => d.carrierId === carrierId))
  if (inUse) return fail(state, WORK_ERRORS.carrierInUse)
  return ok({ ...state, contractorWork: { ...state.contractorWork, carriers: { ...state.contractorWork.carriers, [a.org.id]: list.filter((c) => c.id !== carrierId) } } })
}

/**
 * The owner passes title to the building's arisings to its deconstruction contractor, or takes it back. The seller
 * then sets what buyers see and answers their requests; requests already decided stay with whoever decided them.
 * The projects the owner shared lots with keep their access under the new seller. Refused while a request waits.
 */
export function setArisingsTitle(state: AppData, actor: Actor, buildingId: string, holder: 'owner' | 'contractor'): ActionResult {
  const a = acting(state, actor)
  if (typeof a === 'string') return fail(state, a)
  const b = state.world.buildings[buildingId]
  if (!b) return fail(state, ERRORS.noBuilding)
  if (!isBuildingOwner(state, actor.userId, buildingId)) return fail(state, ERRORS.role)
  if (holder !== 'owner' && holder !== 'contractor') return fail(state, ERRORS.role)
  if (holder === 'contractor' && !b.contractorOrgId) return fail(state, WORK_ERRORS.noContractor)
  if (b.arisingsTitle === holder) return ok(state)
  const lots = new Set(Object.values(state.world.lots).filter((l) => state.world.items[l.itemId]?.buildingId === buildingId).map((l) => l.id))
  if (Object.values(state.reservations).some((r) => lots.has(r.lotId) && r.status === 'pending')) return fail(state, WORK_ERRORS.openRequests)
  const contractorOrgId = b.contractorOrgId!
  const w = structuredClone(state.world)
  w.buildings[buildingId].arisingsTitle = holder
  if (holder === 'contractor' && b.ownerOrgId) {
    for (const p of Object.values(w.projects)) if (p.approvedByOwnerOrgIds.includes(b.ownerOrgId) && !p.approvedByOwnerOrgIds.includes(contractorOrgId)) p.approvedByOwnerOrgIds = [...p.approvedByOwnerOrgIds, contractorOrgId]
  }
  let s = withWorld(state, w)
  const contractor = state.world.orgs[contractorOrgId]?.name ?? 'the contractor'
  const href = `/app/buildings/${buildingId}/listings`
  s = log(s, { at: a.now, orgIds: buildingOrgIds(b), buildingId, projectId: null, actorUserId: a.user.id, actor: a.user.name, text: holder === 'contractor' ? `passed title to the arisings to ${contractor}` : `took back title to the arisings from ${contractor}`, href })
  s = notify(s, {
    orgIds: [contractorOrgId],
    kind: 'appointed',
    title: holder === 'contractor' ? `${a.org.name} passed title to the arisings of ${b.name} to you` : `${a.org.name} took back title to the arisings of ${b.name}`,
    body: holder === 'contractor' ? 'You now list and sell what comes out. Buyers stay anonymous until you accept a request.' : 'The owner lists and sells what comes out again. Your dates and records stay.',
    href: holder === 'contractor' ? href : `/app/buildings/${buildingId}`,
    at: a.now,
    actorUserId: a.user.id,
  })
  return ok(s)
}

/** The next free local ID with this stem, like bld_x_d3. */
function nextId(stem: string, taken: string[]): string {
  let n = taken.length + 1
  while (taken.includes(`${stem}${n}`)) n++
  return `${stem}${n}`
}
