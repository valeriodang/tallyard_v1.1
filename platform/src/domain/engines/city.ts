// The City of London module (round 3, BRIEF section 15.7): the minimums every major application meets, condition
// bands, the statement updates at RIBA stages 4 and 6, and the independent reviewer of the carbon options.
import type { ConditionBand } from '../cesTypes'
import type { ProgrammeDates } from '../types'
import { CITY_CONDITION_BANDS, CITY_MINIMUMS, CITY_OPTIONEERING } from '../reference/cityOfLondon'
import { programmeStages } from './programme'
import { daysBetween } from '../dates'

export type MinimumRow = { id: 'catalogue' | 'schedule' | 'passports'; label: string; count: number; needed: number; met: boolean }

/** The SPD's three minimums against what the project holds. */
export function cityMinimums(catalogue: number, schedule: number, passports: number): MinimumRow[] {
  return [
    { id: 'catalogue', label: 'Reuse catalogue: key items the existing building offers for reuse', count: catalogue, needed: CITY_MINIMUMS.reuseCatalogueItems, met: catalogue >= CITY_MINIMUMS.reuseCatalogueItems },
    { id: 'schedule', label: 'Reuse schedule: reclaimed items the new building takes in', count: schedule, needed: CITY_MINIMUMS.reuseScheduleItems, met: schedule >= CITY_MINIMUMS.reuseScheduleItems },
    { id: 'passports', label: 'Material passports for carbon-intensive new materials', count: passports, needed: CITY_MINIMUMS.passportedNewMaterials, met: passports >= CITY_MINIMUMS.passportedNewMaterials },
  ]
}

export function bandOf(band: ConditionBand): { label: string; route: 'reuse' | 'repurpose' | 'recycle' } {
  const b = CITY_CONDITION_BANDS.find((x) => x.band === band)!
  return { label: b.label, route: b.route }
}

export type UpdateStatus = 'done' | 'upcoming' | 'due' | 'overdue'
export type UpdateRow = { stage: 4 | 6; from: string; to: string | null; doneOn: string | null; status: UpdateStatus }

/** The statement updates the City asks for, during RIBA stage 4 and stage 6, against the project's programme. */
export function cityUpdates(p: ProgrammeDates, updates: { stage4: string | null; stage6: string | null }, today: string): UpdateRow[] {
  const spans = programmeStages(p)
  return ([4, 6] as const).map((stage) => {
    const span = spans.find((s) => s.stage === stage)!
    const doneOn = stage === 4 ? updates.stage4 : updates.stage6
    let status: UpdateStatus = 'upcoming'
    if (doneOn) status = 'done'
    else if (span.end !== null && daysBetween(span.end, today) > 0) status = 'overdue'
    else if (daysBetween(span.start, today) >= 0) status = 'due'
    return { stage, from: span.start, to: span.end, doneOn, status }
  })
}

/** The advice note asks for an independent reviewer with at least three years' experience of whole life carbon. */
export function reviewerReady(r: { name: string; years: number | null }): boolean {
  return r.name.trim() !== '' && r.years !== null && r.years >= CITY_OPTIONEERING.reviewerMinYears
}
