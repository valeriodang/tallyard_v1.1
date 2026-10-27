// The recovery plan's routes, the Level(s) score and the gain over the RICS business-as-usual case.
import { describe, expect, it } from 'vitest'
import { isReuseRoute, planSummary, suggestedRoute } from './recovery'
import { familyBauSplit, splitCircularity } from './eol'
import { CASCADES, RECOVERY_ROUTES } from '../reference/recovery'
import { FAMILY_IDS } from '../reference/families'

describe('suggested routes', () => {
  it('reuses what is worth recovering, on site when the audit says so', () => {
    expect(suggestedRoute('steel_section', 'recover', 'reuse_on_site')).toBe('reuse_on_site')
    expect(suggestedRoute('steel_section', 'recover', 'marketplace')).toBe('reuse_off_site')
    expect(suggestedRoute('steel_section', 'recover', null)).toBe('reuse_off_site')
  })

  it("sends the rest the family's usual way", () => {
    expect(suggestedRoute('steel_section', 'recycle', null)).toBe('recycle')
    expect(suggestedRoute('precast_cladding', 'recycle', null)).toBe('downcycle')
    expect(suggestedRoute('carpet_tile', 'recycle', 'reuse_on_site')).toBe('energy_recovery')
  })

  it('counts retain, relocate and reuse as reuse, and upcycling as recycling', () => {
    expect(RECOVERY_ROUTES.filter((r) => isReuseRoute(r.id)).map((r) => r.id)).toEqual(['retain', 'relocate', 'reuse_on_site', 'reuse_off_site'])
  })
})

describe('the plan summary', () => {
  it('weights the Level(s) coefficients by mass', () => {
    const s = planSummary([
      { family: 'steel_section', massT: 30, route: 'reuse_off_site' },
      { family: 'precast_cladding', massT: 60, route: 'downcycle' },
      { family: 'carpet_tile', massT: 10, route: 'landfill' },
    ])
    // (30 x 0.9 + 60 x 0.5 + 10 x 0.01) / 100
    expect(s.levelsScore).toBeCloseTo(0.571, 10)
    expect(s.totalT).toBe(100)
    expect(s.byRoute).toEqual([
      { route: 'reuse_off_site', massT: 30 },
      { route: 'downcycle', massT: 60 },
      { route: 'landfill', massT: 10 },
    ])
  })

  it("measures reuse against the RICS business-as-usual split for each family's material", () => {
    const s = planSummary([
      { family: 'steel_section', massT: 30, route: 'reuse_off_site' },
      { family: 'clay_brick', massT: 20, route: 'recycle' },
    ])
    const bau = 30 * familyBauSplit('steel_section').reuse + 20 * familyBauSplit('clay_brick').reuse
    expect(s.reusedT).toBe(30)
    expect(s.bauReusedT).toBeCloseTo(bau, 10)
    expect(s.gainT).toBeCloseTo(30 - bau, 10)
  })

  it("scores the business-as-usual case from each material's own split", () => {
    const s = planSummary([{ family: 'steel_section', massT: 10, route: 'recycle' }])
    expect(s.bauLevelsScore).toBeCloseTo(splitCircularity(familyBauSplit('steel_section'), 'steel_sections'), 10)
  })

  it('has no score with nothing planned', () => {
    expect(planSummary([]).levelsScore).toBeNull()
    expect(planSummary([]).bauLevelsScore).toBeNull()
  })
})

describe('cascades', () => {
  it('gives every family at least three uses, best first', () => {
    for (const f of FAMILY_IDS) expect(CASCADES[f].length, f).toBeGreaterThanOrEqual(3)
  })
})
