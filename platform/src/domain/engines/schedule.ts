// The sample steel schedule CSV, read through the real CSV parser.
import Papa from 'papaparse'
import type { Requirement, SteelGrade } from '../types'
import { findSection } from '../reference/sections'

export function parseSchedule(csv: string, needBy: string): Requirement[] {
  const parsed = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true })
  const rows = parsed.data
  if (rows.length < 2) return []
  const out: Requirement[] = []
  for (const r of rows.slice(1)) {
    const [mark, section, lengthMm, qty, grade] = r
    const s = findSection(section ?? '')
    if (!s) throw new Error('Unknown section in schedule: ' + section)
    const g = (grade ?? '').trim().toUpperCase()
    out.push({ ref: (mark ?? '').trim(), designation: s.designation, lengthM: Number(lengthMm) / 1000, count: Number(qty), minGrade: (g === 'S355' || g === 'S275' ? g : 'unknown') as SteelGrade, needBy })
  }
  return out
}

export const SCHEDULE_ERRORS = {
  empty: 'The schedule has no member lines. It needs a header row, then mark, section, length in mm, quantity and grade.',
  section: (row: number, section: string) => `Line ${row}: ${section ? `"${section}" is not a section in the table` : 'the section is missing'}.`,
  length: (row: number) => `Line ${row}: give the length in millimetres, more than 0 and no more than 30,000.`,
  count: (row: number) => `Line ${row}: give the quantity as a whole number from 1 to 9,999.`,
  mark: (row: number) => `Line ${row}: give each line its own mark.`,
  tooMany: (max: number) => `The schedule has more than ${max} lines. Split it and load each part on its own project.`,
} as const

/**
 * Round 3: a schedule an architect uploads, checked line by line. Same columns as the sample; a bad line is named
 * rather than thrown, so the screen can say what to fix.
 */
export function readSchedule(csv: string, needBy: string, maxLines: number): { requirements: Requirement[]; error: null } | { requirements: null; error: string } {
  const rows = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true }).data
  if (rows.length < 2) return { requirements: null, error: SCHEDULE_ERRORS.empty }
  if (rows.length - 1 > maxLines) return { requirements: null, error: SCHEDULE_ERRORS.tooMany(maxLines) }
  const out: Requirement[] = []
  const marks = new Set<string>()
  for (const [i, r] of rows.slice(1).entries()) {
    const line = i + 2
    const [mark, section, lengthMm, qty, grade] = r.map((x) => (x ?? '').trim())
    const s = findSection(section ?? '')
    if (!s) return { requirements: null, error: SCHEDULE_ERRORS.section(line, section ?? '') }
    const mm = Number((lengthMm ?? '').replace(/,/g, ''))
    if (!Number.isFinite(mm) || mm <= 0 || mm > 30000) return { requirements: null, error: SCHEDULE_ERRORS.length(line) }
    const count = Number(qty)
    if (!Number.isInteger(count) || count < 1 || count > 9999) return { requirements: null, error: SCHEDULE_ERRORS.count(line) }
    const ref = (mark ?? '').slice(0, 20)
    if (!ref || marks.has(ref)) return { requirements: null, error: SCHEDULE_ERRORS.mark(line) }
    marks.add(ref)
    const g = (grade ?? '').toUpperCase()
    out.push({ ref, designation: s.designation, lengthM: mm / 1000, count, minGrade: (g === 'S355' || g === 'S275' ? g : 'unknown') as SteelGrade, needBy })
  }
  return { requirements: out, error: null }
}
