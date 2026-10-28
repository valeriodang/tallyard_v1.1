// The City of London module and the certification calculators through the store (round 3, stage 6c). Merrowgate
// Wharf moves into the City by the architect's own edit, as it would in the product.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { updateProject } from '../actions/projects'
import { saveWaste, saveLeedInputs, LEED_ERRORS } from '../actions/ces'
import { addCatalogueEntry, addPassport, CITY_ERRORS, markCityUpdate, removeCityOption, saveCityOption, saveReviewer, setCityPreferred, setScheduleBand, signOffReview } from '../actions/city'
import { ERRORS } from '../access'
import { FORBIDDEN } from '../../ui/testing'
import type { RetentionOptionInput } from '../actions/audits'
import type { AppData } from '../types'

const M = MERROWGATE_ID
const marcus = () => actor(U.marcus)

function inCity(): AppData {
  return must(updateProject(fresh(), actor(U.priya), M, { region: 'Central London', localAuthority: 'City of London' })).state
}

const option = (o: Partial<RetentionOptionInput>): RetentionOptionInput => ({ label: 'Option', kind: 'retain_refurbish', superstructureRetainedShare: null, facadeRetainedShare: null, giaM2: 16_500, upfrontKgM2: null, wlcKgM2: null, demolishedAreaM2: null, demolitionKgM2: null, note: '', ...o })

describe('the City of London tab', () => {
  it('shows only on a project in the City, and only to the consultant', () => {
    const tabs = (s: AppData) => sel.projectHeader(s, viewer(U.marcus), M)!.tabs.map((t) => t.id)
    expect(tabs(fresh())).not.toContain('city')
    expect(sel.cityView(fresh(), viewer(U.marcus), M)).toBeNull()
    const s = inCity()
    expect(tabs(s)).toContain('city')
    expect(sel.routeAccess(s, viewer(U.marcus), `/app/projects/${M}/city`)).toBe('ok')
    expect(sel.routeAccess(s, viewer(U.isla), `/app/projects/${M}/city`)).toBe('forbidden')
    for (const who of [U.priya, U.isla]) expect(sel.cityView(s, viewer(who), M)).toBeNull()
    const outside = fresh()
    refused(outside, saveCityOption(outside, marcus(), M, option({})), CITY_ERRORS.notCity)
    refused(s, saveCityOption(s, actor(U.isla), M, option({})), ERRORS.role)
  })

  it('starts with the minimums unmet and the reuse schedule from the project', () => {
    const v = sel.cityView(inCity(), viewer(U.marcus), M)!
    expect(v.minimums.map((m) => [m.id, m.countText, m.met])).toEqual([
      ['catalogue', '0 of 5', false],
      ['schedule', `${v.schedule.length} of 5`, v.schedule.length >= 5],
      ['passports', '0 of 5', false],
    ])
    expect(v.schedule.length).toBe(sel.projectMetrics(inCity(), viewer(U.marcus), M)!.items.length)
    expect(v.retention.verdictText).toBe('Choose a preferred option to see whether it counts as retrofit.')
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })
})

describe('carbon options and the retrofit test', () => {
  it('compares options, applies the 50% test and flags a facade kept alone', () => {
    let s = inCity()
    const keep = must(saveCityOption(s, marcus(), M, option({ label: 'Refurbish and extend', kind: 'retain_extend', superstructureRetainedShare: 0.8, upfrontKgM2: 350, wlcKgM2: 800 })))
    s = keep.state
    const facade = must(saveCityOption(s, marcus(), M, option({ label: 'Facade kept, new behind', kind: 'partial_retention', superstructureRetainedShare: 0.2, facadeRetainedShare: 0.9, upfrontKgM2: 620, wlcKgM2: 1100, demolishedAreaM2: 12_000 })))
    s = must(setCityPreferred(facade.state, marcus(), M, facade.value!)).state
    const v = sel.cityView(s, viewer(U.marcus), M)!
    expect(v.options.options.map((o) => [o.label, o.retrofitText])).toEqual([
      ['Refurbish and extend', 'Counts as retrofit'],
      ['Facade kept, new behind', 'Does not count as retrofit'],
    ])
    // 12,000 m2 demolished at 50 kgCO2e per m2 over 16,500 m2 adds 36.4 kgCO2e per m2, shown to the whole kilogram.
    expect(v.options.options[1].upfrontWithDemolitionText).toBe('656 kgCO2e per m2')
    expect(v.options.needsJustification).toBe(true)
    expect(v.retention).toMatchObject({ preferredLabel: 'Facade kept, new behind', superstructureText: '20%', facadeText: '90%', retrofit: false, facadeOnly: true, verdictText: 'The preferred option counts as new build.' })
    s = must(removeCityOption(s, marcus(), M, facade.value!)).state
    expect(sel.cityView(s, viewer(U.marcus), M)!.retention.preferredLabel).toBeNull()
  })

  it('needs a reviewer with three years and two options before the sign-off', () => {
    let s = inCity()
    refused(s, signOffReview(s, marcus(), M, true), CITY_ERRORS.reviewerNotReady)
    s = must(saveReviewer(s, marcus(), M, { name: 'Wren Tallis', organisation: 'Independent', years: 5 })).state
    refused(s, signOffReview(s, marcus(), M, true), CITY_ERRORS.noOptions)
    s = must(saveCityOption(s, marcus(), M, option({ label: 'A' }))).state
    s = must(saveCityOption(s, marcus(), M, option({ label: 'B', kind: 'new_build' }))).state
    s = must(signOffReview(s, marcus(), M, true)).state
    expect(sel.cityView(s, viewer(U.marcus), M)!.reviewer).toMatchObject({ ready: true, signedOff: true, signedOffText: `Signed off on ${sel.cityView(s, viewer(U.marcus), M)!.reviewer.signedOffText!.slice(14)}` })
    // A different reviewer clears the sign-off.
    s = must(saveReviewer(s, marcus(), M, { name: 'Another Reviewer', organisation: 'Independent', years: 2 })).state
    expect(sel.cityView(s, viewer(U.marcus), M)!.reviewer).toMatchObject({ ready: false, signedOff: false })
    refused(s, saveReviewer(s, marcus(), M, { name: '', organisation: '', years: 3 }), CITY_ERRORS.reviewerName)
  })
})

describe('minimums, bands and updates', () => {
  it('counts the catalogue and passports, and bands the schedule', () => {
    let s = inCity()
    for (const item of ['Raised floor panels', 'Steel beams', 'Stone cladding', 'Doors', 'Ceiling tiles']) s = must(addCatalogueEntry(s, marcus(), M, { item, quantity: '', band: 2 })).state
    for (const m of ['Steel frame', 'Concrete slabs', 'Facade units', 'Lift cars', 'Plant']) s = must(addPassport(s, marcus(), M, m, `PP-${m.length}`)).state
    const publicId = sel.cityView(s, viewer(U.marcus), M)!.schedule[0].publicId
    s = must(setScheduleBand(s, marcus(), M, publicId, 3)).state
    const v = sel.cityView(s, viewer(U.marcus), M)!
    expect(v.minimums.find((m) => m.id === 'catalogue')!.met).toBe(true)
    expect(v.minimums.find((m) => m.id === 'passports')!.met).toBe(true)
    expect(v.catalogue[0].bandText).toBe('Band 2, light wear: reuse')
    expect(v.schedule[0].bandText).toBe('Band 3, wear, needs minor work: repurpose')
    refused(s, setScheduleBand(s, marcus(), M, 'L-ZZZZZZ', 1), CITY_ERRORS.noItem)
    refused(s, addCatalogueEntry(s, marcus(), M, { item: 'x', quantity: '', band: 7 as never }), CITY_ERRORS.band)
  })

  it('dates the stage 4 and 6 updates against the programme, and refuses a future date', () => {
    let s = inCity()
    const v = sel.cityView(s, viewer(U.marcus), M)!
    expect(v.updates.map((u) => [u.label, u.status])).toEqual([
      ['RIBA stage 4', 'upcoming'],
      ['RIBA stage 6', 'upcoming'],
    ])
    refused(s, markCityUpdate(s, marcus(), M, 4, '2099-01-01'), CITY_ERRORS.date)
    s = must(markCityUpdate(s, marcus(), M, 4, '2026-10-01')).state
    expect(sel.cityView(s, viewer(U.marcus), M)!.updates[0]).toMatchObject({ status: 'done', statusText: 'Updated on 1 October 2026', doneOn: '2026-10-01' })
  })
})

describe('the certification calculators', () => {
  it('scores LEED MRc1 from the inputs and MRc5 from the waste estimates', () => {
    let s = must(saveLeedInputs(fresh(), marcus(), M, { onsiteReused: 30_000, onsiteTotal: 100_000, offsite: { carpet: 0.5 } })).state
    s = must(saveWaste(s, marcus(), M, 'demolition', { tonnes: 1000, routes: { reuseOnsite: 0.1, reuseOffsite: 0.1, recycleOffsite: 0.7, landfill: 0.1 } })).state
    s = must(saveWaste(s, marcus(), M, 'construction', { tonnes: 200, routes: { recycleOffsite: 0.9, landfill: 0.1 } })).state
    s = must(saveLeedInputs(s, marcus(), M, { separatedShare: 0.5, targetedT: 120 })).state
    const leed = sel.certificationView(s, viewer(U.marcus), M, 'leed')!.calcs.leed!
    expect(leed.mrc1).toMatchObject({ onsiteShareText: '30%', onsitePointsText: '3 points', option2Text: '2 points', pointsText: '4 points of 4' })
    expect(leed.offsite.find((t) => t.type === 'carpet')).toMatchObject({ share: '50', targeted: true })
    expect(leed.mrc5).toMatchObject({ hasEstimates: true, totalText: '1,100.0 t', rateText: '72.2%', pointsText: '4 points of 4' })
    refused(s, saveLeedInputs(s, marcus(), M, { onsiteReused: 200_000 }), LEED_ERRORS.overTotal)
    refused(s, saveLeedInputs(s, actor(U.isla), M, { onsiteTotal: 1 }), ERRORS.role)
  })

  it('places construction waste in the Wst 01 bands, and screens the reclaimed items for WELL', () => {
    const s = must(saveWaste(fresh(), marcus(), M, 'construction', { tonnes: 1000, routes: { recycleOffsite: 0.97, landfill: 0.03 } })).state
    const gia = s.world.projects[M].giaM2
    const b = sel.certificationView(s, viewer(U.marcus), M, 'breeam')!.calcs.breeam!
    expect(b.hasEstimate).toBe(true)
    expect(b.tPerM2Text).toBe(`${(Math.round((1000 / gia) * 1000) / 1000).toFixed(3)} t/m2`)
    expect(b.diversion[0]).toMatchObject({ valueText: '97%', met: true })
    const w = sel.certificationView(s, viewer(U.marcus), M, 'well')!.calcs.well!
    expect(w.rows.map((r) => r.publicId)).toEqual(sel.projectMetrics(s, viewer(U.marcus), M)!.items.map((i) => i.publicId))
    expect(sel.certificationView(s, viewer(U.marcus), M, 'well')!.calcs.leed).toBeNull()
  })
})
