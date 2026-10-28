// Specification v2 and the procurement pack: clause rows, filled clauses, award weightings and the price schedule.
import { describe, expect, it } from 'vitest'
import { awardProblem, fillClause, priceSchedule, reuseWeight, specClauseRows } from './procurement'
import { AWARD_TEMPLATES, CLAUSE_LIBRARY, defaultClauseIds, SPEC_DEFAULTS } from '../reference/procurement'
import { FAMILY_IDS } from '../reference/families'

describe('a reuse clause', () => {
  it("is generated from the family's guides in the factsheet 12 structure", () => {
    const rows = specClauseRows('clay_brick', undefined, 'free_issue')
    expect(rows.map((r) => r.label)).toEqual(['Supply route', 'Location', 'Ranges and tolerances', 'Accepted patina', 'Operations on this batch', 'Acceptance', 'Surplus for repairs', 'Storage', 'New fallback', 'Marking'])
    const v = Object.fromEntries(rows.map((r) => [r.label, r.value]))
    expect(v['Supply route']).toBe('Free issue by the client')
    expect(v['Surplus for repairs']).toBe('5% over the quantity needed')
    expect(v['New fallback']).toBe('New clay brick of the same performance, where the reclaimed items cannot be obtained within the estimated price range.')
    expect(rows.every((r) => !r.edited)).toBe(true)
  })

  it("takes the architect's own entries over the generated text", () => {
    const rows = specClauseRows('steel_section', { location: 'Level 2 to 4 secondary beams', route: 'dealer', surplusShare: 0.02 }, 'free_issue')
    expect(rows.find((r) => r.field === 'location')).toMatchObject({ value: 'Level 2 to 4 secondary beams', edited: true })
    expect(rows.find((r) => r.field === 'route')).toMatchObject({ value: 'Through a dealer or stockholder', edited: true })
    expect(rows.find((r) => r.field === 'surplus')).toMatchObject({ value: '2% over the quantity needed', edited: true })
  })

  it('has ranges, patina and operations for every family', () => {
    for (const f of FAMILY_IDS) expect(SPEC_DEFAULTS[f].tolerances.length, f).toBeGreaterThan(10)
  })
})

describe('the clause pack', () => {
  it('fills the objective, the review cap and the provisional sum', () => {
    const fill = { targetShare: 0.05, unit: 'value' as const, reviewCap: 0.15, provisionalShare: 0.1 }
    expect(fillClause(CLAUSE_LIBRARY.find((c) => c.id === 'objective')!.text, fill)).toMatch(/^The project aims to reuse at least 5% of its building materials by value\./)
    expect(fillClause(CLAUSE_LIBRARY.find((c) => c.id === 'review')!.text, fill)).toContain('no more than 15% of the contract value')
    expect(fillClause(CLAUSE_LIBRARY.find((c) => c.id === 'provisional')!.text, fill)).toContain('A provisional sum of 10% of the reclaimed supply')
  })

  it('includes the free issue clause only on that route', () => {
    expect(defaultClauseIds('free_issue')).toContain('free_issue')
    expect(defaultClauseIds('free_issue')).not.toContain('review')
    expect(defaultClauseIds('contractor_sourced')).toContain('review')
    expect(defaultClauseIds('contractor_sourced')).not.toContain('free_issue')
  })
})

describe('award weightings', () => {
  it('accepts every template, each with a reuse criterion', () => {
    for (const t of Object.values(AWARD_TEMPLATES)) expect(awardProblem(t.criteria)).toBeNull()
    expect(reuseWeight(AWARD_TEMPLATES.urban_works.criteria)).toBe(10)
  })

  it('refuses weights that do not add up, or leave reuse out', () => {
    const c = AWARD_TEMPLATES.renovation.criteria
    expect(awardProblem(c.map((x, i) => (i === 0 ? { ...x, weight: 70 } : x)))).toBe('The weights add up to 90. They must add up to 100.')
    expect(awardProblem(c.map((x) => ({ ...x, reuse: false })))).toMatch(/^Give reuse a weight/)
    expect(awardProblem(c.map((x, i) => (i === 0 ? { ...x, weight: 79.5 } : x)))).toBe('Give each weight as a whole number from 0 to 100.')
  })
})

describe('the price schedule', () => {
  it('prices the reclaimed range and new, with a provisional sum on the guide total', () => {
    const s = priceSchedule([{ publicId: 'L-AAAA01', title: 'UB', family: 'steel_section', units: 10, unitLabel: 't', low: 670, high: 770, guide: 720 }], 0.1)
    expect(s).toMatchObject({ reclaimedLow: 6700, reclaimedHigh: 7700, reclaimedGuide: 7200, newCost: 10000, provisional: 720 })
  })
})
