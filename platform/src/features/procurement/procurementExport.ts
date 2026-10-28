// The client's procurement pack as a Word document and as a workbook. Built from the procurement view only, so it
// carries public listing facts and the project's own words. Nothing leaves the browser.
import type { ProcurementView } from '../../store/selectors/procurement'
import { docxParts, DOCX_MIME, type DocxInput } from '../../domain/engines/statementDocx'
import { caveat, header, newWorkbook, workbookBuffer } from '../compliance/exports'

export { DOCX_MIME }
export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const INDICATIVE = 'Guide prices are indicative, from public listings. Rates marked as placeholders in Help, Methodology are not market rates.'

/** The pack as the sections of a Word document. */
export function procurementDocxInput(v: ProcurementView, dateText: string): DocxInput {
  const route = v.routes.find((r) => r.value === v.route)!
  const included = v.clauses.filter((c) => c.included)
  return {
    title: `${v.projectName}: procurement pack for reuse`,
    subtitle: `Prepared ${dateText}`,
    sections: [
      { heading: 'Reuse objective', text: `${v.objective}\nTarget: ${v.targetText}.` },
      { heading: 'Supply route', text: [`${route.label}. ${route.text}`, route.when, ...v.matrix.map((m) => `- ${m.task}: ${m.values.find((x) => x.route === v.route)!.value}`)].join('\n') },
      { heading: 'Clauses', text: included.map((c) => `${c.title} (${c.stage.toLowerCase()}). ${c.text}`).join('\n') },
      { heading: 'Award criteria', text: [...v.award.criteria.map((c) => `- ${c.label}: ${c.weight} points`), v.award.reuseText].join('\n') },
      {
        heading: 'Reclaimed and new unit prices',
        text: v.prices.empty
          ? 'No materials are approved yet.'
          : [...v.prices.rows.map((r) => `- ${r.publicId}, ${r.title}, ${r.quantityText}: reclaimed ${r.reclaimedUnit}, new ${r.newUnit}`), `Estimated price range of the reclaimed supply: ${v.prices.reclaimedRange}. The same new: ${v.prices.newCost}.`, `Provisional sum for tests and losses: ${v.prices.provisional} (${v.prices.provisionalPercent}% of the guide total).`].join('\n'),
      },
      { heading: 'Market consultation annex', text: v.annex.length === 0 ? 'No materials are on the project yet.' : v.annex.map((a) => `- ${a.publicId}, ${a.title}: ${a.quantityText}, ${a.availability}, ${a.location}, ${a.condition}, ${a.testStatus}`).join('\n') },
    ],
    footer: `${v.caveat} ${INDICATIVE}`,
  }
}

export async function buildProcurementDocx(v: ProcurementView, dateText: string): Promise<ArrayBuffer> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const [path, xml] of Object.entries(docxParts(procurementDocxInput(v, dateText)))) zip.file(path, xml)
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE', mimeType: DOCX_MIME })
}

export const PROCUREMENT_SHEETS = ['Objective and route', 'Responsibilities', 'Clauses', 'Award criteria', 'Unit prices', 'Market annex'] as const

/** The pack as a workbook, one sheet per part. */
export async function buildProcurementWorkbook(v: ProcurementView): Promise<ArrayBuffer> {
  const wb = await newWorkbook(`${v.projectName} procurement pack`)
  const route = v.routes.find((r) => r.value === v.route)!

  const obj = wb.addWorksheet(PROCUREMENT_SHEETS[0])
  header(obj, ['Item', 'Value'], [28, 90])
  obj.addRow(['Objective', v.objective])
  obj.addRow(['Target', v.targetText])
  obj.addRow(['Supply route', `${route.label}. ${route.text}`])
  caveat(obj, v.caveat)

  const resp = wb.addWorksheet(PROCUREMENT_SHEETS[1])
  header(resp, ['Duty', ...v.routes.map((r) => (r.value === v.route ? `${r.label} (chosen)` : r.label))], [20, 32, 32, 32, 32])
  for (const m of v.matrix) resp.addRow([m.task, ...m.values.map((x) => x.value)])

  const cl = wb.addWorksheet(PROCUREMENT_SHEETS[2])
  header(cl, ['Clause', 'Stage', 'Included', 'Text'], [36, 14, 10, 100])
  for (const c of v.clauses) cl.addRow([c.title, c.stage, c.included ? 'Yes' : 'No', c.text])
  caveat(cl, v.caveat)

  const aw = wb.addWorksheet(PROCUREMENT_SHEETS[3])
  header(aw, ['Criterion', 'Weight', 'Reuse'], [48, 10, 10])
  for (const c of v.award.criteria) aw.addRow([c.label, c.weight, c.reuse ? 'Yes' : 'No'])
  aw.addRow(['Total', v.award.criteria.reduce((s, c) => s + c.weight, 0), ''])

  const pr = wb.addWorksheet(PROCUREMENT_SHEETS[4])
  header(pr, ['Public ID', 'Material', 'Quantity', 'Reclaimed unit price', 'New unit price', 'Reclaimed range', 'The same new'], [12, 36, 14, 26, 18, 24, 16])
  for (const r of v.prices.rows) pr.addRow([r.publicId, r.title, r.quantityText, r.reclaimedUnit, r.newUnit, r.reclaimedRange, r.newCost])
  pr.addRow(['Total', '', '', '', '', v.prices.reclaimedRange, v.prices.newCost])
  pr.addRow(['Provisional sum for tests and losses', '', '', '', '', v.prices.provisional, ''])
  caveat(pr, INDICATIVE)

  const an = wb.addWorksheet(PROCUREMENT_SHEETS[5])
  header(an, ['Public ID', 'Material', 'Quantity', 'Availability', 'Location', 'Condition', 'Test status', 'On the project'], [12, 36, 14, 30, 20, 12, 14, 20])
  for (const a of v.annex) an.addRow([a.publicId, a.title, a.quantityText, a.availability, a.location, a.condition, a.testStatus, a.status])

  return workbookBuffer(wb)
}
