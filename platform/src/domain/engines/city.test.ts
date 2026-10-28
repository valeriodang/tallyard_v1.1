import { describe, expect, it } from 'vitest'
import { bandOf, cityMinimums, cityUpdates, reviewerReady } from './city'
import type { ProgrammeDates } from '../types'

const P: ProgrammeDates = { stageStarts: ['2025-09-01', '2025-12-01', '2026-06-01', '2026-11-02', '2027-02-01'], siteStart: '2027-11-01', practicalCompletion: '2029-06-29' }
const NONE = { stage4: null, stage6: null }

describe('the City of London module', () => {
  it('counts the three minimums of five each', () => {
    expect(cityMinimums(5, 4, 0).map((m) => [m.id, m.needed, m.met])).toEqual([
      ['catalogue', 5, true],
      ['schedule', 5, false],
      ['passports', 5, false],
    ])
  })

  it('routes the condition bands: 1 and 2 reuse, 3 and 4 repurpose, 5 and 6 recycle', () => {
    expect(([1, 2, 3, 4, 5, 6] as const).map((b) => bandOf(b).route)).toEqual(['reuse', 'reuse', 'repurpose', 'repurpose', 'recycle', 'recycle'])
  })

  it('dates the statement updates to RIBA stages 4 and 6 of the programme', () => {
    const [s4, s6] = cityUpdates(P, NONE, '2026-10-28')
    expect(s4).toMatchObject({ stage: 4, from: '2027-02-01', to: '2027-10-31', status: 'upcoming' })
    expect(s6).toMatchObject({ stage: 6, from: '2029-06-29', status: 'upcoming' })
    expect(cityUpdates(P, NONE, '2027-02-01')[0].status).toBe('due')
    expect(cityUpdates(P, NONE, '2027-10-31')[0].status).toBe('due')
    expect(cityUpdates(P, NONE, '2027-11-01')[0].status).toBe('overdue')
    expect(cityUpdates(P, { stage4: '2027-06-01', stage6: null }, '2027-11-01')[0]).toMatchObject({ status: 'done', doneOn: '2027-06-01' })
    expect(cityUpdates(P, NONE, '2029-07-01')[1].status).toBe('due')
  })

  it("needs a named reviewer with at least three years' experience", () => {
    expect(reviewerReady({ name: 'A reviewer', years: 3 })).toBe(true)
    expect(reviewerReady({ name: 'A reviewer', years: 2 })).toBe(false)
    expect(reviewerReady({ name: ' ', years: 10 })).toBe(false)
    expect(reviewerReady({ name: 'A reviewer', years: null })).toBe(false)
  })
})
