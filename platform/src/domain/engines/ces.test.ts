// The circular economy statement workspace: the requirement, the stage matrix, the decision tree, the bill of
// materials, waste reporting, targets, the post-construction deadline and the quality check.
import { describe, expect, it } from 'vitest'
import { bomBenchmarks, bomRows, existingOutcome, needsJustification, postConstructionDue, qualityCheck, readiness, replacementsOver, stageRows, statementRequired, targetRows, wasteRow } from './ces'
import { BENCHMARKS } from '../reference/gla'
import { familyBauSplit } from './eol'
import type { BillLine } from '../types'

describe('is a statement needed', () => {
  it('for a referable scheme, in the City, or where the borough asks', () => {
    expect(statementRequired([], false, false)).toEqual({ required: false, reasons: [] })
    expect(statementRequired(['homes_150'], false, false).reasons).toEqual(['Referable to the Mayor: 150 homes or more'])
    // Only the first letter is lowered, so the City keeps its capital.
    expect(statementRequired(['height_city'], false, false).reasons).toEqual(['Referable to the Mayor: taller than 150 m in the City'])
    expect(statementRequired([], false, true).required).toBe(true)
    expect(statementRequired([], true, false).reasons).toEqual(["The borough's own plan asks for one"])
  })
})

describe('the stage matrix', () => {
  it('reads Table 5 at a stage, counting only what the stage requires', () => {
    const rows = stageRows('full', { targets: true, approaches: true, bill_of_materials: true })
    expect(rows.find((r) => r.id === 'principles')!.need).toBe('not_needed')
    expect(rows.find((r) => r.id === 'lessons')!.need).toBe('not_needed')
    // At the full application, nine items are required: targets, approaches, layers, two audits, the bill, end of life, operational waste and waste reporting.
    expect(readiness(rows)).toEqual({ done: 3, required: 9, share: 3 / 9 })
    expect(stageRows('post_construction', {}).find((r) => r.id === 'lessons')!.need).toBe('required')
  })
})

describe('the decision tree for existing buildings', () => {
  it('follows the template questions to one of the four approaches', () => {
    expect(existingOutcome({})).toBe('incomplete')
    expect(existingOutcome({ hasBuilding: 'no' })).toBe('new_building')
    expect(existingOutcome({ hasBuilding: 'yes', retainFeasible: 'yes', suited: 'yes' })).toBe('retain')
    // The template's own example: feasible but not suited, residual value recoverable.
    expect(existingOutcome({ hasBuilding: 'yes', retainFeasible: 'yes', suited: 'no', residualValue: 'yes' })).toBe('disassemble')
    expect(existingOutcome({ hasBuilding: 'yes', retainFeasible: 'no', residualValue: 'no' })).toBe('demolish')
    expect(existingOutcome({ hasBuilding: 'yes', retainFeasible: 'no' })).toBe('incomplete')
  })

  it('asks for a justification below retention', () => {
    expect(needsJustification('retain')).toBe(false)
    expect(needsJustification('disassemble')).toBe(true)
    expect(needsJustification('demolish')).toBe(true)
  })
})

describe('the bill of materials', () => {
  const lines: BillLine[] = [
    { id: 'a', element: '2.1 Frame', layer: 'Superstructure', massT: 1000, valueGbp: 1000000, recycledShare: 0.25, family: 'steel_section', lineQty: 1000 },
    { id: 'b', element: '2.7 Internal walls and partitions', layer: 'Space', massT: 100, valueGbp: 50000, recycledShare: 0.1, family: null, lineQty: null },
  ]

  it('reads intensity, lifespan, replacements over 60 years, site waste and end of life', () => {
    const [frame, walls] = bomRows(lines, 10000, 'bau')
    expect(frame).toMatchObject({ intensityKgM2: 100, recycledMassT: 250, recycledValue: 250000, lifespanYears: 60, replacements: 0, wasteFactor: 0.01, wasteT: 10 })
    expect(frame.eol).toEqual(familyBauSplit('steel_section'))
    // Studwork lasts 30 years: replaced once in 60.
    expect(walls).toMatchObject({ lifespanYears: 30, replacements: 1, wasteFactor: 0.04 })
  })

  it('takes the best practice split where it improves on business as usual', () => {
    const [frame] = bomRows(lines, 10000, 'best')
    expect(frame.eol.reuse).toBe(0.5)
    expect(frame.reusableT).toBe(500)
  })

  it('places each category against the guidance quartiles', () => {
    const b = bomBenchmarks(bomRows(lines, 10000, 'bau'), BENCHMARKS.lpg.values)
    expect(b.map((x) => [x.benchmark, x.intensityKgM2, x.position])).toEqual([
      ['frame', 100, 'lower_to_median'],
      ['partitions', 10, 'below_lower'],
    ])
  })

  it('counts replacements over the study period', () => {
    expect([60, 30, 25, 7].map((y) => replacementsOver(y))).toEqual([0, 1, 2, 8])
  })
})

describe('waste reporting', () => {
  it('reads reuse, recycling and recovery, and flags reuse that may be crushed material', () => {
    const r = wasteRow({ tonnes: 5000, routes: { reuseOnsite: 0.3, reuseOffsite: 0.1, recycleOnsite: 0.2, recycleOffsite: 0.35, landfill: 0.05, other: 0 }, source: 'Pre-demolition audit' }, 10000)
    expect(r).toMatchObject({ tonnes: 5000, tPerM2: 0.5, complete: true, guard: true })
    expect(r.reuse).toBeCloseTo(0.4, 10)
    expect(r.recovered).toBeCloseTo(0.95, 10)
    expect(wasteRow(undefined, 10000)).toMatchObject({ tonnes: null, complete: false })
  })
})

describe('targets', () => {
  it('marks aims above the minimum as pioneering, and aims at it as copied', () => {
    const rows = targetRows({ cd_recovery: 0.98, excavation: 0.95, content: 0.2 }, { cd_recovery: 0.96 })
    expect(rows.find((r) => r.id === 'cd_recovery')).toMatchObject({ pioneering: true, copiesMinimum: false, met: true })
    expect(rows.find((r) => r.id === 'excavation')).toMatchObject({ pioneering: false, copiesMinimum: true, met: null })
    expect(rows.find((r) => r.id === 'content')).toMatchObject({ basis: 'Guidance aim', copiesMinimum: true })
    expect(targetRows({ landfill_zero: 0 }, { landfill_zero: 0.02 }).find((r) => r.id === 'landfill_zero')).toMatchObject({ pioneering: false, met: false })
  })
})

describe('the post-construction deadline', () => {
  it('falls three calendar months after practical completion, at the month end when shorter', () => {
    expect(postConstructionDue('2029-07-20', 3)).toBe('2029-10-20')
    expect(postConstructionDue('2029-11-30', 3)).toBe('2030-02-28')
  })
})

describe('the quality check', () => {
  it('names each failing the monitoring report found', () => {
    const rows = qualityCheck({ templateComplete: false, pioneeringTargets: 0, allAtMinimum: true, hasBuilding: true, outcome: 'demolish', justified: false, audits: { preRedevelopment: false, preDemolition: true }, completionKnown: false })
    expect(rows.map((r) => [r.id, r.pass])).toEqual([
      ['template', false],
      ['minimum_targets', false],
      ['retention', false],
      ['audits', false],
      ['post_construction', false],
    ])
    const good = qualityCheck({ templateComplete: true, pioneeringTargets: 2, allAtMinimum: false, hasBuilding: true, outcome: 'disassemble', justified: true, audits: { preRedevelopment: true, preDemolition: true }, completionKnown: true })
    expect(good.every((r) => r.pass)).toBe(true)
    // Unanswered is not "no building": retention and the audits wait for the answer; a cleared site passes both.
    const unanswered = qualityCheck({ templateComplete: true, pioneeringTargets: 1, allAtMinimum: false, hasBuilding: null, outcome: 'incomplete', justified: false, audits: { preRedevelopment: false, preDemolition: false }, completionKnown: true })
    expect(unanswered.filter((r) => !r.pass).map((r) => r.id)).toEqual(['retention', 'audits'])
    const cleared = qualityCheck({ templateComplete: true, pioneeringTargets: 1, allAtMinimum: false, hasBuilding: false, outcome: 'new_building', justified: false, audits: { preRedevelopment: false, preDemolition: false }, completionKnown: true })
    expect(cleared.every((r) => r.pass)).toBe(true)
  })
})
