// The GLA template export: reopen the workbook and read it, never bytes. Each sheet follows the template's layout,
// totals are formulas with their results cached, and the workspace's own entries come through.
import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { actor, fresh, must, U, viewer } from '../../test/fixtures'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { cesTemplate } from '../../store/selectors/ces'
import { addLesson, answerExisting, saveJustification, saveWaste, setTargetRate } from '../../store/actions/ces'
import { FORBIDDEN } from '../../ui/testing'
import type { AppData } from '../../store/types'
import { buildGlaTemplate, GLA_SHEETS } from './glaTemplateExport'

const M = MERROWGATE_ID

async function open(s: AppData) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(await buildGlaTemplate(cesTemplate(s, viewer(U.marcus), M)!))
  return wb
}

function texts(wb: ExcelJS.Workbook): string {
  const out: string[] = []
  wb.eachSheet((ws) => ws.eachRow((row) => row.eachCell((c) => out.push(typeof c.value === 'object' && c.value !== null ? JSON.stringify(c.value) : String(c.value ?? '')))))
  return out.join('\n')
}

describe('the GLA template export', () => {
  it('writes the template sheets in order, with the project details', async () => {
    const s = fresh()
    const p = s.world.projects[M]
    const wb = await open(s)
    expect(wb.worksheets.map((w) => w.name)).toEqual([...GLA_SHEETS])
    const det = wb.getWorksheet('Project details')!
    const rows: Record<string, unknown> = {}
    det.eachRow((row) => (rows[String(row.getCell(1).value)] = row.getCell(2).value))
    expect(rows['Project name']).toBe(p.name)
    expect(rows['Applicant']).toBe('Lantern Quay Developments')
    expect(rows['Overall GIA (m2)']).toBe(String(p.giaM2))
    expect(rows['Stage']).toBe('Pre-application')
    expect(texts(wb)).not.toMatch(FORBIDDEN)
  })

  it('totals the bill of materials with SUM formulas whose results match the rows', async () => {
    const wb = await open(fresh())
    const bom = wb.getWorksheet('Bill of materials')!
    expect(bom.getRow(1).getCell(3).value).toBe('Material quantity (kg)')
    expect(bom.getRow(1).getCell(10).value).toBe('Replacements over 60 years')
    const rows = cesTemplate(fresh(), viewer(U.marcus), M)!.bom
    const overall = bom.getRow(rows.length + 2)
    expect(overall.getCell(1).value).toBe('Overall')
    const mass = overall.getCell(3).value as { formula: string; result: number }
    expect(mass.formula).toBe(`SUM(C2:C${rows.length + 1})`)
    expect(mass.result).toBeCloseTo(19_658_900, 0)
    const intensity = overall.getCell(4).value as { formula: string; result: number }
    expect(intensity.formula).toBe(`C${rows.length + 2}/${cesTemplate(fresh(), viewer(U.marcus), M)!.giaM2}`)
    expect(intensity.result).toBeCloseTo(1191.4, 1)
    // A family line names its material by the family's label, not its key.
    expect(texts(wb)).toContain('Structural steel section')
  })

  it('carries the decision tree, the waste routes with their totals, the aims and the lessons', async () => {
    let s = fresh()
    for (const [q, a] of [['hasBuilding', 'yes'], ['retainFeasible', 'yes'], ['suited', 'no'], ['residualValue', 'yes']] as const) s = must(answerExisting(s, actor(U.marcus), M, q, a)).state
    s = must(saveJustification(s, actor(U.marcus), M, 'The frame cannot take the added floors.')).state
    s = must(saveWaste(s, actor(U.marcus), M, 'demolition', { tonnes: 8250, routes: { reuseOnsite: 0.3, reuseOffsite: 0.05, recycleOffsite: 0.6, landfill: 0.05 }, source: 'Pre-demolition audit' })).state
    s = must(setTargetRate(s, actor(U.marcus), M, 'cd_recovery', 'aiming', 0.98)).state
    s = must(addLesson(s, actor(U.marcus), M, 'Testing came late', 'Book testing at strip-out.')).state
    const wb = await open(s)

    const app = wb.getWorksheet('Design approaches')!
    const appText: string[] = []
    app.eachRow((row) => appText.push(row.getCell(1).value + '|' + row.getCell(2).value))
    expect(appText).toContain('The preferred strategy is|Disassemble and reuse')
    expect(appText).toContain('Justification|The frame cannot take the added floors.')

    const ws = wb.getWorksheet('Recycling and waste')!
    let demolition: ExcelJS.Row | undefined
    ws.eachRow((row) => {
      if (String(row.getCell(1).value).startsWith('Demolition')) demolition = row
    })
    const n = demolition!.number
    expect(demolition!.getCell(3).value).toBe(8250)
    expect(demolition!.getCell(11).value).toEqual({ formula: `E${n}+F${n}`, result: 0.35 })
    expect((demolition!.getCell(13).value as { result: number }).result).toBeCloseTo(0.95, 9)
    expect(demolition!.getCell(14).value).toMatchObject({ formula: `SUM(E${n}:J${n})` })
    expect((demolition!.getCell(14).value as { result: number }).result).toBeCloseTo(1, 9)
    // The template repeats "Recycle offsite" for the onsite column; the export does not copy that slip.
    expect(ws.getRow(1).getCell(7).value).toBe('Recycle onsite (%)')

    const tg = wb.getWorksheet('Targets')!
    let aim: unknown
    tg.eachRow((row) => {
      if (String(row.getCell(1).value).startsWith('Construction and demolition waste')) aim = row.getCell(3).value
    })
    expect(aim).toBe(0.98)

    expect(texts(wb)).toContain('Testing came late')
    expect(texts(wb)).not.toMatch(FORBIDDEN)
  })
})
