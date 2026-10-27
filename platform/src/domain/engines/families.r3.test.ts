// The six families added in round 3 (BRIEF section 15.2): mass, titles, the capture assist, the specification
// rows and the downloads all know them.
import { describe, it, expect } from 'vitest'
import { closeTo } from '../../test/helpers'
import { FORBIDDEN } from '../../ui/testing'
import type { PublicListing, Quantity, Spec } from '../types'
import { measuresFor } from './measures'
import { titleFor } from '../reference/families'
import { captureAssist } from './assist'
import { specFieldRows } from './specSheet'
import { dxfFor, objFor, profileOf } from './geometry'
import { ifcFor } from './ifc'
import { typologyOf } from './typology'

const CASES: { spec: Spec; quantity: Quantity; massT: number; areaM2: number | null; title: string }[] = [
  { spec: { family: 'natural_slate', origin: 'Welsh', sizeMm: '500 by 250' }, quantity: { kind: 'pieces', pieces: 10000 }, massT: 21, areaM2: null, title: 'Welsh roofing slates, 500 by 250 mm' },
  { spec: { family: 'stone_paving', stone: 'York', thicknessMm: 50 }, quantity: { kind: 'area', areaM2: 400 }, massT: 52, areaM2: 400, title: 'York stone paving, 50 mm' },
  { spec: { family: 'carpet_tile', sizeMm: '500 by 500', backing: 'bitumen backing' }, quantity: { kind: 'pieces', pieces: 4000 }, massT: 4.24, areaM2: 1000, title: 'Carpet tiles, 500 by 500 mm, bitumen backing' },
  { spec: { family: 'metal_ceiling_tile', sizeMm: '600 by 600', finish: 'white, perforated' }, quantity: { kind: 'pieces', pieces: 2500 }, massT: 4.25, areaM2: 900, title: 'Metal ceiling tiles, 600 by 600 mm, white, perforated' },
  { spec: { family: 'glulam_beam', strengthClass: 'GL24h', sectionMm: '400 by 140' }, quantity: { kind: 'volume', volumeM3: 12 }, massT: 5.4, areaM2: null, title: 'Glulam beams, GL24h, 400 by 140 mm' },
  { spec: { family: 'hollowcore_plank', depthMm: 200 }, quantity: { kind: 'area', areaM2: 600 }, massT: 168, areaM2: 600, title: 'Precast hollowcore planks, 200 mm deep' },
]

function listing(spec: Spec): PublicListing {
  return { publicId: 'L-TEST01', sharing: 'open', family: spec.family, title: titleFor(spec), spec, quantity: { value: 1, unit: 'unit', pieces: null }, massT: 1, condition: 'A', testStatus: 'untested', grade: null, sourceType: 'deconstruction', sellerType: 'Asset owner', eraBand: null, location: { level: 'region', label: 'Central London' }, availability: { kind: 'now' }, collectionHubId: null, listedMonth: '2026-10', status: 'available', price: { guide: 1, low: 1, high: 1, signal: 'balanced' }, carbon: null, photos: [] } as unknown as PublicListing
}

describe('round 3 families', () => {
  for (const c of CASES) {
    it(`${c.spec.family}: mass, area and title`, () => {
      const m = measuresFor(c.spec, c.quantity)
      closeTo(m.massT, c.massT, 3)
      expect(m.areaM2).toBe(c.areaM2)
      expect(titleFor(c.spec)).toBe(c.title)
      expect(typologyOf(c.spec.family)).toMatch(/structure|envelope|finishes/)
    })
    it(`${c.spec.family}: specification rows in house style, and every download available`, () => {
      const rows = specFieldRows(c.spec)
      expect(rows.length).toBeGreaterThan(0)
      for (const r of rows) expect(`${r.label} ${r.value}`).not.toMatch(FORBIDDEN)
      const l = listing(c.spec)
      expect('unavailable' in profileOf(l)).toBe(false)
      expect(dxfFor(l).kind).not.toBe('unavailable')
      expect(objFor(l).kind).not.toBe('unavailable')
      expect(ifcFor(l, '2026-10-27').kind).not.toBe('unavailable')
    })
  }
  it('the capture assist recognises each family from a description', () => {
    expect(captureAssist('About 9,000 Welsh slates on the main roof').family).toBe('natural_slate')
    expect(captureAssist('York stone paving to the rear court, 320 m2').family).toBe('stone_paving')
    expect(captureAssist('3,200 carpet tiles on levels 2 to 4').family).toBe('carpet_tile')
    expect(captureAssist('Metal ceiling tiles, 1,800 of them').family).toBe('metal_ceiling_tile')
    expect(captureAssist('Glulam beams over the atrium, 6 m3').family).toBe('glulam_beam')
    expect(captureAssist('Hollowcore planks to the car park deck, 480 m2').family).toBe('hollowcore_plank')
    expect(captureAssist('Precast cladding panels 150 mm, 300 m2').family).toBe('precast_cladding')
    expect(captureAssist('Timber joists, 4 m3').family).toBe('timber_joist')
  })
})
