// The circular economy statement in the GLA template's layout (round 3, BRIEF section 15.7): project details, design
// approaches, the bill of materials, recycling and waste reporting, targets, and the post-construction tables, with
// the assumptions. Totals are formulas with their results cached, so the file reads the same before Excel
// recalculates. The template's own slips (a repeated "Recycle offsite" heading, totals that skip rows) are not copied.
import type { CesTemplate } from '../../store/selectors/ces'
import { assumptionsSheet, caveat, FMT, formula, header, newWorkbook, workbookBuffer } from '../compliance/exports'

export const GLA_SHEETS = ['Project details', 'Design approaches', 'Bill of materials', 'Recycling and waste', 'Targets', 'Post-construction', 'Assumptions'] as const

const CAVEAT = 'Prepared in Tallyard for the GLA circular economy statement template. Figures are indicative until checked; material readings by NRM element are marked in Assumptions.'

const PCT = '0.0%'

function col(n: number): string {
  let s = ''
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s
  return s
}

export async function buildGlaTemplate(t: CesTemplate): Promise<ArrayBuffer> {
  const wb = await newWorkbook(`Circular economy statement, ${t.details[0][1]}`)

  const det = wb.addWorksheet(GLA_SHEETS[0])
  header(det, ['Project details', ''], [44, 80])
  for (const [k, v] of t.details) det.addRow([k, v])
  caveat(det, CAVEAT)

  const app = wb.addWorksheet(GLA_SHEETS[1])
  header(app, ['Circular economy design approaches for existing structures', 'Applicant response'], [70, 60])
  for (const q of t.existing) app.addRow([q.question, q.answer])
  app.addRow(['The preferred strategy is', t.strategy])
  app.addRow(['Justification', t.justification])
  app.addRow([])
  app.addRow(['Building layer', 'Design approaches', 'Strategic response']).font = { bold: true }
  for (const l of t.layers) app.addRow([l.layer, l.approaches, l.response]).alignment = { vertical: 'top', wrapText: true }

  const bom = wb.addWorksheet(GLA_SHEETS[2])
  const heads = [
    'Building element category',
    'Material type',
    'Material quantity (kg)',
    'Material intensity (kg/m2 GIA)',
    'Recycled content by mass (kg)',
    'Recycled content by value (%)',
    'Construction waste factor',
    'Construction waste (kg)',
    'Expected lifespan (years)',
    'Replacements over 60 years',
    'Repair and replacement quantities (kg)',
    'End-of-life scenario',
    'Reusing (%)',
    'Recycling (%)',
    'Landfill and other (%)',
    'Estimated reusable materials (kg)',
    'Estimated recyclable materials (kg)',
  ]
  header(bom, heads, [26, 26, 16, 16, 16, 14, 12, 16, 12, 12, 18, 18, 10, 10, 12, 18, 18])
  for (const b of t.bom) {
    const row = bom.addRow([b.element, b.material, b.massKg, b.intensity, b.recycledKg, b.recycledValueShare, b.wasteFactor, b.wasteKg, b.lifespan, b.replacements, b.replacementKg, b.scenario, b.reuse, b.recycle, b.landfill, b.reusableKg, b.recyclableKg])
    for (const c of [3, 4, 5, 8, 11, 16, 17]) row.getCell(c).numFmt = FMT.mass1
    for (const c of [6, 7, 13, 14, 15]) row.getCell(c).numFmt = PCT
  }
  if (t.bom.length > 0) {
    const first = 2
    const last = first + t.bom.length - 1
    const sumOf = (c: number, pick: (b: CesTemplate['bom'][number]) => number) => formula(`SUM(${col(c)}${first}:${col(c)}${last})`, t.bom.reduce((s, b) => s + pick(b), 0))
    const totalKg = t.bom.reduce((s, b) => s + b.massKg, 0)
    const overall = bom.addRow([
      'Overall',
      '',
      sumOf(3, (b) => b.massKg),
      formula(`${col(3)}${last + 1}/${t.giaM2}`, t.giaM2 > 0 ? totalKg / t.giaM2 : 0),
      sumOf(5, (b) => b.recycledKg),
      '',
      '',
      sumOf(8, (b) => b.wasteKg),
      '',
      '',
      sumOf(11, (b) => b.replacementKg),
      '',
      '',
      '',
      '',
      sumOf(16, (b) => b.reusableKg),
      sumOf(17, (b) => b.recyclableKg),
    ])
    overall.font = { bold: true }
    for (const c of [3, 4, 5, 8, 11, 16, 17]) overall.getCell(c).numFmt = FMT.mass1
  } else bom.addRow(['No bill of materials yet.'])
  caveat(bom, CAVEAT)

  const ws = wb.addWorksheet(GLA_SHEETS[3])
  header(
    ws,
    ['Type of waste', 'Source of information', 'Overall waste (tonnes)', 'Overall waste (t/m2 GIA)', 'Reuse onsite (%)', 'Reuse offsite (%)', 'Recycle onsite (%)', 'Recycle offsite (%)', 'To landfill (%)', 'To other management (%)', 'Total reuse (%)', 'Total recycle (%)', 'Total reuse and recycle (%)', 'Total waste reported (%)'],
    [26, 26, 14, 14, 12, 12, 12, 12, 12, 14, 12, 12, 14, 14],
  )
  t.waste.forEach((w, i) => {
    const n = i + 2
    const r = w.routes
    const row = ws.addRow([
      w.perYear ? `${w.type} (tonnes a year)` : w.type,
      w.source,
      w.tonnes,
      w.tonnes === null ? null : formula(`C${n}/${t.giaM2}`, t.giaM2 > 0 ? w.tonnes / t.giaM2 : 0),
      r.reuseOnsite,
      r.reuseOffsite,
      r.recycleOnsite,
      r.recycleOffsite,
      r.landfill,
      r.other,
      formula(`E${n}+F${n}`, r.reuseOnsite + r.reuseOffsite),
      formula(`G${n}+H${n}`, r.recycleOnsite + r.recycleOffsite),
      formula(`K${n}+L${n}`, r.reuseOnsite + r.reuseOffsite + r.recycleOnsite + r.recycleOffsite),
      formula(`SUM(E${n}:J${n})`, r.reuseOnsite + r.reuseOffsite + r.recycleOnsite + r.recycleOffsite + r.landfill + r.other),
    ])
    row.getCell(4).numFmt = '0.000'
    for (let c = 5; c <= 14; c++) row.getCell(c).numFmt = PCT
  })
  caveat(ws, 'Reuse means items used again as they are. Crushed concrete and hardcore used as fill are recycling.')

  const tg = wb.addWorksheet(GLA_SHEETS[4])
  header(tg, ['Circular economy target', 'Policy requirement', 'Aiming for (%)', 'Achieved (%)', 'Policy met?'], [56, 34, 14, 14, 12])
  for (const x of t.targets) {
    const row = tg.addRow([x.label, x.requirement, x.aiming, x.achieved, x.met])
    row.getCell(3).numFmt = PCT
    row.getCell(4).numFmt = PCT
  }

  const pc = wb.addWorksheet(GLA_SHEETS[5])
  header(pc, ['Key achievements: measure or target', 'Actions undertaken and explanation'], [48, 90])
  if (t.achievements.length === 0) pc.addRow(['None recorded yet.'])
  for (const a of t.achievements) pc.addRow([a.measure, a.action])
  pc.addRow([])
  pc.addRow(['Lessons learnt: description', 'Explanation, solution or future approach']).font = { bold: true }
  if (t.lessons.length === 0) pc.addRow(['None recorded yet.'])
  for (const l of t.lessons) pc.addRow([l.description, l.solution])

  assumptionsSheet(wb, CAVEAT, { cityOfLondon: t.cityOfLondon })
  return workbookBuffer(wb)
}
