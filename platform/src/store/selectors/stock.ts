// Design from stock (round 3, BRIEF section 15.6): the architect's steel schedule matched against the stock the
// project can see, with the cut, offcut and excess options, and the steel in stock by serial size. Reads only public
// listings, so nothing of a seller's crosses. Architect only: the client and consultant see what lands on the shortlist.
import type { Availability, PublicListing, SteelGrade } from '../../domain/types'
import type { StockMatchSettings } from '../../domain/stockTypes'
import { DEFAULT_ASSUMPTIONS as A } from '../../domain/reference/assumptions'
import { EXCESS_SHARE, MAX_SCHEDULE_LINES } from '../../domain/reference/stockMatch'
import { sectionOrThrow } from '../../domain/reference/sections'
import { matchSchedule, requiredMassT } from '../../domain/engines/matcher'
import { lotsVisibleToProject } from '../../domain/visibility'
import * as f from '../../domain/format'
import { formatDate } from '../../domain/dates'
import type { AppData, Viewer } from '../types'
import { isProjectArchitect } from '../access'
import { isLotAvailable, listingOf } from '../lots'
import { materialHref } from '../paths'
import { stockMatchOf } from '../actions/stock'
import { todayOf } from './common'

export type StockAllocationRow = {
  publicId: string
  href: string
  piecesText: string
  overSpecText: string
  offcutText: string
  excessText: string | null
  /** More than the excess share would be left over: the rule would pass it over. */
  excessHigh: boolean
  gradeFlag: boolean
  fromOffcut: boolean
  storageText: string
}

export type StockLineRow = {
  ref: string
  designation: string
  lengthText: string
  gradeText: string
  required: number
  matched: number
  matchedText: string
  tone: 'brand' | 'warning' | 'danger'
  reason: string | null
  allocations: StockAllocationRow[]
}

export type StockRow = { publicId: string; href: string; designation: string; lengthText: string; pieces: number; gradeText: string; availabilityText: string }

export type StockSerialGroup = { serial: string; pieces: number; rows: StockRow[] }

export type StockMatchView = {
  settings: StockMatchSettings
  excessText: string
  schedule: { fileName: string; loadedText: string | null; lines: number; members: number; requiredMassText: string } | null
  maxLines: number
  summary: { matchedText: string; coverageText: string; stockMassText: string; baselineText: string; offcutText: string; returnText: string | null; scrapText: string | null; avoidedText: string } | null
  lines: StockLineRow[]
  /** Before the confidentiality terms, owner-shared lots are left out. */
  openOnly: boolean
  stock: StockSerialGroup[]
  stockPieces: number
}

const GRADE_TEXT: Record<SteelGrade, string> = { S355: 'S355', S275: 'S275', unknown: 'Grade not known' }

function availabilityText(av: Availability): string {
  return av.kind === 'now' ? 'Available now' : av.label
}

function storageText(min: number, max: number): string {
  if (max <= 0) return 'No storage'
  return min === max ? `Storage ${f.months(min)}` : `Storage ${min} to ${f.months(max)}`
}

function piecesText(pieces: number, members: number | undefined): string {
  const p = `${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`
  return members && members > 1 ? `${p}, ${members} members each` : p
}

/** Steel the project can see and could reserve now. */
function visibleSteel(state: AppData, projectId: string): PublicListing[] {
  const p = state.world.projects[projectId]
  return lotsVisibleToProject(state.world, p)
    .map((id) => state.world.lots[id])
    .filter((lot) => isLotAvailable(state, lot, projectId))
    .map((lot) => listingOf(state.world, lot))
    .filter((l) => l.family === 'steel_section' && l.spec.family === 'steel_section')
}

export function stockMatchView(state: AppData, viewer: Viewer, projectId: string): StockMatchView | null {
  const p = state.world.projects[projectId]
  if (!p || !isProjectArchitect(state, viewer.userId, projectId)) return null
  const settings = stockMatchOf(p)
  const listings = visibleSteel(state, projectId)
  const hasSchedule = p.requirements.length > 0
  const r = hasSchedule
    ? matchSchedule(p.requirements, listings, todayOf(viewer), A, { allowUnknownGrade: settings.allowUnknownGrade, cutToLength: settings.cutToLength, minOffcutM: settings.minOffcutM, maxExcessShare: settings.excessRule ? EXCESS_SHARE : undefined })
    : null
  const lines: StockLineRow[] = r
    ? r.results.map((res) => {
        const q = p.requirements.find((x) => x.ref === res.ref)!
        return {
          ref: res.ref,
          designation: q.designation,
          lengthText: `${f.number(q.lengthM, 2)} m`,
          gradeText: q.minGrade === 'unknown' ? 'Any grade' : `${q.minGrade} or better`,
          required: res.required,
          matched: res.matched,
          matchedText: `${res.matched} of ${res.required}`,
          tone: res.matched === res.required ? 'brand' : res.matched > 0 ? 'warning' : 'danger',
          reason: res.reason,
          allocations: res.allocations.map((a) => ({
            publicId: a.publicId,
            href: materialHref(a.publicId, projectId),
            piecesText: piecesText(a.pieces, a.membersPerPiece),
            overSpecText: a.overSpecKgM > 0 ? `${f.number(a.overSpecKgM, 1)} kg/m heavier` : 'Same section',
            offcutText: a.offcutM > 0 ? `${f.number(a.offcutM, 2)} m offcut` : 'No offcut',
            excessText: a.excessShare === undefined ? null : `${f.percent(a.excessShare)} excess`,
            excessHigh: (a.excessShare ?? 0) > EXCESS_SHARE,
            gradeFlag: a.gradeFlag,
            fromOffcut: a.fromOffcut ?? false,
            storageText: storageText(a.storageMin, a.storageMax),
          })),
        }
      })
    : []
  const bySerial = new Map<string, StockRow[]>()
  const pieces = new Map<string, number>()
  for (const l of [...listings].sort((x, y) => (x.publicId < y.publicId ? -1 : 1))) {
    const spec = l.spec as { designation: string; lengthM: number }
    const s = sectionOrThrow(spec.designation)
    const key = `${s.type} ${s.serial}`
    const n = l.quantity.pieces ?? 0
    bySerial.set(key, [...(bySerial.get(key) ?? []), { publicId: l.publicId, href: materialHref(l.publicId, projectId), designation: s.designation, lengthText: `${f.number(spec.lengthM, 1)} m`, pieces: n, gradeText: GRADE_TEXT[l.grade ?? 'unknown'], availabilityText: availabilityText(l.availability) }])
    pieces.set(key, (pieces.get(key) ?? 0) + n)
  }
  const stock = [...bySerial.entries()].sort((x, y) => x[0].localeCompare(y[0], 'en-GB', { numeric: true })).map(([serial, rows]) => ({ serial, pieces: pieces.get(serial)!, rows }))
  return {
    settings,
    excessText: f.percent(EXCESS_SHARE).replace('.0%', '%'),
    schedule: hasSchedule
      ? { fileName: settings.fileName ?? 'Steel schedule', loadedText: settings.loadedOn ? `Loaded ${formatDate(settings.loadedOn)}` : null, lines: p.requirements.length, members: p.requirements.reduce((t, x) => t + x.count, 0), requiredMassText: f.massT(requiredMassT(p.requirements)) }
      : null,
    maxLines: MAX_SCHEDULE_LINES,
    summary: r
      ? {
          matchedText: `${r.matched} of ${r.members}`,
          coverageText: f.percent(r.coverage),
          stockMassText: f.massT(r.stockMassT),
          baselineText: f.massT(r.baselineMassT),
          offcutText: f.massT(r.offcutMassT),
          returnText: r.offcutReturnT === undefined ? null : f.massT(r.offcutReturnT),
          scrapText: r.offcutScrapT === undefined ? null : f.massT(r.offcutScrapT),
          avoidedText: f.carbon(r.avoidedT),
        }
      : null,
    lines,
    openOnly: !p.termsAccepted,
    stock,
    stockPieces: [...pieces.values()].reduce((t, n) => t + n, 0),
  }
}
