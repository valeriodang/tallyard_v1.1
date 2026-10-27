import { describe, expect, it } from 'vitest'
import { actor, fresh, must, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { itemByTag, lotForItem, MERROWGATE_ID, TIVERNE_ID } from '../../domain/seed/world'
import { decideReservation } from '../actions/reservations'
import { saveSteelRecord } from '../actions/quality'
import { FORBIDDEN } from '../../ui/testing'
import type { AppData } from '../types'

const id = (s: AppData, tag: string) => itemByTag(s.world, tag).id

/** The seeded TH-02 request accepted by the owner, so its client holds the provenance pack. */
function accepted(): { s: AppData; reservationId: string } {
  const s0 = fresh()
  const r = Object.values(s0.reservations).find((x) => x.status === 'pending')!
  return { s: must(decideReservation(s0, actor(U.tom), r.id, 'accepted', 'Collection from the yard.')).state, reservationId: r.id }
}

describe('the quality panel', () => {
  it('screens TH-01 under P427 and works out its group sampling', () => {
    const s = fresh()
    const v = sel.itemQualityView(s, viewer(U.tom), TIVERNE_ID, id(s, 'TH-01'))!
    expect(v.canEdit).toBe(true)
    expect(v.steel).toMatchObject({ verdict: 'admissible', groupMembers: 144, statusText: 'Untested', gradeText: 'Grade not known yet' })
    // TH-01 and TH-06 are one group of 48 and 96 members: protocol B tests the softest.
    expect(v.steel!.samplesText).toBe('Test 1 of the 144 members in group UB secondary; 0 tested so far')
    expect(v.steel!.protocolText).toMatch(/^Protocol B: the member with the lowest hardness/)
    expect(v.assurance).toMatchObject({ tier: 'declared', meets: false, needText: 'Superstructure asks for: tested or certified' })
    expect(v.label).toBeNull()
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it('waits for every P427 answer on TH-03', () => {
    const s = fresh()
    expect(sel.itemQualityView(s, viewer(U.tom), TIVERNE_ID, id(s, 'TH-03'))!.steel!.verdict).toBe('incomplete')
  })

  it('reads the raised floor checks and yield', () => {
    const s = fresh()
    const v = sel.itemQualityView(s, viewer(U.dana), TIVERNE_ID, id(s, 'TH-11'))!
    expect(v.checksText).toBe('4 of 5 checks done')
    expect(v.yield.text).toBe('2,100 of 3,000 panels expected usable (70.0%)')
    expect(v.assurance.needText).toBe('Space asks for: warranted')
    expect(v.steel).toBeNull()
    // Only the hazards a raised floor can hold are suggested: asbestos and tar adhesive, not red lead or treated timber.
    expect(v.hazards.map((h) => h.id)).toEqual(['asbestos', 'tar_adhesive'])
  })

  it('locks the record for the surveyor once the lot is shared, and opens to nobody else', () => {
    const s = fresh()
    const v = sel.itemQualityView(s, viewer(U.dana), TIVERNE_ID, id(s, 'TH-02'))!
    expect(v.canEdit).toBe(false)
    expect(v.lockedText).toBe('Shared or published: the owner can still change this record.')
    for (const who of [U.kofi, U.priya, U.isla, U.marcus]) expect(sel.itemQualityView(s, viewer(who), TIVERNE_ID, id(s, 'TH-02'))).toBeNull()
  })

  it('offers the tested-for-reuse label once the item is tested', () => {
    const s0 = fresh()
    const th01 = itemByTag(s0.world, 'TH-01')
    const s = must(saveSteelRecord(s0, actor(U.tom), th01.id, { ...th01.quality!.steel!, assessment: 'S3', certificate: { ref: 'BT-2231', lab: 'Brindmoor Testing', issuedOn: '2026-10-01', grade: 'S355' } })).state
    const label = sel.itemQualityView(s, viewer(U.tom), TIVERNE_ID, th01.id)!.label!
    expect(label.fileName).toBe('L-9F4CQQ-tested-for-reuse.svg')
    expect(label.svg).toContain('Tested by Brindmoor Testing')
    expect(label.svg).toContain('Tested, P1, S3')
  })
})

describe('what the architect reads on a material page', () => {
  it("shows the assurance, the steel codes and the testing Merrowgate Wharf's limits ask for", () => {
    const v = sel.materialView(fresh(), viewer(U.priya), 'L-9F4CQQ', MERROWGATE_ID)!
    expect(v.quality).toMatchObject({ assuranceText: 'Declared by the seller', meets: false, warrantyText: 'No warranty' })
    expect(v.quality.steelText).toBe('P1, known donor building, after 1970, no certificates. S0, captured only')
    expect(v.quality.steelFit).toEqual({ meets: false, text: "Needs S3 for the project's limits: about 8 weeks to ready for fabrication", notes: [] })
    // With no project chosen there is no steel fit.
    expect(sel.materialView(fresh(), viewer(U.priya), 'L-9F4CQQ', null)!.quality.steelFit).toBeNull()
  })
})

describe('the provenance pack', () => {
  it('opens for the client once the seller accepts, naming the donor building', () => {
    const { s, reservationId } = accepted()
    const v = sel.provenancePackView(s, viewer(U.isla), MERROWGATE_ID, reservationId)!
    expect(v.publicId).toBe(lotForItem(s.world, id(s, 'TH-02')).publicId)
    expect(v.donor.find((x) => x.label === 'Building')!.value).toBe('Tiverne House')
    expect(v.steel!.find((x) => x.label === 'Protocol')!.value).toBe('Protocol B')
    expect(v.events.at(-1)!.text).toBe('Reservation accepted by the seller')
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
    expect(sel.routeAccess(s, viewer(U.isla), `/app/projects/${MERROWGATE_ID}/reservations/${reservationId}`)).toBe('ok')
  })

  it('stays closed to the architect, the consultant and the owner, and before acceptance', () => {
    const { s, reservationId } = accepted()
    for (const who of [U.priya, U.marcus, U.tom]) expect(sel.provenancePackView(s, viewer(who), MERROWGATE_ID, reservationId)).toBeNull()
    expect(sel.routeAccess(s, viewer(U.priya), `/app/projects/${MERROWGATE_ID}/reservations/${reservationId}`)).toBe('forbidden')
    const s0 = fresh()
    expect(sel.provenancePackView(s0, viewer(U.isla), MERROWGATE_ID, reservationId)).toBeNull()
  })
})

describe("a project's steel limits", () => {
  it('reads them to every side, for the architect to change', () => {
    const s = fresh()
    expect(sel.steelLimitsView(s, viewer(U.priya), MERROWGATE_ID)).toMatchObject({ canEdit: true, text: 'EXC2, CC2, up to S355' })
    expect(sel.steelLimitsView(s, viewer(U.isla), MERROWGATE_ID)!.canEdit).toBe(false)
    expect(sel.steelLimitsView(s, viewer(U.tom), MERROWGATE_ID)).toBeNull()
  })
})
