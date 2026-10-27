// Portfolio-first (round 3, stage 5): the owner holds a private lot for its own projects, which see it and allocate
// it directly; no other project and not the marketplace.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '../selectors'
import { itemByTag, lotForItem, MERROWGATE_ID, ORG_IDS } from '../../domain/seed/world'
import { createOwnerProject, OWNER_ERRORS, setLotPortfolio, setLotVisibility, type OwnerProjectInput } from './owner'
import { allocateOwnLot, OWN_ALLOCATION_NOTE, requestReservation, RESERVATION_ERRORS } from './reservations'
import { decideItem, saveToProject, sendToClient } from './shortlist'
import { ERRORS } from '../access'
import { acceptedReservation, marketplaceListings, projectCanSee, projectWishlist } from '../lots'
import type { AppData } from '../types'

const WEXCOMBE: OwnerProjectInput = { name: 'Wexcombe House', projectType: 'office', localAuthority: 'Camden', region: 'Central London', ribaStage: 2, startDate: '2027-09-20', architectOrgId: ORG_IDS.oriel }

/** Tom's own project, with the stone cladding held for it. */
function held(): { s: AppData; projectId: string; lotId: string; publicId: string } {
  const created = must(createOwnerProject(fresh(), actor(U.tom), WEXCOMBE))
  const lot = lotForItem(created.state.world, itemByTag(created.state.world, 'TH-07').id)
  expect(lot.visibility).toBe('private')
  const s = must(setLotPortfolio(created.state, actor(U.tom), lot.id, true)).state
  return { s, projectId: created.value, lotId: lot.id, publicId: lot.publicId }
}

describe('holding a lot for your own projects', () => {
  it("shows it to the owner's own project and its architect, and to no one else", () => {
    const { s, projectId, lotId, publicId } = held()
    const lot = s.world.lots[lotId]
    expect(projectCanSee(s.world, s.world.projects[projectId], lot)).toBe(true)
    expect(projectCanSee(s.world, s.world.projects[MERROWGATE_ID], lot)).toBe(false)
    expect(marketplaceListings(s).some((l) => l.publicId === publicId)).toBe(false)
    const group = sel.sharedGroups(s, viewer(U.priya)).find((g) => g.project.id === projectId)!
    expect(group.cards.map((c) => c.publicId)).toContain(publicId)
    for (const g of sel.sharedGroups(s, viewer(U.priya)).filter((x) => x.project.id !== projectId)) expect(g.cards.map((c) => c.publicId)).not.toContain(publicId)
    expect(sel.materialView(s, viewer(U.isla), publicId, MERROWGATE_ID)).toBeNull()
    const row = sel.listingsView(s, viewer(U.tom), itemByTag(s.world, 'TH-07').buildingId)!.rows.find((r) => r.tag === 'TH-07')!
    expect(row).toMatchObject({ portfolio: true, canHold: true, visibilityLabel: 'Private, held for your projects' })
  })

  it('ends when the lot is shared or published', () => {
    const { s, lotId } = held()
    const shared = must(setLotVisibility(s, actor(U.tom), lotId, { visibility: 'shared', ask: 300, reserve: 250 })).state
    expect(shared.world.lots[lotId].portfolio).toBeUndefined()
  })

  it('refuses a shared lot, and anyone but the owner', () => {
    const s = fresh()
    const sharedLot = lotForItem(s.world, itemByTag(s.world, 'TH-02').id)
    refused(s, setLotPortfolio(s, actor(U.tom), sharedLot.id, true), OWNER_ERRORS.portfolioPrivate)
    const th07 = lotForItem(s.world, itemByTag(s.world, 'TH-07').id)
    refused(s, setLotPortfolio(s, actor(U.dana), th07.id, true), ERRORS.role)
  })
})

describe('allocating your own lot', () => {
  function approved() {
    const h = held()
    let s = must(saveToProject(h.s, actor(U.priya), h.publicId, h.projectId)).state
    s = must(sendToClient(s, actor(U.priya), h.projectId, null, 'Stone for the entrance.')).state
    const item = projectWishlist(s.world, h.projectId)!.items.find((x) => x.publicId === h.publicId)!
    s = must(decideItem(s, actor(U.tom), h.projectId, item.id, 'approved', '')).state
    return { ...h, s, wishItemId: item.id }
  }

  it('holds it for the project at once, with no request and no blind stage', () => {
    const { s, projectId, lotId, wishItemId } = approved()
    // Requesting from yourself is still refused: the owner allocates instead.
    refused(s, requestReservation(s, actor(U.tom), projectId, wishItemId, ''), RESERVATION_ERRORS.ownLot)
    const row0 = sel.reservationsView(s, viewer(U.tom), projectId)!.rows.find((r) => r.itemId === wishItemId)!
    expect(row0).toMatchObject({ own: true, canRequest: true })
    const r = must(allocateOwnLot(s, actor(U.tom), projectId, wishItemId))
    expect(r.state.reservations[r.value]).toMatchObject({ status: 'accepted', decisionNote: OWN_ALLOCATION_NOTE, decidedByUserId: U.tom })
    expect(acceptedReservation(r.state, lotId)!.projectId).toBe(projectId)
    refused(r.state, allocateOwnLot(r.state, actor(U.tom), projectId, wishItemId), RESERVATION_ERRORS.held)
  })

  it("refuses a lot the client does not sell, and anyone but the project's client", () => {
    const { s, projectId, wishItemId } = approved()
    refused(s, allocateOwnLot(s, actor(U.priya), projectId, wishItemId), ERRORS.role)
    const mg = projectWishlist(s.world, MERROWGATE_ID)!.items.find((x) => x.status === 'approved')!
    refused(s, allocateOwnLot(s, actor(U.isla), MERROWGATE_ID, mg.id), RESERVATION_ERRORS.notOwn)
  })
})
