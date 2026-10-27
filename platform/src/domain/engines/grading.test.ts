// Grading verdicts, assurance tiers by layer, the public quality projection and the tested-for-reuse label.
import { describe, expect, it } from 'vitest'
import type { ItemQuality } from '../qualityTypes'
import { assuranceTier, gradingVerdict, layerNeed, meetsLayerNeed, orderQuantity, publicQualityOf, usableQuantity } from './grading'
import { fitLine, reuseLabelSvg } from './reuseLabel'

const q = (over: Partial<ItemQuality> = {}): ItemQuality => ({ checks: {}, rejects: [], hazards: [], yieldShare: null, processing: 'as_removed', warranty: { kind: 'none', years: null, note: '' }, steel: null, updatedAt: '2026-10-01T09:00:00.000Z', ...over })

describe('grading verdicts', () => {
  it('counts the checks done and names what is missing', () => {
    const v = gradingVerdict('raised_floor', q({ checks: { photos: true, dry: true, carpet_off: false } }))
    expect(v).toMatchObject({ rejected: false, checksDone: 2, checksTotal: 5 })
    expect(v.missing).toEqual(['Carpet removed', 'Underside label read: reference, date, load and fire class', 'On pallets, 32 panels to a pallet'])
  })

  it('rejects on any reject criterion found', () => {
    const v = gradingVerdict('clay_brick', q({ rejects: ['odour'] }))
    expect(v.rejected).toBe(true)
    expect(v.rejectLabels).toEqual(['Burn marks, or ammonia or fuel odours'])
  })

  it('reads an item with no record as nothing checked', () => {
    expect(gradingVerdict('steel_section', undefined)).toMatchObject({ rejected: false, checksDone: 0, checksTotal: 3 })
  })
})

describe('assurance by layer', () => {
  it('takes the strongest assurance an item has', () => {
    expect(assuranceTier('untested', 'none')).toBe('declared')
    expect(assuranceTier('inspected', 'none')).toBe('inspected')
    expect(assuranceTier('certified', 'none')).toBe('tested')
    expect(assuranceTier('untested', 'manufacturer')).toBe('warranted')
  })

  it('asks test proof of the structure, inspection of the skin and a warranty of the space plan', () => {
    expect([layerNeed('steel_section'), layerNeed('stone_cladding'), layerNeed('raised_floor'), layerNeed('stone_paving')]).toEqual(['tested', 'inspected', 'warranted', 'declared'])
  })

  it('never lets a warranty stand in for test proof in the structure', () => {
    expect(meetsLayerNeed('tested', { testStatus: 'untested', warranty: 'insured' })).toBe(false)
    expect(meetsLayerNeed('tested', { testStatus: 'tested', warranty: 'none' })).toBe(true)
    expect(meetsLayerNeed('inspected', { testStatus: 'untested', warranty: 'seller' })).toBe(true)
    expect(meetsLayerNeed('warranted', { testStatus: 'certified', warranty: 'none' })).toBe(false)
    expect(meetsLayerNeed('declared', { testStatus: 'untested', warranty: 'none' })).toBe(true)
  })
})

describe('yield and surplus', () => {
  it('works out what is usable and what to order', () => {
    expect(usableQuantity(48, 0.7)).toBeCloseTo(33.6, 10)
    expect(orderQuantity(1000, 0.05)).toBeCloseTo(1050, 10)
  })
})

describe('what a buyer learns', () => {
  it('holds fixed values only: no notes, groups or certificate details', () => {
    const p = publicQualityOf({
      testStatus: 'tested',
      quality: q({
        hazards: [
          { id: 'lead_paint', status: 'confirmed' },
          { id: 'asbestos', status: 'cleared' },
          { id: 'red_lead', status: 'suspected' },
        ],
        processing: 'cleaned',
        warranty: { kind: 'seller', years: 2, note: 'Two years from delivery, private note' },
        steel: { provenance: 'P1', assessment: 'S3', groupId: 'UB secondary', admissibility: { builtAfter1970: 'yes', fireExposure: 'no', plasticDeformation: 'no', sectionLossOver5: 'no', builtUpOrSpliced: 'no', fatigueLoading: 'no', withinTolerances: 'yes' }, samplesTested: 1, certificate: { ref: 'BT-2231', lab: 'Brindmoor Testing', issuedOn: '2026-09-01', grade: 'S355' } },
      }),
    })
    expect(p).toEqual({ assurance: 'warranted', processing: 'cleaned', warranty: 'seller', steel: { provenance: 'P1', assessment: 'S3' }, hazards: ['lead_paint'] })
    expect(JSON.stringify(p)).not.toMatch(/BT-2231|Brindmoor|UB secondary|private note/)
  })

  it('reads an item with no record from its test status', () => {
    expect(publicQualityOf({ testStatus: 'inspected' })).toEqual({ assurance: 'inspected', processing: 'as_removed', warranty: 'none', steel: null, hazards: [] })
  })
})

describe('the tested-for-reuse label', () => {
  it('carries the public ID, the status and the tester, escaped', () => {
    const svg = reuseLabelSvg({ publicId: 'L-9F4CQQ', title: 'UB 457x191x67, 7.5 m', statusText: 'Tested', codes: 'P1, S3', tester: 'Brindmoor & Co', testedOnText: '1 September 2026', path: '/app/marketplace/L-9F4CQQ' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('L-9F4CQQ')
    expect(svg).toContain('Tested, P1, S3')
    expect(svg).toContain('Brindmoor &amp; Co')
    expect(svg).toContain('Tested for reuse')
  })

  it('shortens a long line on a word', () => {
    expect(fitLine('Unitised curtain wall panels, 1.5 m by 3.6 m, south elevation', 30)).toBe('Unitised curtain wall panels,...')
    expect(fitLine('Short', 30)).toBe('Short')
  })
})
