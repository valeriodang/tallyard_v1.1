// The audit workbook. Every figure comes worked out from the audit view; the totals are formulas that carry the
// engine's results, so the file reads the same before a spreadsheet recalculates.
import type { AuditDetailView, PreDemolitionView, PreRedevelopmentView } from '../../store/selectors/audits'
import { assumptionsSheet, caveat, FMT, formula, header, newWorkbook, quote, workbookBuffer, type Workbook } from '../compliance/exports'

export async function buildAuditWorkbook(v: AuditDetailView): Promise<ArrayBuffer> {
  const wb = await newWorkbook(`${v.title}, ${v.buildingName}`)
  const summary = wb.addWorksheet('Audit')
  summary.columns = [{ width: 36 }, { width: 80 }]
  summary.addRow(['Building', v.buildingName])
  summary.addRow(['Audit', v.title])
  summary.addRow(['Status', v.completedText ? `${v.statusLabel}, ${v.completedText}` : v.statusLabel])
  summary.addRow(['Auditor', v.auditorName])
  summary.addRow(['Independence', v.independenceLabel])
  summary.addRow(['Peer reviewer', v.reviewerText])
  summary.addRow(['Surveyed on', v.surveyedOnText])
  summary.addRow(['Summary', v.summary]).getCell(2).alignment = { wrapText: true }
  summary.addRow(['Follows', v.source]).getCell(2).alignment = { wrapText: true }
  caveat(summary, v.caveat)
  if (v.kind === 'pre_redevelopment') preRedevelopmentSheets(wb, v)
  else preDemolitionSheets(wb, v)
  const checks = wb.addWorksheet('Checklist')
  header(checks, ['Check', 'Needed', 'Done', 'Detail'], [60, 10, 10, 60])
  for (const c of v.checklist) checks.addRow([c.label, c.required ? 'Yes' : 'No', c.ok ? 'Yes' : 'No', c.detail])
  assumptionsSheet(wb, v.caveat, { cityOfLondon: v.isCity })
  return workbookBuffer(wb)
}

function preRedevelopmentSheets(wb: Workbook, v: PreRedevelopmentView): void {
  const f = wb.addWorksheet('Retention factors')
  header(f, ['Factor', 'Question', 'Rating', 'Notes'], [28, 60, 32, 60])
  for (const x of v.factors) f.addRow([x.label, x.question, x.scaleLabel, x.note])
  f.addRow([])
  f.addRow(['GLA decision tree'])
  for (const q of v.tree) f.addRow([q.text, '', q.answer === 'yes' ? 'Yes' : q.answer === 'no' ? 'No' : 'Not answered'])
  f.addRow(['Design approach reached', '', v.outcomeLabel ?? 'Not reached yet'])

  const o = wb.addWorksheet('Carbon options')
  header(o, ['Option', 'Kind', 'Superstructure kept (by mass)', 'Facade kept (by area)', 'GIA (m2)', 'Upfront carbon A1 to A5 (kgCO2e per m2)', 'Whole life carbon A to C (kgCO2e per m2)', 'Demolished area (m2)', 'Demolition carbon (kgCO2e per m2)', 'Upfront with demolition (kgCO2e per m2)', 'Whole life with demolition (kgCO2e per m2)', 'Whole life carbon (tCO2e)', 'City retrofit test', 'Preferred', 'Notes'], [30, 24, 18, 18, 12, 20, 20, 16, 18, 20, 20, 18, 26, 10, 40])
  v.options.forEach((x, i) => {
    const r = i + 2
    const m = x.metrics
    const row = o.addRow([
      x.label,
      x.kindLabel,
      x.raw.superstructureRetainedShare,
      x.raw.facadeRetainedShare,
      x.raw.giaM2,
      x.raw.upfrontKgM2,
      x.raw.wlcKgM2,
      x.raw.demolishedAreaM2,
      m.demolitionKgM2,
      m.upfrontWithDemolitionKgM2 === null ? null : formula(`F${r}+I${r}`, m.upfrontWithDemolitionKgM2),
      m.wlcWithDemolitionKgM2 === null ? null : formula(`G${r}+I${r}`, m.wlcWithDemolitionKgM2),
      m.wlcT === null ? null : formula(`K${r}*E${r}/1000`, m.wlcT),
      x.retrofitText,
      x.isPreferred ? 'Yes' : '',
      x.demolitionIsDefault ? `${x.raw.note} Demolition at the default rate.`.trim() : x.raw.note,
    ])
    row.getCell(3).numFmt = FMT.percent2
    row.getCell(4).numFmt = FMT.percent2
    for (const c of [9, 10, 11]) row.getCell(c).numFmt = FMT.number
    row.getCell(12).numFmt = FMT.carbon2
  })
  caveat(o, v.demolitionDefaultText)
  o.addRow([v.retrofitRuleText])
  if (v.cityChecks.length > 0) {
    o.addRow([])
    o.addRow(['Preferred option against the City of London office benchmarks'])
    for (const c of v.cityChecks) o.addRow([c.label, c.valueText, c.limitText, c.within ? 'Within' : 'Above'])
  }
  if (v.justification) {
    o.addRow([])
    o.addRow(['Why this option', v.justification]).getCell(2).alignment = { wrapText: true }
  }
}

function preDemolitionSheets(wb: Workbook, v: PreDemolitionView): void {
  const INV = 'Inventories'
  const ws = wb.addWorksheet(INV)
  header(ws, ['Line', 'Inventory', 'Material', 'Element (NRM)', 'Waste code', 'Quantity', 'Unit', 'Mass (t)', 'Extractability (0 to 4)', 'Quality (0 to 4)', 'Market value (0 to 4)', 'Score (of 12)', 'Reusable share', 'Reusable mass (t)', 'Carbon avoided (tCO2e)', 'Condition band', 'Route', 'Status', 'Outlet', 'Considerations'], [40, 12, 22, 26, 12, 12, 12, 12, 14, 12, 14, 12, 14, 16, 16, 24, 20, 12, 24, 40])
  const first = 2
  v.rows.forEach((x, i) => {
    const r = first + i
    const raw = x.raw
    const scored = x.metrics.score !== null
    const row = ws.addRow([
      raw.description,
      x.inventoryLabel,
      x.familyLabel,
      x.nrmText,
      raw.ewcCode,
      raw.quantity,
      raw.unit,
      raw.massT,
      raw.extractability,
      raw.quality,
      raw.marketValue,
      scored ? formula(`I${r}+J${r}+K${r}`, (x.metrics.score ?? 0) * 12) : null,
      raw.reusableShare,
      x.metrics.reusableT === null ? null : formula(`H${r}*M${r}`, x.metrics.reusableT),
      x.metrics.avoidedT,
      raw.cityBand === null ? '' : x.bandText,
      x.routeLabel,
      x.statusLabel,
      raw.broker.outlet,
      raw.considerations,
    ])
    row.getCell(8).numFmt = FMT.mass2
    row.getCell(13).numFmt = FMT.percent2
    row.getCell(14).numFmt = FMT.mass2
    row.getCell(15).numFmt = FMT.carbon2
  })
  const last = first + Math.max(v.rows.length, 1) - 1
  const t = v.totalsRaw
  const total = ws.addRow(['Total', '', '', '', '', '', '', formula(`SUM(H${first}:H${last})`, t.totalT), '', '', '', '', '', formula(`SUM(N${first}:N${last})`, t.reusableT), formula(`SUM(O${first}:O${last})`, t.avoidedT)])
  total.font = { bold: true }
  total.getCell(8).numFmt = FMT.mass2
  total.getCell(14).numFmt = FMT.mass2
  total.getCell(15).numFmt = FMT.carbon2
  caveat(ws, 'Carbon avoided against buying new, modules A1 to A4, simplified method. Indicative.')

  const sum = wb.addWorksheet('Targets')
  sum.columns = [{ width: 48 }, { width: 18 }, { width: 18 }]
  sum.addRow(['Measure', 'Forecast', 'Target']).font = { bold: true }
  const inv = quote(INV)
  const totalRow = last + 1
  sum.addRow(['Reuse by mass', t.reuseByMass === null ? null : formula(`${inv}!N${totalRow}/${inv}!H${totalRow}`, t.reuseByMass), v.targets.reuseByMass]).eachCell((c, i) => {
    if (i > 1) c.numFmt = FMT.percent2
  })
  sum.addRow(['Reuse, recycling and recovery by weight', t.recoveryByWeight, v.targets.recoveryByWeight]).eachCell((c, i) => {
    if (i > 1) c.numFmt = FMT.percent2
  })
  sum.addRow([])
  sum.addRow([v.recoveryTargetText])
  sum.addRow([])
  sum.addRow(['Arisings by waste code', 'Mass (t)']).font = { bold: true }
  for (const a of t.arisings) sum.addRow([`${a.code}, ${a.label}`, a.massT]).getCell(2).numFmt = FMT.mass2

  const h = wb.addWorksheet('Hazards')
  header(h, ['Hazard', 'Suggested by age', 'Status', 'Basis', 'Notes', 'Source'], [50, 16, 16, 12, 40, 70])
  for (const x of v.hazards) h.addRow([x.label, x.suggested ? 'Yes' : 'No', x.statusLabel, v.hazardBasisOptions.find((o) => o.value === x.basis)?.label ?? '', x.note, x.source])
  h.addRow([])
  h.addRow(['Desk study'])
  h.addRow(['Drawings seen', v.deskStudy.drawingsSeen ? 'Yes' : 'No'])
  h.addRow(['Asbestos register', v.registerText])
  h.addRow(['History', v.deskStudy.history])
}
