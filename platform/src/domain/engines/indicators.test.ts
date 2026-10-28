import { describe, expect, it } from 'vitest'
import { bandPosition, endOfLifeScore, layerReuse, wholeReuse } from './indicators'
import type { BillLine } from '../types'

const line = (layer: string, massT: number): BillLine => ({ id: `${layer}-${massT}`, element: '1 Substructure', layer, massT, valueGbp: 1, recycledShare: 0, family: null, lineQty: null })

describe('the indicators panel', () => {
  it('reads reuse by mass per toolkit layer against its band, leaving services out', () => {
    const rows = layerReuse([
      { line: line('Substructure', 1000), reusedPercent: 0 },
      { line: line('Superstructure', 1000), reusedPercent: 0.03 },
      { line: line('Shell/Skin', 100), reusedPercent: 0.2 },
      { line: line('Space', 50), reusedPercent: 0.05 },
      { line: line('Services', 400), reusedPercent: 0.5 },
    ])
    expect(rows.map((r) => [r.id, r.totalT, Number(r.share.toFixed(4)), r.position])).toEqual([
      ['structure', 2000, 0.015, 'within'],
      ['skin', 100, 0.2, 'above'],
      ['space_plan', 50, 0.05, 'below'],
    ])
  })

  it('places the whole building against the conventional 1% to 10%', () => {
    expect(wholeReuse([{ line: line('Superstructure', 1000), reusedPercent: 0.005 }])).toMatchObject({ share: 0.005, position: 'below' })
    expect(wholeReuse([{ line: line('Superstructure', 1000), reusedPercent: 0.12 }]).position).toBe('above')
    expect(wholeReuse([])).toMatchObject({ share: null, position: null })
    expect([bandPosition(0.01, 0.01, 0.1), bandPosition(0.1, 0.01, 0.1)]).toEqual(['within', 'within'])
  })

  it('weights each line end of life by mass with the Level(s) coefficients', () => {
    // Steel: 10% reuse at 1.00 and 90% pure-stream recycling at 0.75 is 0.775; concrete recycled mixed at 0.50.
    const score = endOfLifeScore([
      { massT: 100, eol: { reuse: 0.1, recycle: 0.9, energy: 0, disposal: 0 }, eolMaterial: 'steel_sections' },
      { massT: 100, eol: { reuse: 0, recycle: 1, energy: 0, disposal: 0 }, eolMaterial: 'concrete_in_situ' },
    ])
    expect(score).toBeCloseTo(0.6375, 9)
    expect(endOfLifeScore([])).toBeNull()
  })
})
