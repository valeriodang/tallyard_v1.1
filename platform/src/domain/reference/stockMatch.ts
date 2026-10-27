// Design from stock (round 3, BRIEF section 15.6): the matcher's defaults. Sources: the literature review notes 01 and
// 05 (the UK steel reuse toolkit and a London circular economy report, which both give the 30% excess rule, and a
// London scheme's specification for incoming reclaimed steel, which takes lengths over 3 m).
import type { StockMatchSettings } from '../stockTypes'
import type { Parameter } from './assumptions'

/** A piece more than this share excess is better used elsewhere. */
export const EXCESS_SHARE = 0.3

/** Offcuts shorter than this are scrap: the specification quoted takes reclaimed lengths over 3 m only. */
export const MIN_OFFCUT_M = 3

export const MAX_SCHEDULE_LINES = 200

export const DEFAULT_STOCK_MATCH: StockMatchSettings = { cutToLength: false, minOffcutM: MIN_OFFCUT_M, excessRule: false, allowUnknownGrade: true, fileName: null, loadedOn: null }

export function stockMatchRows(): Parameter[] {
  const g = 'Design from stock'
  return [
    { id: 'stock.excess', group: g, label: 'Excess rule', value: '30', unit: '% of a piece by mass', source: 'Published: the UK steel reuse toolkit and a London circular economy report (2023), "if more than 30% of a member would be excess, use it elsewhere"', status: 'published' },
    { id: 'stock.minOffcut', group: g, label: 'Shortest offcut back to stock', value: '3.0', unit: 'm', source: "Indicative: a London scheme's specification for incoming reclaimed steel, lengths over 3 m and no more than 12 m", status: 'indicative' },
    { id: 'stock.cutting', group: g, label: 'Cutting one piece into several members', value: 'Off unless the architect turns it on', unit: '', source: 'Indicative: cutting near connections is common practice; the cut ends and any fabrication need the engineer to agree', status: 'indicative' },
  ]
}
