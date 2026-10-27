import { describe, expect, it } from 'vitest'
import { actor, fresh, must, NOW, refused, U } from '../../test/fixtures'
import { emptyQuality, QUALITY_ERRORS, saveItemQuality, saveSteelRecord, type SteelInput } from './quality'
import { recordTestResults } from './testing'
import { OWNER_ERRORS, setLotVisibility } from './owner'
import { setProjectSteelLimits, STEEL_LIMIT_ERRORS } from './projects'
import { ERRORS } from '../access'
import { listingOf } from '../lots'
import { itemByTag, lotForItem, MERROWGATE_ID } from '../../domain/seed/world'
import { TIVERNE_TESTING_ID } from '../../sandbox/seed-owner-surveyor'
import type { AppData } from '../types'

const item = (s: AppData, tag: string) => itemByTag(s.world, tag)

function steel(s: AppData, tag: string, over: Partial<SteelInput> = {}): SteelInput {
  const r = item(s, tag).quality!.steel!
  return { ...r, ...over }
}

describe('the quality record', () => {
  it('lets the surveyor tick the checks of a private lot, and saves only checks of that family', () => {
    const s = fresh()
    const th11 = item(s, 'TH-11')
    const r = must(saveItemQuality(s, actor(U.dana), th11.id, { checks: { pallets: true } }))
    expect(item(r.state, 'TH-11').quality!.checks).toEqual({ photos: true, dry: true, carpet_off: true, label: true, pallets: true })
    expect(item(r.state, 'TH-11').quality!.updatedAt).toBe(NOW)
    refused(s, saveItemQuality(s, actor(U.dana), th11.id, { checks: { coating: true } }), QUALITY_ERRORS.check)
  })

  it('keeps the surveyor off a shared lot, and lets the owner change it', () => {
    const s = fresh()
    const th02 = item(s, 'TH-02')
    expect(lotForItem(s.world, th02.id).visibility).toBe('matched_only')
    refused(s, saveItemQuality(s, actor(U.dana), th02.id, { processing: 'cleaned' }), QUALITY_ERRORS.locked)
    expect(item(must(saveItemQuality(s, actor(U.tom), th02.id, { processing: 'cleaned' })).state, 'TH-02').quality!.processing).toBe('cleaned')
    refused(s, saveItemQuality(s, actor(U.kofi), th02.id, { processing: 'cleaned' }), ERRORS.noAccess)
    refused(s, saveItemQuality(s, actor(U.priya), th02.id, { processing: 'cleaned' }), ERRORS.noAccess)
  })

  it('checks yield, warranty, hazards and rejects', () => {
    const s = fresh()
    const id = item(s, 'TH-10').id
    refused(s, saveItemQuality(s, actor(U.tom), id, { yieldShare: 1.2 }), QUALITY_ERRORS.share)
    refused(s, saveItemQuality(s, actor(U.tom), id, { warranty: { kind: 'seller', years: 2.5, note: '' } }), QUALITY_ERRORS.years)
    refused(s, saveItemQuality(s, actor(U.tom), id, { warranty: { kind: 'forever' as never, years: null, note: '' } }), QUALITY_ERRORS.warranty)
    refused(s, saveItemQuality(s, actor(U.tom), id, { hazards: [{ id: 'radon' as never, status: 'suspected' }] }), QUALITY_ERRORS.hazard)
    refused(s, saveItemQuality(s, actor(U.tom), id, { rejects: ['bowed'] }), QUALITY_ERRORS.check)
    const r = must(saveItemQuality(s, actor(U.tom), id, { yieldShare: 0.55, warranty: { kind: 'none', years: 5, note: '' }, rejects: ['dull', 'dull'] }))
    expect(item(r.state, 'TH-10').quality).toMatchObject({ ...emptyQuality(NOW), yieldShare: 0.55, rejects: ['dull'], warranty: { kind: 'none', years: null, note: '' } })
  })

  it('stops an item that fails a reject check from being shared or published', () => {
    const s = fresh()
    const th07 = item(s, 'TH-07')
    const t = must(saveItemQuality(s, actor(U.tom), th07.id, { rejects: ['bowed'] })).state
    refused(t, setLotVisibility(t, actor(U.tom), lotForItem(t.world, th07.id).id, { visibility: 'published', ask: 180, reserve: 165 }), OWNER_ERRORS.rejected)
    must(setLotVisibility(s, actor(U.tom), lotForItem(s.world, th07.id).id, { visibility: 'published', ask: 180, reserve: 165 }))
  })
})

describe('the steel record', () => {
  it('sets the test status and the usable grade from the record', () => {
    const s = fresh()
    const th01 = item(s, 'TH-01')
    expect(th01).toMatchObject({ testStatus: 'untested', grade: 'unknown' })
    const r = must(saveSteelRecord(s, actor(U.tom), th01.id, steel(s, 'TH-01', { assessment: 'S3', samplesTested: 1, certificate: { ref: '  BT-2231 ', lab: 'Brindmoor Testing', issuedOn: '2026-10-01', grade: 'S355' } })))
    expect(item(r.state, 'TH-01')).toMatchObject({ testStatus: 'tested', grade: 'S355' })
    expect(item(r.state, 'TH-01').quality!.steel!.certificate).toEqual({ ref: 'BT-2231', lab: 'Brindmoor Testing', issuedOn: '2026-10-01', grade: 'S355' })
    expect(listingOf(r.state.world, lotForItem(r.state.world, th01.id)).quality.steel).toEqual({ provenance: 'P1', assessment: 'S3' })
  })

  it('is for steel only, and checks its fields', () => {
    const s = fresh()
    refused(s, saveSteelRecord(s, actor(U.tom), item(s, 'TH-07').id, steel(s, 'TH-01')), QUALITY_ERRORS.steelOnly)
    const id = item(s, 'TH-01').id
    refused(s, saveSteelRecord(s, actor(U.tom), id, steel(s, 'TH-01', { assessment: 'S9' as never })), QUALITY_ERRORS.steel)
    refused(s, saveSteelRecord(s, actor(U.tom), id, steel(s, 'TH-01', { groupId: ' ' })), QUALITY_ERRORS.group)
    refused(s, saveSteelRecord(s, actor(U.tom), id, steel(s, 'TH-01', { samplesTested: -1 })), QUALITY_ERRORS.samples)
    refused(s, saveSteelRecord(s, actor(U.tom), id, steel(s, 'TH-01', { certificate: { ref: '', lab: '', issuedOn: '2026-10-01', grade: 'S355' } })), QUALITY_ERRORS.certificate)
    refused(s, saveSteelRecord(s, actor(U.tom), id, steel(s, 'TH-01', { certificate: { ref: 'X', lab: 'Y', issuedOn: '2026-02-31', grade: 'S355' } })), QUALITY_ERRORS.date)
  })

  it('keeps steel that is not admissible under P427 off the market', () => {
    const s = fresh()
    const th01 = item(s, 'TH-01')
    const t = must(saveSteelRecord(s, actor(U.tom), th01.id, steel(s, 'TH-01', { admissibility: { ...th01.quality!.steel!.admissibility, fireExposure: 'yes' } }))).state
    refused(t, setLotVisibility(t, actor(U.tom), lotForItem(t.world, th01.id).id, { visibility: 'shared', ask: 800, reserve: 730 }), OWNER_ERRORS.notAdmissible)
  })

  it('moves on with test results, so the record and the status agree', () => {
    const s = fresh()
    const tags = ['TH-02', 'TH-03', 'TH-04', 'TH-05', 'TH-06']
    const r = must(recordTestResults(s, actor(U.tom), TIVERNE_TESTING_ID, tags.map((t) => ({ itemId: item(s, t).id, testStatus: 'tested' as const, grade: 'S355' as const, note: '' }))))
    const th02 = item(r.state, 'TH-02')
    expect(th02.testStatus).toBe('tested')
    expect(th02.quality!.steel).toMatchObject({ assessment: 'S3', certificate: { ref: `${TIVERNE_TESTING_ID}-TH-02`, lab: 'Brindmoor Testing', issuedOn: '2026-10-08', grade: 'S355' } })
  })
})

describe("a project's steel limits", () => {
  it('lets the architect set and clear them, and nobody else', () => {
    const s = fresh()
    const limits = { exc: 'EXC3' as const, cc: 'CC2' as const, fatigue: false, seismic: true, grade: 'S355' as const }
    const r = must(setProjectSteelLimits(s, actor(U.priya), MERROWGATE_ID, limits))
    expect(r.state.world.projects[MERROWGATE_ID].steelLimits).toEqual(limits)
    expect(must(setProjectSteelLimits(r.state, actor(U.priya), MERROWGATE_ID, null)).state.world.projects[MERROWGATE_ID].steelLimits).toBeNull()
    refused(s, setProjectSteelLimits(s, actor(U.isla), MERROWGATE_ID, limits), ERRORS.role)
    refused(s, setProjectSteelLimits(s, actor(U.priya), MERROWGATE_ID, { ...limits, exc: 'EXC9' as never }), STEEL_LIMIT_ERRORS.limits)
  })
})
