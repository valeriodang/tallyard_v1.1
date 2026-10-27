// The audit workbooks: their sheets, the totals carried as formulas with the engine's results, the City rows only
// for a City building, and no forbidden character.
import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { fresh, U, viewer } from '../../test/fixtures'
import { HARROWDEN_ID, TIVERNE_ID } from '../../domain/seed/world'
import { SEEDED_AUDIT_IDS } from '../../sandbox/seed-v3'
import { FORBIDDEN } from '../../ui/testing'
import { auditDetailView, type PreDemolitionView, type PreRedevelopmentView } from '../../store/selectors/audits'
import { buildAuditWorkbook } from './exportAudit'

async function read(buffer: ArrayBuffer) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  return wb
}

function sheetTexts(ws: ExcelJS.Worksheet): string[] {
  const out: string[] = []
  ws.eachRow((row) =>
    row.eachCell((c) => {
      if (typeof c.value === 'string') out.push(c.value)
    }),
  )
  return out
}

const texts = (wb: ExcelJS.Workbook) => wb.worksheets.flatMap(sheetTexts)

const result = (c: ExcelJS.Cell) => (c.value as ExcelJS.CellFormulaValue).result

describe('the pre-deconstruction workbook', () => {
  it('lists every line, totals mass, reusable mass and carbon as formulas, and the targets', async () => {
    const v = auditDetailView(fresh(), viewer(U.dana), TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneDeconstruction) as PreDemolitionView
    const wb = await read(await buildAuditWorkbook(v))
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Audit', 'Inventories', 'Targets', 'Hazards', 'Checklist', 'Assumptions'])
    const inv = wb.getWorksheet('Inventories')!
    expect(inv.getRow(1).getCell(1).value).toBe('Line')
    const totalRow = inv.getRow(v.rows.length + 2)
    expect(totalRow.getCell(1).value).toBe('Total')
    expect((totalRow.getCell(8).value as ExcelJS.CellFormulaValue).formula).toBe(`SUM(H2:H${v.rows.length + 1})`)
    expect(result(totalRow.getCell(8))).toBeCloseTo(v.totalsRaw.totalT, 6)
    expect(result(totalRow.getCell(14))).toBeCloseTo(v.totalsRaw.reusableT, 6)
    expect(result(totalRow.getCell(15))).toBeCloseTo(v.totalsRaw.avoidedT, 6)
    const targets = wb.getWorksheet('Targets')!
    expect(result(targets.getRow(2).getCell(2))).toBeCloseTo(v.totalsRaw.reuseByMass!, 6)
    expect(targets.getRow(3).getCell(3).value).toBe(0.97)
    expect(texts(wb).join('\n')).not.toMatch(FORBIDDEN)
    // Tiverne House is in the City: its rows are in the assumptions.
    expect(texts(wb).some((t) => t.includes('City of London'))).toBe(true)
  })

  it('leaves the City rows out for a building outside the City', async () => {
    const v = auditDetailView(fresh(), viewer(U.dana), HARROWDEN_ID, SEEDED_AUDIT_IDS.harrowdenDeconstruction) as PreDemolitionView
    const wb = await read(await buildAuditWorkbook(v))
    expect(sheetTexts(wb.getWorksheet('Assumptions')!).some((t) => t.includes('City of London'))).toBe(false)
  })
})

describe('the pre-redevelopment workbook', () => {
  it('holds the factors, the tree and the options with demolition added by formula', async () => {
    const v = auditDetailView(fresh(), viewer(U.tom), TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneRetention) as PreRedevelopmentView
    const wb = await read(await buildAuditWorkbook(v))
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Audit', 'Retention factors', 'Carbon options', 'Checklist', 'Assumptions'])
    const o = wb.getWorksheet('Carbon options')!
    const rebuild = o.getRow(4)
    expect(rebuild.getCell(1).value).toBe('New build, reclaiming the frame and facade')
    expect((rebuild.getCell(11).value as ExcelJS.CellFormulaValue).formula).toBe('G4+I4')
    expect(result(rebuild.getCell(11))).toBeCloseTo(v.options[2].metrics.wlcWithDemolitionKgM2!, 6)
    expect(result(rebuild.getCell(12))).toBeCloseTo(v.options[2].metrics.wlcT!, 6)
    expect(texts(wb)).toContain('Disassemble and reuse')
    expect(texts(wb).join('\n')).not.toMatch(FORBIDDEN)
  })
})
