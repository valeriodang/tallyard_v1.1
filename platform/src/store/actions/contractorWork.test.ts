import { describe, expect, it } from 'vitest'
import { actor, fresh, must, NOW, refused, U, viewer } from '../../test/fixtures'
import { forecastDestinationsFromAudit, removeCarrier, removeDestination, saveCarrier, saveDestination, setArisingsTitle, setItemMethod, WORK_ERRORS, workFor, type DestinationInput } from './contractorWork'
import { appointContractor, CONTRACTOR_ERRORS } from './contractor'
import { decideReservation, requestReservation } from './reservations'
import { setLotVisibility } from './owner'
import { ERRORS } from '../access'
import { itemByTag, lotForItem, MERROWGATE_ID, ORG_IDS, TIVERNE_ID } from '../../domain/seed/world'
import { FENNICK_ID } from '../../sandbox/sampleIds'
import { sellerOrgOfLot } from '../../domain/visibility'
import * as sel from '../selectors'
import { projectWishlist } from '../lots'
import type { AppData } from '../types'

const stream = (over: Partial<DestinationInput> = {}): DestinationInput => ({ description: 'Plasterboard from the partitions', ewcCode: '17 08 02', route: 'recycled_off_site', forecastT: 38, actualT: null, carrierId: null, facility: '', permitRef: '', transferNoteRef: '', movedOn: null, note: '', ...over })

/** The seeded sandbox with the waiting TH-02 request declined, so title may pass. */
function settled(): AppData {
  const s = fresh()
  const r = Object.values(s.reservations).find((x) => x.status === 'pending')!
  return must(decideReservation(s, actor(U.tom), r.id, 'declined', 'Not this one.')).state
}

describe('the seeded workspace', () => {
  it("holds Fennick Dismantling's carriers, methods and the forecast drawn from the audit", () => {
    const s = fresh()
    const w = workFor(s, TIVERNE_ID)!
    expect(w.contractorOrgId).toBe(FENNICK_ID)
    expect(Object.keys(w.methods)).toHaveLength(10)
    expect(w.destinations.length).toBeGreaterThan(17)
    expect(w.destinations.filter((d) => d.actualT !== null).map((d) => [d.route, d.actualT])).toEqual([['hazardous_disposal', 1.8]])
    expect(s.contractorWork.carriers[FENNICK_ID].map((c) => c.name)).toEqual(['Haulier A', 'Haulier C', 'Haulier B'])
  })
})

describe('the method of each item', () => {
  it('lets the contractor record it, and nobody else', () => {
    const s = fresh()
    const th09 = itemByTag(s.world, 'TH-09').id
    const r = must(setItemMethod(s, actor(U.kofi), TIVERNE_ID, th09, { method: 'crane_lift', extractability: 2, protection: '  Lifting eyes cast in  ', note: '' }))
    expect(workFor(r.state, TIVERNE_ID)!.methods[th09]).toMatchObject({ method: 'crane_lift', extractability: 2, protection: 'Lifting eyes cast in', byUserId: U.kofi, updatedAt: NOW })
    for (const who of [U.tom, U.dana, U.priya]) refused(s, setItemMethod(s, actor(who), TIVERNE_ID, th09, { method: 'unbolt', extractability: 3, protection: '', note: '' }), ERRORS.noAccess)
  })

  it('refuses an unknown method, a score out of range and an item of another building', () => {
    const s = fresh()
    const th09 = itemByTag(s.world, 'TH-09').id
    refused(s, setItemMethod(s, actor(U.kofi), TIVERNE_ID, th09, { method: 'explode' as never, extractability: 2, protection: '', note: '' }), WORK_ERRORS.method)
    refused(s, setItemMethod(s, actor(U.kofi), TIVERNE_ID, th09, { method: 'unbolt', extractability: 5, protection: '', note: '' }), WORK_ERRORS.score)
    refused(s, setItemMethod(s, actor(U.kofi), TIVERNE_ID, th09, { method: 'unbolt', extractability: 1.5, protection: '', note: '' }), WORK_ERRORS.score)
    const other = Object.values(s.world.items).find((i) => i.buildingId !== TIVERNE_ID)!.id
    refused(s, setItemMethod(s, actor(U.kofi), TIVERNE_ID, other, { method: 'unbolt', extractability: 3, protection: '', note: '' }), WORK_ERRORS.noItem)
  })
})

describe('the destination log', () => {
  it('adds a stream with a local ID, updates it, and logs the first weighing for the owner', () => {
    const s = fresh()
    const before = workFor(s, TIVERNE_ID)!.destinations.length
    const a = must(saveDestination(s, actor(U.kofi), TIVERNE_ID, stream()))
    expect(a.value).toBe(`${TIVERNE_ID}_d${before + 1}`)
    expect(a.state.activity.length).toBe(s.activity.length)
    const b = must(saveDestination(a.state, actor(U.kofi), TIVERNE_ID, stream({ id: a.value, actualT: 36.5, movedOn: '2026-10-07', carrierId: `${FENNICK_ID}_c1`, facility: 'Gypsum recycler, Midlands', permitRef: 'EPR/GR1234', transferNoteRef: 'WTN-0101' })))
    const e = workFor(b.state, TIVERNE_ID)!.destinations.find((d) => d.id === a.value)!
    expect(e).toMatchObject({ actualT: 36.5, auditRowId: null, carrierId: `${FENNICK_ID}_c1` })
    expect(b.state.activity[0]).toMatchObject({ text: 'logged Plasterboard from the partitions as moved', href: `/app/buildings/${TIVERNE_ID}/destinations` })
    expect(b.state.activity[0].orgIds).toContain(ORG_IDS.ostlea)
  })

  it('refuses negative tonnes, an unknown destination, a carrier not on the register and a nameless stream', () => {
    const s = fresh()
    refused(s, saveDestination(s, actor(U.kofi), TIVERNE_ID, stream({ forecastT: -1 })), WORK_ERRORS.number)
    refused(s, saveDestination(s, actor(U.kofi), TIVERNE_ID, stream({ route: 'river' as never })), WORK_ERRORS.route)
    refused(s, saveDestination(s, actor(U.kofi), TIVERNE_ID, stream({ carrierId: 'org_other_c1' })), WORK_ERRORS.carrier)
    refused(s, saveDestination(s, actor(U.kofi), TIVERNE_ID, stream({ description: ' ' })), WORK_ERRORS.label)
    refused(s, saveDestination(s, actor(U.kofi), TIVERNE_ID, stream({ movedOn: '2026-13-01' })), WORK_ERRORS.date)
    refused(s, saveDestination(s, actor(U.tom), TIVERNE_ID, stream()), ERRORS.noAccess)
  })

  it('removes a stream', () => {
    const s = fresh()
    const a = must(saveDestination(s, actor(U.kofi), TIVERNE_ID, stream()))
    const b = must(removeDestination(a.state, actor(U.kofi), TIVERNE_ID, a.value))
    expect(workFor(b.state, TIVERNE_ID)!.destinations.some((d) => d.id === a.value)).toBe(false)
  })

  it('forecasts only the audit lines not yet in the log', () => {
    const s0 = fresh()
    const s = { ...s0, contractorWork: { ...s0.contractorWork, buildings: {} } }
    const a = must(forecastDestinationsFromAudit(s, actor(U.kofi), TIVERNE_ID))
    expect(a.value).toBe(workFor(s0, TIVERNE_ID)!.destinations.length)
    const b = forecastDestinationsFromAudit(a.state, actor(U.kofi), TIVERNE_ID)
    expect(b.value).toBe(0)
    expect(b.state).toBe(a.state)
  })

  it('starts afresh for a new contractor', () => {
    const s = fresh()
    const r = must(appointContractor(s, actor(U.tom), TIVERNE_ID, ORG_IDS.tarnbrook))
    expect(workFor(r.state, TIVERNE_ID)).toBeNull()
    expect(r.state.contractorWork.buildings[TIVERNE_ID].contractorOrgId).toBe(FENNICK_ID)
  })
})

describe('the carrier register', () => {
  it('adds a carrier with its registration in capitals, and refuses to remove one a stream names', () => {
    const s = fresh()
    const a = must(saveCarrier(s, actor(U.kofi), { name: 'Haulier D', registration: 'cbdu555001', tier: 'upper', expiresOn: '2027-06-30' }))
    expect(a.state.contractorWork.carriers[FENNICK_ID].find((c) => c.id === a.value)).toMatchObject({ registration: 'CBDU555001', tier: 'upper' })
    must(removeCarrier(a.state, actor(U.kofi), a.value))
    refused(s, removeCarrier(s, actor(U.kofi), `${FENNICK_ID}_c2`), WORK_ERRORS.carrierInUse)
  })

  it('belongs to a firm that works as a contractor', () => {
    const s = fresh()
    refused(s, saveCarrier(s, actor(U.tom), { name: 'Haulier D', registration: '', tier: 'upper', expiresOn: null }), ERRORS.role)
    refused(s, saveCarrier(s, actor(U.kofi), { name: ' ', registration: '', tier: 'upper', expiresOn: null }), WORK_ERRORS.carrierName)
    refused(s, saveCarrier(s, actor(U.kofi), { name: 'Haulier D', registration: '', tier: 'middle' as never, expiresOn: null }), WORK_ERRORS.tier)
  })
})

describe('title to the arisings', () => {
  it('waits while a request waits, then passes to the contractor, who sells and shares as the owner did', () => {
    const s0 = fresh()
    refused(s0, setArisingsTitle(s0, actor(U.tom), TIVERNE_ID, 'contractor'), WORK_ERRORS.openRequests)
    const s = settled()
    refused(s, setArisingsTitle(s, actor(U.kofi), TIVERNE_ID, 'contractor'), ERRORS.role)
    const r = must(setArisingsTitle(s, actor(U.tom), TIVERNE_ID, 'contractor'))
    expect(r.state.world.buildings[TIVERNE_ID].arisingsTitle).toBe('contractor')
    const lot = lotForItem(r.state.world, itemByTag(r.state.world, 'TH-07').id)
    expect(sellerOrgOfLot(r.state.world, lot.id)).toBe(FENNICK_ID)
    // The project the owner shared with keeps its access.
    expect(r.state.world.projects[MERROWGATE_ID].approvedByOwnerOrgIds).toEqual([ORG_IDS.ostlea, FENNICK_ID])
    expect(r.state.notifications.find((n) => n.orgId === FENNICK_ID && n.at === NOW)!.title).toBe('Ostlea Estates passed title to the arisings of Tiverne House to you')
    // The contractor now lists; the owner no longer does.
    must(setLotVisibility(r.state, actor(U.kofi), lot.id, { visibility: 'published', ask: 180, reserve: 165 }))
    refused(r.state, setLotVisibility(r.state, actor(U.tom), lot.id, { visibility: 'published', ask: 180, reserve: 165 }), ERRORS.role)
    // While it holds title the contractor cannot be replaced.
    refused(r.state, appointContractor(r.state, actor(U.tom), TIVERNE_ID, ORG_IDS.tarnbrook), CONTRACTOR_ERRORS.titleHeld)
  })

  it('sends new requests to the contractor, keeps decided ones with the owner, and gives the contractor a blind line', () => {
    const s = settled()
    const decided = Object.values(s.reservations).find((x) => x.status === 'declined')!
    let t = must(setArisingsTitle(s, actor(U.tom), TIVERNE_ID, 'contractor')).state
    const lot = lotForItem(t.world, itemByTag(t.world, 'TH-02').id)
    const wished = projectWishlist(t.world, MERROWGATE_ID)!.items.find((x) => x.publicId === lot.publicId)!
    t = must(requestReservation(t, actor(U.isla), MERROWGATE_ID, wished.id, 'Again, please.')).state
    const kofi = sel.requestsView(t, viewer(U.kofi))!
    expect(kofi.pending.map((r) => r.publicId)).toEqual([lot.publicId])
    expect(kofi.pending[0].buyer.kind).toBe('blind')
    expect(kofi.decided).toEqual([])
    const tom = sel.requestsView(t, viewer(U.tom))!
    expect(tom.pending).toEqual([])
    expect(tom.decided.map((r) => r.id)).toEqual([decided.id])
    expect(t.notifications.some((n) => n.orgId === FENNICK_ID && n.kind === 'reservation_requested')).toBe(true)
  })

  it('goes back to the owner, who may then change the contractor', () => {
    let s = must(setArisingsTitle(settled(), actor(U.tom), TIVERNE_ID, 'contractor')).state
    s = must(setArisingsTitle(s, actor(U.tom), TIVERNE_ID, 'owner')).state
    expect(sellerOrgOfLot(s.world, lotForItem(s.world, itemByTag(s.world, 'TH-07').id).id)).toBe(ORG_IDS.ostlea)
    must(appointContractor(s, actor(U.tom), TIVERNE_ID, ORG_IDS.tarnbrook))
  })

  it('needs a contractor to pass to', () => {
    let s = settled()
    s = must(appointContractor(s, actor(U.tom), TIVERNE_ID, null)).state
    refused(s, setArisingsTitle(s, actor(U.tom), TIVERNE_ID, 'contractor'), WORK_ERRORS.noContractor)
  })
})
