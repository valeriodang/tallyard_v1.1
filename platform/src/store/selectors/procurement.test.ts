// The client's procurement pack and the architect's reuse clauses, through the store.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { editSpecClause, PROCUREMENT_ERRORS, saveAwardCriteria, saveProcurement, setAwardTemplate } from '../actions/procurement'
import { decideReservation } from '../actions/reservations'
import { ERRORS } from '../access'
import { FORBIDDEN } from '../../ui/testing'

describe("the client's procurement pack", () => {
  it('starts at the ambitious level, sourced by the contractor, with the works weightings', () => {
    const v = sel.procurementView(fresh(), viewer(U.isla), MERROWGATE_ID)!
    expect(v).toMatchObject({ ambition: 'ambitious', unit: 'value', targetText: '5% by value', route: 'contractor_sourced', includedCount: 11 })
    expect(v.objective).toMatch(/^The project aims to reuse at least 5% of its building materials by value\./)
    expect(v.matrix.map((m) => m.task)).toEqual(['Who buys', 'Who stores', 'Who prepares', 'Who tests', 'Who insures', 'Who is liable'])
    expect(v.award).toMatchObject({ template: 'urban_works', problem: null, reuseText: 'Reuse carries 10 of 100 points.' })
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it('prices the approved materials reclaimed and new, with the provisional sum', () => {
    const v = sel.procurementView(fresh(), viewer(U.isla), MERROWGATE_ID)!
    expect(v.prices.rows.map((r) => [r.publicId, r.reclaimedUnit, r.newUnit])).toEqual([
      ['L-WPX5A6', '£670 to £770 per tonne', '£1,000 per tonne'],
      ['L-NHZ32R', '£795 to £915 per tonne', '£1,000 per tonne'],
    ])
    expect(v.prices).toMatchObject({ reclaimedRange: '£41,003 to £47,136', reclaimedGuide: '£44,070', newCost: '£59,396', provisional: '£4,407' })
    // The annex lists every material not declined, from public facts.
    expect(v.annex.map((a) => a.publicId)).toEqual(['L-WPX5A6', 'L-NHZ32R', 'L-2MAC36', 'L-6APVMW'])
  })

  it('turns to free issue once the client holds reserved material', () => {
    const s0 = fresh()
    const waiting = Object.values(s0.reservations).find((r) => r.status === 'pending')!
    const s = must(decideReservation(s0, actor(U.tom), waiting.id, 'accepted', '')).state
    expect(sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.route).toBe('free_issue')
    const clause = sel.specificationView(s, viewer(U.priya), MERROWGATE_ID, 'approved')!.clauses.find((c) => c.publicId === waiting.publicId)!
    expect(clause.reuse[0]).toMatchObject({ label: 'Supply route', value: 'Free issue by the client' })
  })

  it('sets the target from the level, and the clauses from the route', () => {
    let s = must(saveProcurement(fresh(), actor(U.isla), MERROWGATE_ID, { ambition: 'pioneering', unit: 'mass' })).state
    expect(sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.targetText).toBe('10% by mass')
    s = must(saveProcurement(s, actor(U.isla), MERROWGATE_ID, { route: 'free_issue' })).state
    const v = sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!
    expect(v.clauses.find((c) => c.id === 'free_issue')!.included).toBe(true)
    expect(v.clauses.find((c) => c.id === 'review')!.included).toBe(false)
    s = must(saveProcurement(s, actor(U.isla), MERROWGATE_ID, { targetShare: 0.075 })).state
    expect(sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.targetText).toBe('7.5% by mass')
  })

  it('takes a template or the client own weights, and refuses weights that do not add up', () => {
    let s = must(setAwardTemplate(fresh(), actor(U.isla), MERROWGATE_ID, 'renovation')).state
    expect(sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.award.reuseText).toBe('Reuse carries 8 of 100 points.')
    const criteria = sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.award.criteria
    refused(s, saveAwardCriteria(s, actor(U.isla), MERROWGATE_ID, criteria.map((c, i) => (i === 0 ? { ...c, weight: 70 } : c))), 'The weights add up to 90. They must add up to 100.')
    s = must(saveAwardCriteria(s, actor(U.isla), MERROWGATE_ID, criteria.map((c, i) => (i === 0 ? { ...c, weight: 70 } : i === 2 ? { ...c, weight: 18 } : c)))).state
    expect(sel.procurementView(s, viewer(U.isla), MERROWGATE_ID)!.award).toMatchObject({ template: 'custom', reuseText: 'Reuse carries 18 of 100 points.' })
  })

  it('is for the client only', () => {
    const s = fresh()
    for (const who of [U.priya, U.marcus, U.tom]) expect(sel.procurementView(s, viewer(who), MERROWGATE_ID)).toBeNull()
    refused(s, saveProcurement(s, actor(U.priya), MERROWGATE_ID, { route: 'dealer' }), ERRORS.role)
    refused(s, saveProcurement(s, actor(U.isla), MERROWGATE_ID, { targetShare: 2 }), PROCUREMENT_ERRORS.target)
  })
})

describe("the architect's reuse clauses", () => {
  it('saves an entry over the generated text, and clears it back', () => {
    const s0 = fresh()
    const publicId = sel.specificationView(s0, viewer(U.priya), MERROWGATE_ID, 'draft')!.clauses[0].publicId
    const s1 = must(editSpecClause(s0, actor(U.priya), MERROWGATE_ID, publicId, { field: 'location', text: 'Level 2 to 4 secondary beams' })).state
    const row = () => sel.specificationView(s1, viewer(U.priya), MERROWGATE_ID, 'draft')!.clauses[0].reuse.find((r) => r.field === 'location')!
    expect(row()).toMatchObject({ value: 'Level 2 to 4 secondary beams', edited: true })
    // The client reads the same clause.
    expect(sel.specificationView(s1, viewer(U.isla), MERROWGATE_ID, 'draft')!.clauses.find((c) => c.publicId === publicId)!.reuse.find((r) => r.field === 'location')!.value).toBe('Level 2 to 4 secondary beams')
    const s2 = must(editSpecClause(s1, actor(U.priya), MERROWGATE_ID, publicId, { field: 'location', text: '' })).state
    expect(s2.specs[MERROWGATE_ID].clauses?.[publicId]).toBeUndefined()
    refused(s0, editSpecClause(s0, actor(U.isla), MERROWGATE_ID, publicId, { field: 'location', text: 'x' }), ERRORS.role)
    refused(s0, editSpecClause(s0, actor(U.priya), MERROWGATE_ID, publicId, { field: 'surplusShare', share: 0.9 }), PROCUREMENT_ERRORS.surplus)
  })

  it('lists the selection pattern once for the whole schedule', () => {
    const v = sel.specificationView(fresh(), viewer(U.priya), MERROWGATE_ID, 'draft')!
    expect(v.selectionSteps).toHaveLength(9)
    expect(v.routeText).toBe('Supply route until the client sets one: sourced by the contractor. Items the client has reserved are issued free.')
  })
})
