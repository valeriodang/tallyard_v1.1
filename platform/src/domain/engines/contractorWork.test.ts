// The contractor's workspace arithmetic, against values worked by hand from the published method and the rates in
// reference/wasteCost.ts.
import { describe, expect, it } from 'vitest'
import type { AuditRow } from '../auditTypes'
import type { Carrier, DestinationEntry } from '../contractorTypes'
import { costStreams, destinationTotals, dutyOfCareGaps, forecastFromAudit, landfillTaxPerT, trueCostOfWaste } from './contractorWork'

const entry = (e: Partial<DestinationEntry> & { id: string; route: DestinationEntry['route'] }): DestinationEntry => ({
  description: e.id,
  ewcCode: '17 09 04',
  forecastT: null,
  actualT: null,
  carrierId: null,
  facility: '',
  permitRef: '',
  transferNoteRef: '',
  movedOn: null,
  auditRowId: null,
  note: '',
  ...e,
})

const row = (r: Partial<AuditRow> & { id: string }): AuditRow => ({ inventory: 'reuse', description: r.id, family: null, nrm: '2.1', ewcCode: '17 04 05', quantity: null, unit: '', massT: 1, extractability: null, quality: null, marketValue: null, reusableShare: null, cityBand: null, considerations: '', broker: { route: 'none', status: 'not_offered', outlet: '' }, itemId: null, ...r })

describe('the true cost of waste', () => {
  it('adds handling, haulage, the receiving fee and landfill tax per tonne, rounded to pence, then VAT', () => {
    const t = trueCostOfWaste([
      { route: 'landfill', ewcCode: '17 09 04', tonnes: 10 },
      { route: 'landfill', ewcCode: '17 01 01', tonnes: 4 },
      { route: 'recycled_off_site', ewcCode: '17 04 05', tonnes: 2.5 },
      { route: 'reused_off_site', ewcCode: '17 04 05', tonnes: 20 },
    ])
    expect(t.lines.map((l) => l.route)).toEqual(['reused_off_site', 'recycled_off_site', 'landfill'])
    // Reuse off site: 20 t at 45 handling and 12 haulage, no fee.
    expect(t.lines[0]).toMatchObject({ tonnes: 20, handling: 900, haulage: 240, gateFee: 0, landfillTax: 0, total: 1140 })
    // Recycling: 2.5 t at 45, 12 and a 20 fee.
    expect(t.lines[1]).toMatchObject({ handling: 112.5, haulage: 30, gateFee: 50, landfillTax: 0, total: 192.5 })
    // Landfill: 10 t mixed at the standard rate of 126.15 and 4 t of concrete at the lower rate of 4.05.
    expect(t.lines[2]).toMatchObject({ tonnes: 14, handling: 630, haulage: 210, gateFee: 420, landfillTax: 1277.7, total: 2537.7 })
    expect(t.totalExVat).toBe(3870.2)
    expect(t.vat).toBe(774.04)
    expect(t.totalIncVat).toBe(4644.24)
    // 3,870.20 over 36.5 t.
    expect(t.perTonne).toBe(106.03)
    // The reused 20 t would have paid the 30 landfill fee and the 126.15 standard tax.
    expect(t.landfillAvoidedByReuse).toBe(3123)
  })

  it('taxes only landfill, at the lower rate for inert codes', () => {
    expect(landfillTaxPerT('recycled_off_site', '17 09 04')).toBe(0)
    expect(landfillTaxPerT('landfill', '17 01 02')).toBe(4.05)
    expect(landfillTaxPerT('landfill', '17 02 01')).toBe(126.15)
  })

  it('costs nothing with no tonnes, and has no figure per tonne', () => {
    const t = trueCostOfWaste([{ route: 'landfill', ewcCode: '17 09 04', tonnes: 0 }])
    expect(t).toMatchObject({ lines: [], totalExVat: 0, vat: 0, totalIncVat: 0, perTonne: null })
  })

  it('costs the forecast, or the weighed actuals', () => {
    const es = [entry({ id: 'a', route: 'landfill', forecastT: 5, actualT: 6 }), entry({ id: 'b', route: 'landfill', forecastT: 3 })]
    expect(costStreams(es, 'forecast').map((s) => s.tonnes)).toEqual([5, 3])
    expect(costStreams(es, 'actual').map((s) => s.tonnes)).toEqual([6, 0])
  })
})

describe('forecast against actual', () => {
  it('shares reuse and recovery over the non-hazardous tonnes', () => {
    const t = destinationTotals([
      entry({ id: 'a', route: 'reused_off_site', forecastT: 20, actualT: 18 }),
      entry({ id: 'b', route: 'recycled_off_site', forecastT: 50, actualT: 55 }),
      entry({ id: 'c', route: 'landfill', forecastT: 5 }),
      entry({ id: 'd', route: 'hazardous_disposal', forecastT: 2, actualT: 2 }),
    ])
    expect([t.forecastT, t.actualT, t.hazardousForecastT, t.hazardousActualT]).toEqual([75, 73, 2, 2])
    expect(t.forecastReuse).toBeCloseTo(20 / 75, 10)
    expect(t.actualReuse).toBeCloseTo(18 / 73, 10)
    expect(t.forecastRecovery).toBeCloseTo(70 / 75, 10)
    expect(t.actualRecovery).toBe(1)
    expect([t.moved, t.open]).toEqual([3, 1])
  })

  it('has no shares with nothing logged', () => {
    const t = destinationTotals([])
    expect([t.forecastReuse, t.actualRecovery]).toEqual([null, null])
  })
})

describe('the duty of care papers', () => {
  const carriers: Carrier[] = [
    { id: 'c1', name: 'Haulier A', registration: 'CBDU123456', tier: 'upper', expiresOn: '2027-01-01' },
    { id: 'c2', name: 'Haulier B', registration: ' ', tier: 'lower', expiresOn: '2026-01-01' },
  ]

  it('lists every gap on a moved stream of waste', () => {
    expect(dutyOfCareGaps(entry({ id: 'a', route: 'landfill', actualT: 5, carrierId: 'c2', movedOn: '2026-03-01' }), carriers)).toEqual(['carrier_registration', 'carrier_expired', 'carrier_tier', 'facility', 'permit', 'transfer_note'])
    expect(dutyOfCareGaps(entry({ id: 'b', route: 'recycled_off_site', actualT: 5 }), carriers)).toEqual(['carrier', 'facility', 'permit', 'transfer_note'])
  })

  it('finds nothing missing on complete papers, on reuse, or before the stream moves', () => {
    expect(dutyOfCareGaps(entry({ id: 'a', route: 'landfill', actualT: 5, carrierId: 'c1', movedOn: '2026-12-31', facility: 'Landfill, Essex', permitRef: 'EPR/AB1234CD', transferNoteRef: 'WTN-0042' }), carriers)).toEqual([])
    expect(dutyOfCareGaps(entry({ id: 'b', route: 'reused_off_site', actualT: 5 }), carriers)).toEqual([])
    expect(dutyOfCareGaps(entry({ id: 'c', route: 'landfill', forecastT: 5 }), carriers)).toEqual([])
  })
})

describe('the forecast from the audit', () => {
  it('splits reuse lines by their reusable share and routes waste by its code', () => {
    const out = forecastFromAudit(
      [
        row({ id: 'r1', massT: 10, reusableShare: 0.7, broker: { route: 'reuse_on_site', status: 'agreed', outlet: '' } }),
        row({ id: 'r2', massT: 4, reusableShare: 1, broker: { route: 'marketplace', status: 'offered', outlet: '' } }),
        row({ id: 'r3', inventory: 'recycle', massT: 5 }),
        row({ id: 'r4', inventory: 'waste', massT: 1.8, ewcCode: '17 06 05' }),
        row({ id: 'r5', inventory: 'waste', massT: 46, ewcCode: '17 09 04' }),
        row({ id: 'r6', inventory: 'recycle', massT: null }),
      ],
      (r, part) => `${r.id}_${part}`,
    )
    expect(out.map((e) => [e.id, e.route])).toEqual([
      ['r1_main', 'reused_on_site'],
      ['r1_rest', 'recycled_off_site'],
      ['r2_main', 'reused_off_site'],
      ['r3_main', 'recycled_off_site'],
      ['r4_main', 'hazardous_disposal'],
      ['r5_main', 'landfill'],
    ])
    expect(out[0].forecastT).toBeCloseTo(7, 10)
    expect(out[1].forecastT).toBeCloseTo(3, 10)
    expect(out[1].description).toBe('r1, not reusable')
    expect(out.every((e) => e.actualT === null && e.auditRowId !== null)).toBe(true)
  })
})
