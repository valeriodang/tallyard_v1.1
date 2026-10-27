import { describe, expect, it } from 'vitest'
import { actor, fresh, must, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { TIVERNE_ID, HARROWDEN_ID } from '../../domain/seed/world'
import { decideReservation } from '../actions/reservations'
import { setArisingsTitle } from '../actions/contractorWork'
import { FORBIDDEN } from '../../ui/testing'
import { destinationDraft, destinationInput, carrierDraft, carrierInput } from './contractorWork-ui'
import { workFor } from '../actions/contractorWork'
import type { AppData } from '../types'

function titled(): AppData {
  const s = fresh()
  const r = Object.values(s.reservations).find((x) => x.status === 'pending')!
  const t = must(decideReservation(s, actor(U.tom), r.id, 'declined', '')).state
  return must(setArisingsTitle(t, actor(U.tom), TIVERNE_ID, 'contractor')).state
}

describe('the Method tab', () => {
  it('lists every item with the method chosen, and flags what is broken out', () => {
    const v = sel.methodView(fresh(), viewer(U.kofi), TIVERNE_ID)!
    expect(v.rows).toHaveLength(11)
    expect([v.recorded, v.breaking]).toEqual([10, 1])
    const th10 = v.rows.find((r) => r.tag === 'TH-10')!
    expect(th10).toMatchObject({ methodLabel: 'Break out', extractabilityText: '1 of 4', breaks: true })
    expect(v.rows.find((r) => r.tag === 'TH-09')!.methodLabel).toBe('Not chosen')
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it('opens for the contractor only, and shows the owner the method on the item', () => {
    const s = fresh()
    expect(sel.methodView(s, viewer(U.tom), TIVERNE_ID)).toBeNull()
    expect(sel.methodView(s, viewer(U.dana), TIVERNE_ID)).toBeNull()
    const th08 = Object.values(s.world.items).find((i) => i.buildingId === TIVERNE_ID && i.tag === 'TH-08')!
    expect(sel.itemDetail(s, viewer(U.tom), TIVERNE_ID, th08.id)!.methodText).toBe('Lift out whole by crane, extractability 4 of 4')
  })
})

describe('the Destinations tab', () => {
  it('reads forecast against actual, with the asbestos stream weighed out and its papers complete', () => {
    const v = sel.destinationsView(fresh(), viewer(U.tom), TIVERNE_ID)!
    expect(v.canWrite).toBe(false)
    expect(v.contractorName).toBe('Fennick Dismantling')
    expect(v.totals.movedText).toBe(`1 of ${v.rows.length} streams moved`)
    expect(v.totals.hazardousText).toBe('1.80 t forecast, 1.80 t moved')
    expect(v.totals.actualRecoveryText).toBe('No tonnes yet')
    expect(v.papers.text).toBe('1 of 1 moved streams have complete papers')
    expect(v.auditForecastable).toBe(0)
    expect(v.totals.targetsText).toBe("The audit's targets: reuse 20.0% by mass, reuse, recycling and recovery 97.0% by weight.")
  })

  it('costs the weighed-out asbestos by hand: 1.8 t at 45, 40, 250 and 126.15 per tonne, then VAT', () => {
    const c = sel.destinationsView(fresh(), viewer(U.kofi), TIVERNE_ID)!.cost.actual
    // 81.00 + 72.00 + 450.00 + 227.07 = 830.07; VAT 166.01; 996.08; 830.07 over 1.8 t is 461.15.
    expect(c.lines.map((l) => [l.label, l.totalText])).toEqual([['Hazardous disposal', '£830.07']])
    expect([c.totalExVatText, c.vatText, c.totalIncVatText, c.perTonneText]).toEqual(['£830.07', '£166.01', '£996.08', '£461.15 per t'])
    expect(c.reuseAvoids).toBe(false)
  })

  it('shows a forecast cost with what reuse keeps off the bill', () => {
    const c = sel.destinationsView(fresh(), viewer(U.kofi), TIVERNE_ID)!.cost.forecast
    expect(c.empty).toBe(false)
    expect(c.reuseAvoids).toBe(true)
  })

  it('names the gaps on a moved stream with incomplete papers', () => {
    let s = fresh()
    const w = workFor(s, TIVERNE_ID)!
    const e = w.destinations.find((d) => d.route === 'landfill')!
    s = { ...s, contractorWork: { ...s.contractorWork, buildings: { [TIVERNE_ID]: { ...w, destinations: w.destinations.map((d) => (d.id === e.id ? { ...d, actualT: 40, carrierId: 'org_fennick_c3', movedOn: '2026-10-06' } : d)) } } } }
    const row = sel.destinationsView(s, viewer(U.kofi), TIVERNE_ID)!.rows.find((r) => r.id === e.id)!
    expect(row.gaps).toEqual(["The carrier's registration had expired when it moved", 'Construction and demolition waste needs an upper tier carrier', 'No receiving site named', 'No permit or exemption for the receiving site', 'No transfer note reference'])
  })

  it('stays closed to the surveyor and the buying side, and shows the owner an empty log with no contractor', () => {
    const s = fresh()
    for (const who of [U.dana, U.priya, U.isla, U.marcus]) expect(sel.destinationsView(s, viewer(who), TIVERNE_ID)).toBeNull()
    expect(sel.routeAccess(s, viewer(U.dana), `/app/buildings/${TIVERNE_ID}/destinations`)).toBe('forbidden')
    expect(sel.routeAccess(s, viewer(U.kofi), `/app/buildings/${TIVERNE_ID}/destinations`)).toBe('ok')
    expect(sel.routeAccess(s, viewer(U.tom), `/app/buildings/${TIVERNE_ID}/method`)).toBe('forbidden')
    // Dana is Harrowden Court's contractor as well as its surveyor.
    expect(sel.destinationsView(s, viewer(U.dana), HARROWDEN_ID)!.empty).toBe(true)
  })
})

describe('the carrier register', () => {
  it('flags an expired registration and counts where each carrier is named', () => {
    const v = sel.carriersView(fresh(), viewer(U.kofi))!
    expect(v.rows.map((r) => [r.name, r.tierLabel, r.expired, r.inUse])).toEqual([
      ['Haulier A', 'Upper tier', false, 0],
      ['Haulier C', 'Upper tier', false, 1],
      ['Haulier B', 'Lower tier', true, 0],
    ])
    expect(sel.carriersView(fresh(), viewer(U.tom))).toBeNull()
  })
})

describe('title in the screens', () => {
  it('tells the owner it may pass title once nothing waits, and the contractor that it sells', () => {
    const s0 = fresh()
    const before = sel.listingsView(s0, viewer(U.tom), TIVERNE_ID)!.title
    expect(before).toMatchObject({ holder: 'owner', canPass: false, contractorName: 'Fennick Dismantling' })
    expect(before.blockedText).toMatch(/^Answer the open requests first/)
    expect(sel.listingsView(s0, viewer(U.kofi), TIVERNE_ID)).toBeNull()
    const s = titled()
    const owner = sel.listingsView(s, viewer(U.tom), TIVERNE_ID)!
    expect(owner.sells).toBe(false)
    expect(owner.title).toMatchObject({ holder: 'contractor', canTakeBack: true })
    expect(owner.rows.every((r) => !r.canChange)).toBe(true)
    const kofi = sel.listingsView(s, viewer(U.kofi), TIVERNE_ID)!
    expect(kofi.sells).toBe(true)
    expect(kofi.title.text).toBe('Ostlea Estates passed title to the arisings to your firm: you list and sell what comes out. Buyers stay anonymous until you accept a request.')
    expect(sel.itemDetail(s, viewer(U.tom), TIVERNE_ID, owner.rows[0].itemId)!.owner!.sells).toBe(false)
  })

  it('gives the contractor holding title Listings, Sharing and Requests', () => {
    const s = titled()
    const nav = sel.navModel(s, viewer(U.kofi))!
    expect(nav.sections.find((x) => x.id === 'buildings')!.items[0].children.map((c) => c.label)).toEqual(['Overview', 'Availability', 'Method', 'Destinations', 'Audits', 'Listings', 'Sharing'])
    expect(nav.sections.some((x) => x.items.some((i) => i.id === 'requests'))).toBe(true)
    expect(sel.routeAccess(s, viewer(U.kofi), '/app/requests')).toBe('ok')
    expect(sel.routeAccess(s, viewer(U.kofi), `/app/buildings/${TIVERNE_ID}/listings`)).toBe('ok')
    expect(sel.routeAccess(fresh(), viewer(U.kofi), '/app/requests')).toBe('forbidden')
    expect(sel.routeAccess(fresh(), viewer(U.kofi), `/app/buildings/${TIVERNE_ID}/listings`)).toBe('forbidden')
    expect(sel.sharingView(s, viewer(U.kofi))!.grantedCount).toBe(1)
  })
})

describe('the form drafts', () => {
  it('round-trip a stream and a carrier', () => {
    const s = fresh()
    const e = workFor(s, TIVERNE_ID)!.destinations.find((d) => d.actualT !== null)!
    const { auditRowId: _, ...rest } = e
    expect(destinationInput(destinationDraft(e))).toEqual(rest)
    const c = s.contractorWork.carriers.org_fennick[0]
    const { id, ...fields } = c
    expect(carrierInput(carrierDraft(c))).toEqual({ id, ...fields })
  })
})
