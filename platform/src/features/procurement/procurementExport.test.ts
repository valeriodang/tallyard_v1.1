// The procurement pack exports: reopen the workbook and the Word document and read them, never bytes. They carry public
// listing facts and the project's own words, and none of any lot's private strings.
import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { fresh, U, viewer } from '../../test/fixtures'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { lotPrivateStrings } from '../../domain/privacy/privateStrings'
import { procurementView } from '../../store/selectors/procurement'
import { FORBIDDEN } from '../../ui/testing'
import type { AppData } from '../../store/types'
import { buildProcurementDocx, buildProcurementWorkbook, PROCUREMENT_SHEETS } from './procurementExport'

function privateStrings(s: AppData): string[] {
  const out = new Set<string>()
  for (const lot of Object.values(s.world.lots)) {
    const item = s.world.items[lot.itemId]
    for (const x of lotPrivateStrings(lot, item, s.world.buildings[item.buildingId], s.world)) out.add(x)
  }
  return [...out].filter((x) => x.length >= 4)
}

describe('the procurement pack exports', () => {
  it('writes a workbook with a sheet for each part', async () => {
    const s = fresh()
    const v = procurementView(s, viewer(U.isla), MERROWGATE_ID)!
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await buildProcurementWorkbook(v))
    expect(wb.worksheets.map((w) => w.name)).toEqual([...PROCUREMENT_SHEETS])
    const resp = wb.getWorksheet('Responsibilities')!
    expect(resp.getRow(1).getCell(3).value).toBe('Sourced by the contractor (chosen)')
    expect(resp.getRow(2).getCell(1).value).toBe('Who buys')
    const prices = wb.getWorksheet('Unit prices')!
    const texts: string[] = []
    wb.eachSheet((ws) => ws.eachRow((row) => row.eachCell((c) => texts.push(String(c.value ?? '')))))
    expect(prices.getRow(2).getCell(1).value).toBe('L-WPX5A6')
    expect(texts).toContain('£41,003 to £47,136')
    const joined = texts.join('\n')
    for (const p of privateStrings(s)) expect(joined, p).not.toContain(p)
    expect(joined).not.toMatch(FORBIDDEN)
  })

  it('writes a Word document with the objective, the route, the clauses and the prices', async () => {
    const s = fresh()
    const v = procurementView(s, viewer(U.isla), MERROWGATE_ID)!
    const zip = await JSZip.loadAsync(await buildProcurementDocx(v, '8 October 2026'))
    const doc = await zip.file('word/document.xml')!.async('string')
    const text = doc.replace(/<[^>]+>/g, ' ')
    for (const h of ['Reuse objective', 'Supply route', 'Clauses', 'Award criteria', 'Reclaimed and new unit prices', 'Market consultation annex']) expect(text).toContain(h)
    expect(text).toContain('The project aims to reuse at least 5% of its building materials by value.')
    expect(text).toContain('Review clause where reused supplies cannot be found')
    for (const p of privateStrings(s)) expect(text, p).not.toContain(p)
  })
})
