import { describe, it, expect } from 'vitest'
import { quartilePosition, breeamWasteCredits, hqmWasteCredits } from './benchmark'
import { circularityScore } from './circularity'
import { closeTo } from '../../test/helpers'
import { BENCHMARKS } from '../reference/gla'

describe('benchmarks and credits', () => {
  const demolition = BENCHMARKS.lpg.values.demolition_waste
  it('places a value against the guidance quartiles', () => {
    expect(quartilePosition(0.1, demolition)).toBe('below_lower')
    expect(quartilePosition(0.253, demolition)).toBe('lower_to_median')
    expect(quartilePosition(0.48, demolition)).toBe('lower_to_median')
    expect(quartilePosition(0.7, demolition)).toBe('median_to_upper')
    expect(quartilePosition(1.2, demolition)).toBe('above_upper')
  })
  it('BREEAM Wst 01 bands at 0.110, 0.065, 0.032 and 0.019 t per m2', () => {
    expect(breeamWasteCredits(0.2)).toBeNull()
    expect(breeamWasteCredits(0.11)).toBe('1 credit')
    expect(breeamWasteCredits(0.078)).toBe('1 credit')
    expect(breeamWasteCredits(0.065)).toBe('2 credits')
    expect(breeamWasteCredits(0.03)).toBe('3 credits')
    expect(breeamWasteCredits(0.019)).toBe('Exemplary')
    expect(hqmWasteCredits(0.05)).toBe('2 credits')
    expect(hqmWasteCredits(0.02)).toBe('6 credits')
  })
  it('the Level(s) score weights each route by mass', () => {
    closeTo(circularityScore([{ massT: 10, route: 'direct_reuse' }, { massT: 10, route: 'landfill' }])!, 0.505, 6)
    expect(circularityScore([])).toBeNull()
  })
})
