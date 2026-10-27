// Deal terms on a reservation: the client proposes them, the seller reads them banded until accepting, then in full.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { decideReservation, requestReservation, withdrawReservation } from '../actions/reservations'
import { defaultTerms, TERMS_ERRORS } from '../../domain/engines/dealTerms'
import { FORBIDDEN } from '../../ui/testing'
import type { AppData } from '../types'
import type { DealTerms } from '../../domain/dealTypes'

const TH02 = 'wli_hp23zk_1'

/** The seeded TH-02 request withdrawn, so the client can send it again with terms. */
function readyToRequest(): AppData {
  const s0 = fresh()
  const pending = Object.values(s0.reservations).find((r) => r.wishItemId === TH02 && r.status === 'pending')!
  return must(withdrawReservation(s0, actor(U.isla), pending.id)).state
}

function forwardSale(s: AppData): DealTerms {
  const d = sel.termsDraftView(s, viewer(U.isla), MERROWGATE_ID, TH02, null)!
  return { ...d.defaults.forward_sale, bridgeMonths: 9, buyBack: true }
}

describe("the client's draft", () => {
  it('starts client-driven with the bridge the timeline gives, and costs it', () => {
    const d = sel.termsDraftView(readyToRequest(), viewer(U.isla), MERROWGATE_ID, TH02, null)!
    expect(d.terms).toMatchObject({ model: 'client_driven', depositShare: 0.1, storagePayer: 'buyer', bridgeMonths: 13 })
    expect(d.fitText).toBe('The timeline check needs about 13 months of storage.')
    expect(d.lines.map((l) => l.label)).toEqual(['Deposit on acceptance, 10% of the material', 'Storage bridge, 13 months, paid by the buyer'])
    expect(d.models.find((m) => m.value === 'forward_sale')!.disabled).toBe(false)
    expect(d.sellerSees.find((r) => r.label === 'Storage bridge')!.value).toBe('13 to 24 months')
    expect(JSON.stringify(d)).not.toMatch(FORBIDDEN)
  })

  it('flags storage the bridge leaves uncovered, and says why terms are refused', () => {
    const s = readyToRequest()
    const d0 = sel.termsDraftView(s, viewer(U.isla), MERROWGATE_ID, TH02, null)!
    expect(sel.termsDraftView(s, viewer(U.isla), MERROWGATE_ID, TH02, { ...d0.terms, bridgeMonths: 10 })!.bridgeShortText).toBe('3 months of storage the deal does not cover.')
    expect(sel.termsDraftView(s, viewer(U.isla), MERROWGATE_ID, TH02, { ...d0.terms, bridgeMonths: 40 })!.error).toBe(TERMS_ERRORS.bridge)
  })

  it('is for the client only', () => {
    const s = readyToRequest()
    for (const who of [U.priya, U.tom, U.marcus]) expect(sel.termsDraftView(s, viewer(who), MERROWGATE_ID, TH02, null)).toBeNull()
  })
})

describe('a request with terms', () => {
  it('reaches the seller with the bridge banded, and in full once accepted', () => {
    const s0 = readyToRequest()
    const r = must(requestReservation(s0, actor(U.isla), MERROWGATE_ID, TH02, 'The full lot.', forwardSale(s0)))
    const row = sel.requestsView(r.state, viewer(U.tom))!.pending.find((x) => x.id === r.value)!
    expect(row.terms).toMatchObject({ modelLabel: 'Forward sale', lines: null })
    expect(row.terms!.rows.find((x) => x.label === 'Storage bridge')!.value).toBe('7 to 12 months')
    // The seller learns nothing finer than the window: not the months, not the cost base.
    const blind = JSON.stringify(sel.requestsView(r.state, viewer(U.tom)))
    expect(blind).not.toContain('9 months')
    expect(blind).not.toContain('fitMonths')
    const client = sel.reservationsView(r.state, viewer(U.isla), MERROWGATE_ID)!.rows.find((x) => x.itemId === TH02)!
    expect(client.reservation!.terms!.rows.find((x) => x.label === 'Storage bridge')!.value).toBe('9 months')
    expect(client.reservation!.terms!.lines!.map((l) => l.label)).toEqual(['Deposit on acceptance, 20% of the material', 'Storage bridge, 9 months, paid by the seller', 'Price lock fee', 'Buy-back of unused material, up to', 'Deposit kept by the seller on a design change'])
    const s2 = must(decideReservation(r.state, actor(U.tom), r.value, 'accepted', 'Agreed.')).state
    const done = sel.requestsView(s2, viewer(U.tom))!.decided.find((x) => x.id === r.value)!
    expect(done.terms!.rows.find((x) => x.label === 'Storage bridge')!.value).toBe('9 months')
    expect(done.terms!.lines).not.toBeNull()
  })

  it('leaves a request without terms as it was', () => {
    const s0 = readyToRequest()
    const r = must(requestReservation(s0, actor(U.isla), MERROWGATE_ID, TH02, ''))
    expect(r.state.reservations[r.value].terms).toBeUndefined()
    expect(sel.requestsView(r.state, viewer(U.tom))!.pending.find((x) => x.id === r.value)!.terms).toBeNull()
  })

  it('refuses terms that do not check', () => {
    const s0 = readyToRequest()
    const bad = { ...defaultTerms('hybrid', { material: 1, storagePerMonth: 1, fitMonths: 1, availableNow: false }), depositShare: 0.5 }
    refused(s0, requestReservation(s0, actor(U.isla), MERROWGATE_ID, TH02, '', bad), TERMS_ERRORS.deposit)
  })
})
