// The reclaimed steel pathway against the rules in the research notes: P427 admissibility, the ADVANCE protocols and
// their sampling, the display statuses and the NDT-only limit.
import { describe, expect, it } from 'vitest'
import type { AdmissibilityAnswers, SteelRecord } from '../qualityTypes'
import { admissibility, checkAgainst, protocolFor, samplesNeeded, statusFrom, usableGrade } from './steelAssessment'

const good: AdmissibilityAnswers = { builtAfter1970: 'yes', fireExposure: 'no', plasticDeformation: 'no', sectionLossOver5: 'no', builtUpOrSpliced: 'no', fatigueLoading: 'no', withinTolerances: 'yes' }
const record = (r: Partial<SteelRecord>): SteelRecord => ({ provenance: 'P1', assessment: 'S1', groupId: 'G1', admissibility: good, samplesTested: 0, certificate: null, ...r })

describe('P427 admissibility', () => {
  it('admits a sound member made after 1970', () => {
    expect(admissibility(good)).toEqual({ verdict: 'admissible', fails: [], conditions: [], unknown: [] })
  })

  it('rules out fire, plastic deformation, section loss over 5% and members out of tolerance', () => {
    const a = admissibility({ ...good, fireExposure: 'yes', sectionLossOver5: 'yes' })
    expect(a.verdict).toBe('not_admissible')
    expect(a.fails).toEqual(['Exposed to fire', 'Corrosion section loss over 5% of the thickness'])
    expect(admissibility({ ...good, withinTolerances: 'no' }).verdict).toBe('not_admissible')
    expect(admissibility({ ...good, plasticDeformation: 'yes' }).verdict).toBe('not_admissible')
  })

  it('routes steel made before 1970 to P440 rather than rejecting it', () => {
    expect(admissibility({ ...good, builtAfter1970: 'no' }).verdict).toBe('p440')
  })

  it('admits built-up members and fatigue-loaded members on a condition', () => {
    const a = admissibility({ ...good, builtUpOrSpliced: 'yes', fatigueLoading: 'yes' })
    expect(a.verdict).toBe('conditional')
    expect(a.conditions).toHaveLength(2)
  })

  it('waits for every answer', () => {
    const a = admissibility({ ...good, fireExposure: 'unknown' })
    expect(a.verdict).toBe('incomplete')
    expect(a.unknown).toEqual(['No fire exposure'])
  })
})

describe('the testing protocol and its sampling', () => {
  it('follows the flowchart from provenance', () => {
    expect(protocolFor('P2')).toBe('A')
    expect(protocolFor('P1')).toBe('B')
    expect(protocolFor('P1', { grade: 'S355', exc: 'EXC2' })).toBe('C')
    expect(protocolFor('P1', { grade: 'S355', exc: 'EXC1' })).toBe('B')
    expect(protocolFor('P3')).toBe('D')
    expect(protocolFor('P0')).toBe('D')
  })

  it('tests none, one, three or every member of a group', () => {
    expect([samplesNeeded('A', 40), samplesNeeded('B', 40), samplesNeeded('C', 40), samplesNeeded('D', 40)]).toEqual([0, 1, 3, 40])
    expect(samplesNeeded('C', 2)).toBe(2)
    expect(samplesNeeded('B', 0)).toBe(0)
  })
})

describe('what buyers and designers see', () => {
  it('keeps the four statuses as the summary', () => {
    expect(['S0', 'S1', 'S2', 'S3', 'S4'].map((s) => statusFrom({ provenance: 'P1', assessment: s as SteelRecord['assessment'] }))).toEqual(['untested', 'inspected', 'inspected', 'tested', 'certified'])
    // Traceable papers confirmed by a hardness check count as tested.
    expect(statusFrom({ provenance: 'P2', assessment: 'S2' })).toBe('tested')
  })

  it('lets a designer use S275 at most on NDT, and the certificate grade once tested', () => {
    expect(usableGrade(record({ assessment: 'S0' }))).toBe('unknown')
    expect(usableGrade(record({ assessment: 'S2' }))).toBe('S275')
    expect(usableGrade(record({ assessment: 'S3', certificate: { ref: 'C-1', lab: 'Brindmoor Testing', issuedOn: '2026-09-01', grade: 'S355' } }))).toBe('S355')
    expect(usableGrade(record({ assessment: 'S3' }))).toBe('unknown')
  })
})

describe('a project limits', () => {
  it('accepts NDT alone for EXC1 at any grade and for EXC2 below S355', () => {
    expect(checkAgainst(record({ assessment: 'S2' }), { exc: 'EXC1', cc: 'CC2', fatigue: false, seismic: false, grade: 'S355' })).toMatchObject({ required: 'S2', meets: true })
    expect(checkAgainst(record({ assessment: 'S2' }), { exc: 'EXC2', cc: 'CC2', fatigue: false, seismic: false, grade: 'S275' })).toMatchObject({ required: 'S2', meets: true })
  })

  it('needs destructive tests for S355 at EXC2, for EXC3, and for fatigue or seismic uses', () => {
    expect(checkAgainst(record({ assessment: 'S2' }), { exc: 'EXC2', cc: 'CC2', fatigue: false, seismic: false, grade: 'S355' })).toMatchObject({ required: 'S3', meets: false, leadWeeks: 5 })
    expect(checkAgainst(record({ assessment: 'S3' }), { exc: 'EXC3', cc: 'CC2', fatigue: false, seismic: false, grade: 'S275' })).toMatchObject({ required: 'S3', meets: true, leadWeeks: 2 })
    expect(checkAgainst(record({ assessment: 'S2' }), { exc: 'EXC1', cc: 'CC1', fatigue: true, seismic: false, grade: 'S275' }).required).toBe('S3')
    expect(checkAgainst(record({ assessment: 'S4' }), { exc: 'EXC1', cc: 'CC1', fatigue: false, seismic: true, grade: 'S275' }).notes).toEqual(['Seismic use: ductility to EN 1993-1-1 clause 5.2.2 from the tests'])
  })

  it('never fits a member loaded in fatigue to a fatigue-sensitive use, and flags consequence class 3', () => {
    const fatigued = record({ assessment: 'S4', admissibility: { ...good, fatigueLoading: 'yes' } })
    const c = checkAgainst(fatigued, { exc: 'EXC2', cc: 'CC3', fatigue: true, seismic: false, grade: 'S275' })
    expect(c.meets).toBe(false)
    expect(c.notes).toEqual(['Fatigue loaded in its first life: not for a fatigue-sensitive use', 'Consequence class 3: the engineer sets extra testing beyond the protocol'])
  })
})
