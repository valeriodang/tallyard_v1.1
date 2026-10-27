import { describe, it, expect } from 'vitest'
import { closeTo } from '../../test/helpers'
import { bauSplit, familyBauSplit, reuseGainOverBau, scenarioSplit, splitCircularity, FAMILY_EOL_MATERIAL } from './eol'
import { FAMILY_IDS } from '../reference/families'

describe('end of life against business as usual (RICS Tables 23 and 24)', () => {
  it('reads each family as a Table 23 material', () => {
    for (const f of FAMILY_IDS) expect(() => familyBauSplit(f), f).not.toThrow()
    expect(FAMILY_EOL_MATERIAL.steel_section.material).toBe('steel_sections')
  })
  it('good practice for solid timber keeps its own lower disposal and energy recovery', () => {
    const s = scenarioSplit('good', bauSplit('timber_solid'))
    expect(s.reuse).toBe(0.25)
    expect(s.disposal).toBe(0.01)
    expect(s.energy).toBe(0.2)
    closeTo(s.recycle, 0.54, 6)
  })
  it('best practice for steel: half reused, half recycled, nothing worse than its business-as-usual disposal', () => {
    const s = scenarioSplit('best', bauSplit('steel_sections'))
    expect(s).toEqual({ reuse: 0.5, recycle: 0.5, energy: 0, disposal: 0 })
  })
  it('business as usual is the material itself', () => {
    expect(scenarioSplit('bau', bauSplit('glass'))).toEqual(bauSplit('glass'))
  })
  it('Level(s) circularity: steel at business as usual is 0.07 x 1 + 0.93 x 0.75', () => {
    closeTo(splitCircularity(bauSplit('steel_sections'), 'steel_sections'), 0.7675, 6)
    closeTo(splitCircularity(bauSplit('plasterboard'), 'plasterboard'), 0.17 * 0.5 + 0.83 * 0.01, 6)
  })
  it('the gain of reusing 10 t of steel in full over the 7% business-as-usual reuse', () => {
    const g = reuseGainOverBau('steel_section', 10)
    closeTo(g.bauReusedT, 0.7, 6)
    closeTo(g.gainT, 9.3, 6)
  })
})
