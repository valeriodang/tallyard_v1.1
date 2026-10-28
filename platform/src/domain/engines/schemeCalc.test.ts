import { describe, expect, it } from 'vitest'
import { breeamWst01, leedMrc1, leedMrc5, offsitePoints, wellScreen } from './schemeCalc'
import type { WasteEstimate, WasteRoutes } from '../cesTypes'

const NONE: WasteRoutes = { reuseOnsite: 0, reuseOffsite: 0, recycleOnsite: 0, recycleOffsite: 0, landfill: 0, other: 0 }
const est = (tonnes: number, routes: Partial<WasteRoutes>): WasteEstimate => ({ tonnes, routes: { ...NONE, ...routes }, source: '' })

describe('LEED v5 MRc1, interior materials reuse', () => {
  it('scores on-site reuse by cost from the guide Table 1, at each threshold', () => {
    const at = (reused: number) => leedMrc1({ onsiteReused: reused, onsiteTotal: 100, furnitureReused: null, furnitureTotal: null, offsite: {} }).onsitePoints
    expect([9.9, 10, 19.9, 20, 30, 40, 100].map(at)).toEqual([0, 1, 1, 2, 3, 4, 4])
  })

  it('takes the better of the two option 1 paths and adds option 2, up to 4 points', () => {
    const r = leedMrc1({ onsiteReused: 30, onsiteTotal: 100, furnitureReused: 40, furnitureTotal: 100, offsite: { carpet: 0.5, ceilings: 0.25 } })
    expect(r).toMatchObject({ onsiteShare: 0.3, onsitePoints: 3, furnitureShare: 0.4, furniturePoints: 2, option1: 3, option2: 2, points: 4 })
    expect(leedMrc1({ onsiteReused: null, onsiteTotal: null, furnitureReused: 20, furnitureTotal: 100, offsite: {} }).points).toBe(1)
  })

  it('reads option 2 from the guide Table 3', () => {
    expect(offsitePoints({})).toBe(0)
    expect(offsitePoints({ carpet: 0.25 })).toBe(1)
    expect(offsitePoints({ doors: 0.25, lighting: 0.25 })).toBe(1)
    expect(offsitePoints({ doors: 0.25, lighting: 0.25, casework: 0.3, plumbing: 0.25 })).toBe(2)
    expect(offsitePoints({ carpet: 0.25, furniture: 0.25 })).toBe(2)
    expect(offsitePoints({ ceilings: 0.75 })).toBe(3)
    expect(offsitePoints({ carpet: 0.5, furniture: 0.5 })).toBe(3)
    expect(offsitePoints({ carpet: 0.24 })).toBe(0)
  })
})

describe('LEED v5 MRc5, waste diversion', () => {
  const streams = [est(1000, { reuseOnsite: 0.1, reuseOffsite: 0.1, recycleOffsite: 0.7, landfill: 0.1 }), est(200, { recycleOffsite: 0.9, landfill: 0.1 })]

  it('leaves out reuse on site, counts salvage twice and caps unverified mixed recovery at 35%', () => {
    const r = leedMrc5({ streams, separatedShare: 0.5, mixedRate: null, targetedT: 120 })
    expect(r.totalT).toBe(1100)
    expect(r.onsiteExcludedT).toBe(100)
    expect(r).toMatchObject({ salvagedT: 100, separatedT: 440, mixedT: 440, mixedRate: 0.35, mixedVerified: false })
    // (100 x 2 + 440 + 440 x 0.35) / 1100 = 794 / 1100
    expect(r.rate).toBeCloseTo(0.72182, 5)
    // (100 + 440) / (100 + 440 + 154)
    expect(r.separatedShareOfDiverted).toBeCloseTo(0.77810, 5)
    expect(r).toMatchObject({ pathPoints: 3, targetedPoint: 1, points: 4 })
  })

  it('treats recycling as mixed until the consultant says how much was separated', () => {
    const r = leedMrc5({ streams, separatedShare: null, mixedRate: null, targetedT: null })
    expect(r.rate).toBeCloseTo(508 / 1100, 9)
    expect(r.separatedShareOfDiverted).toBeCloseTo(100 / 408, 9)
    expect(r).toMatchObject({ pathPoints: 1, targetedPoint: 0, points: 1 })
  })

  it('uses a verified facility rate, and asks for more than 10% on path 4', () => {
    const r = leedMrc5({ streams, separatedShare: 0, mixedRate: 0.8, targetedT: 110 })
    expect(r.mixedVerified).toBe(true)
    expect(r.rate).toBeCloseTo((200 + 880 * 0.8) / 1100, 9)
    expect(r.targetedShare).toBeCloseTo(0.1, 9)
    expect(r.targetedPoint).toBe(0)
  })

  it('has no rate without an estimate', () => {
    expect(leedMrc5({ streams: [], separatedShare: null, mixedRate: null, targetedT: null })).toMatchObject({ totalT: 0, rate: null, points: 0 })
  })
})

describe('BREEAM Wst 01, construction waste', () => {
  it('places construction waste per m2 GIA in the Appendix 4 bands', () => {
    expect(breeamWst01(est(1200, { recycleOffsite: 1 }), undefined, 10_000)).toMatchObject({ tPerM2: 0.12, credits: null, next: { credits: '1 credit', atMost: 0.11 } })
    expect(breeamWst01(est(600, { recycleOffsite: 1 }), undefined, 10_000)).toMatchObject({ credits: '2 credits', next: { credits: '3 credits', atMost: 0.032 } })
    expect(breeamWst01(est(190, { recycleOffsite: 1 }), undefined, 10_000)).toMatchObject({ credits: 'Exemplary', next: null })
  })

  it('checks diversion from landfill: 80% of construction waste and 90% of demolition waste', () => {
    const r = breeamWst01(est(1200, { recycleOffsite: 0.97, landfill: 0.03 }), est(8000, { reuseOffsite: 0.05, recycleOffsite: 0.8, landfill: 0.15 }), 10_000)
    expect(r.constructionDiverted).toBeCloseTo(0.97, 9)
    expect(r.constructionMet).toBe(true)
    expect(r.demolitionDiverted).toBeCloseTo(0.85, 9)
    expect(r.demolitionMet).toBe(false)
    expect(breeamWst01(undefined, undefined, 10_000)).toMatchObject({ tPerM2: null, credits: null, next: null, constructionMet: null, demolitionMet: null })
  })
})

describe('WELL v2 X01 to X03 on reclaimed items', () => {
  const screen = (family: Parameters<typeof wellScreen>[0][number]['family'], eraBand: '1970 or later' | 'before 1970' | null, hazards: Parameters<typeof wellScreen>[0][number]['hazards'] = []) =>
    wellScreen([{ publicId: 'L-1', description: 'x', family, eraBand, hazards }])[0].checks.map((c) => `${c.feature} ${c.status}`)

  it('asks for the asbestos limit on X01 categories and a lead test on coated families', () => {
    expect(screen('metal_ceiling_tile', '1970 or later')).toEqual(['X01 check', 'X01 check'])
    expect(screen('natural_slate', '1970 or later')).toEqual(['X01 check'])
    expect(screen('stone_paving', '1970 or later')).toEqual([])
  })

  it('marks confirmed hazards from the listing, which take the place of the checks', () => {
    expect(screen('steel_section', 'before 1970', ['red_lead'])).toEqual(['X01 confirmed'])
    expect(screen('glulam_beam', '1970 or later', ['cca_timber'])).toEqual(['X01 check', 'X03 confirmed'])
    expect(screen('carpet_tile', null, ['tar_adhesive'])).toEqual(['X01 confirmed'])
  })

  it('checks sealants for PCBs on old or undated facades only', () => {
    expect(screen('curtain_wall', null)).toEqual(['X01 check', 'X02 check'])
    expect(screen('curtain_wall', '1970 or later')).toEqual(['X01 check'])
  })
})
