// Round 3 reference tables (BRIEF section 15.2): the figures as the sources print them, and Methodology rows that
// each carry a source and a status in house style.
import { describe, it, expect } from 'vitest'
import { closeTo } from '../../test/helpers'
import { FORBIDDEN } from '../../ui/testing'
import { DENIED_NAMES } from './names'
import { BAU_END_OF_LIFE, EOL_SCENARIOS, LIFESPANS, TRANSPORT_DEFAULTS, WASTE_RATES } from './rics'
import { ICE_FACTORS, iceFactor } from './ice'
import { LEVELS_COEFFICIENTS } from './levels'
import { BENCHMARKS, BENCHMARK_IDS, GLA_TARGETS, STAGE_MATRIX, CONTENT_COVERAGE_MIN } from './gla'
import { RETROFIT_MIN_SUPERSTRUCTURE_SHARE, CITY_OFFICE_BENCHMARKS, CITY_CONDITION_BANDS } from './cityOfLondon'
import { BREEAM_V61_ISSUES, LEED_DIVERSION_PATHS, LEED_ONSITE_REUSE_POINTS } from './schemes'
import { r3ParameterRows } from './r3rows'
import { FAMILIES } from './families'

describe('RICS 2nd edition tables', () => {
  it('Table 17 transport defaults', () => {
    expect(TRANSPORT_DEFAULTS.local).toMatchObject({ roadKm: 50, seaKm: 0 })
    expect(TRANSPORT_DEFAULTS.regional).toMatchObject({ roadKm: 80, seaKm: 0 })
    expect(TRANSPORT_DEFAULTS.national).toMatchObject({ roadKm: 120, seaKm: 0 })
    expect(TRANSPORT_DEFAULTS.european).toMatchObject({ roadKm: 1500, seaKm: 100 })
    expect(TRANSPORT_DEFAULTS.global).toMatchObject({ roadKm: 500, seaKm: 10000 })
  })
  it('Table 18 waste rates include the steel frame at 1% and brickwork at 6%', () => {
    expect(WASTE_RATES.find((r) => r.id === 'steel_frame')!.rate).toBe(0.01)
    expect(WASTE_RATES.find((r) => r.id === 'brickwork')!.rate).toBe(0.06)
    expect(WASTE_RATES).toHaveLength(27)
  })
  it('Table 20 lifespans: raised floor pedestals 50 years, tiles 30, curtain walling 35', () => {
    const y = (id: string) => LIFESPANS.find((r) => r.id === id)!.years
    expect([y('raf_pedestal'), y('raf_tile'), y('curtain_walling'), y('superstructure')]).toEqual([50, 30, 35, 60])
  })
  it('Table 23 business-as-usual splits each sum to 100%, and steel sections reuse 7%', () => {
    for (const r of BAU_END_OF_LIFE) closeTo(r.split.reuse + r.split.recycle + r.split.energy + r.split.disposal, 1, 6)
    expect(BAU_END_OF_LIFE.find((r) => r.id === 'steel_sections')!.split).toEqual({ reuse: 0.07, recycle: 0.93, energy: 0, disposal: 0 })
  })
  it('Table 24 scenarios: good practice 25, 70, 5; best practice 50, about 50, under 1', () => {
    expect(EOL_SCENARIOS.good.split).toEqual({ reuse: 0.25, recycle: 0.7, energy: 0, disposal: 0.05 })
    expect(EOL_SCENARIOS.best.split!.reuse).toBe(0.5)
    expect(EOL_SCENARIOS.best.split!.disposal).toBeLessThan(0.01)
    expect(EOL_SCENARIOS.bau.split).toBeNull()
  })
})

describe('other round 3 sources', () => {
  it('ICE V3 factors as the audit tables them', () => {
    expect(ICE_FACTORS).toHaveLength(11)
    expect([iceFactor('steel_section'), iceFactor('aluminium'), iceFactor('chipboard')]).toEqual([1.55, 6.58, 0.7])
  })
  it('Level(s) 2.4 coefficients from direct reuse 1.00 to hazardous disposal 0', () => {
    expect(Object.values(LEVELS_COEFFICIENTS).map((x) => x.coefficient)).toEqual([1, 0.9, 0.75, 0.5, 0.25, 0.15, 0.01, 0])
  })
  it('the GLA targets keep their basis: reuse, recycling and recovery by weight in policy, content by value as an aim', () => {
    const t = (id: string) => GLA_TARGETS.find((x) => x.id === id)!
    expect(t('cd_recovery')).toMatchObject({ value: 0.95, unit: 'by weight', basis: 'policy' })
    expect(t('excavation')).toMatchObject({ value: 0.95, basis: 'policy' })
    expect(t('content')).toMatchObject({ value: 0.2, unit: 'by value', basis: 'guidance_aim' })
    expect(t('municipal')).toMatchObject({ value: 0.65, by: '2030' })
    expect(CONTENT_COVERAGE_MIN).toBe(0.8)
  })
  it('the stage matrix has the eleven items of the guidance, with a bill of materials at outline, full and post-construction', () => {
    expect(STAGE_MATRIX).toHaveLength(11)
    expect(STAGE_MATRIX.find((r) => r.id === 'bill_of_materials')!.needs).toEqual({ pre_app: 'not_needed', outline: 'required', full: 'required', post_construction: 'required' })
  })
  it('benchmark quartiles run from lower to upper for every metric in every set', () => {
    for (const set of Object.values(BENCHMARKS)) for (const id of BENCHMARK_IDS) {
      const q = set.values[id]
      expect(q.lower).toBeLessThan(q.median)
      expect(q.median).toBeLessThan(q.upper)
    }
    expect(BENCHMARKS.lpg.values.frame.median).toBe(208.04)
  })
  it('the City retrofit test is half the superstructure by mass, and its office benchmarks', () => {
    expect(RETROFIT_MIN_SUPERSTRUCTURE_SHARE).toBe(0.5)
    expect(CITY_OFFICE_BENCHMARKS.map((b) => b.value)).toEqual([1400, 970, 600, 370])
    expect(CITY_CONDITION_BANDS.map((b) => b.route)).toEqual(['reuse', 'reuse', 'repurpose', 'repurpose', 'recycle', 'recycle'])
  })
  it('BREEAM V6.1 numbers material efficiency Mat 06 and durability Mat 05', () => {
    expect(BREEAM_V61_ISSUES.find((i) => i.code === 'Mat 06')!.title).toBe('Material efficiency')
    expect(BREEAM_V61_ISSUES.find((i) => i.code === 'Mat 05')!.title).toBe('Designing for durability and resilience')
  })
  it('LEED v5 interiors points ladders', () => {
    expect(LEED_ONSITE_REUSE_POINTS.map((x) => [x.atLeast, x.points])).toEqual([[0.1, 1], [0.2, 2], [0.3, 3], [0.4, 4]])
    expect(LEED_DIVERSION_PATHS.map((x) => x.divertedAtLeast)).toEqual([0.35, 0.5, 0.65])
  })
})

describe('Methodology rows', () => {
  const rows = r3ParameterRows()
  it('each row has a group, a label, a value, a source and a status, and unique ids', () => {
    expect(rows.length).toBeGreaterThan(100)
    for (const r of rows) {
      expect(r.group && r.label && r.value && r.source, r.id).toBeTruthy()
      expect(['published', 'indicative', 'placeholder', 'candidate']).toContain(r.status)
    }
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
  })
  it('house style: no dashes, arrows, ticks or comparison signs, and no real firm named', () => {
    for (const r of rows) {
      const text = `${r.group} ${r.label} ${r.value} ${r.unit} ${r.source}`
      expect(text, r.id).not.toMatch(FORBIDDEN)
      for (const n of DENIED_NAMES) expect(text, r.id).not.toContain(n)
    }
  })
  it('every family names its RICS transport category and the source of its mass rule', () => {
    for (const f of Object.values(FAMILIES)) {
      expect(TRANSPORT_DEFAULTS[f.newOrigin]).toBeTruthy()
      expect(f.massRuleSource.length).toBeGreaterThan(5)
    }
  })
})
