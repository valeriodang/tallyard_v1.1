// F7. Schedule matching for steel. Reads nothing but public projections.
import type { Allocation, MatchResult, PublicListing, Requirement, RequirementResult, SteelGrade } from '../types'
import { sectionOrThrow } from '../reference/sections'
import type { Assumptions } from '../reference/assumptions'
import { daysBetween, maxDate, monthsCeil, isOnOrBefore } from '../dates'
import { steelMassT } from './measures'
import { steelAllocationCarbon } from './carbon'

export const MATCH_REASONS = {
  serial: 'No stock in this serial size',
  heavy: 'No stock heavy enough',
  long: (x: number) => `No stock long enough (longest visible in this serial size is ${x.toFixed(1)} m)`,
  grade: 'No stock of the required grade',
  time: 'No stock available in time',
  excess: (share: number) => `All stock in time would be more than ${Math.round(share * 100)}% excess`,
  stock: 'Not enough eligible stock',
} as const

const GRADE_RANK: Record<SteelGrade, number> = { S355: 2, S275: 1, unknown: 0 }

type Stock = { listing: PublicListing; designation: string; type: string; serial: string; massKgM: number; lengthM: number; grade: SteelGrade; remaining: number; fromOffcut: boolean }

const EPS = 1e-9

function naturalRef(a: string, b: string): number {
  return a.localeCompare(b, 'en-GB', { numeric: true })
}

export function storageRange(listing: PublicListing, needBy: string, demoDate: string): { min: number; max: number } {
  const av = listing.availability
  if (av.kind === 'now') {
    const m = monthsCeil(daysBetween(demoDate, needBy))
    return { min: m, max: m }
  }
  return {
    min: monthsCeil(daysBetween(maxDate(av.windowEnd, demoDate), needBy)),
    max: monthsCeil(daysBetween(maxDate(av.windowStart, demoDate), needBy)),
  }
}

function availableInTime(listing: PublicListing, needBy: string): boolean {
  const av = listing.availability
  return av.kind === 'now' || isOnOrBefore(av.windowEnd, needBy)
}

function availabilityStart(listing: PublicListing): string {
  return listing.availability.kind === 'now' ? '0000-01-01' : listing.availability.windowStart
}

export type MatchOptions = {
  allowUnknownGrade?: boolean
  secured?: Record<string, number>
  /**
   * Round 3: one stock piece may be cut into several members, the rest left as an offcut. Off by default, when one
   * piece serves one member and is not cut into several (03 section F7).
   */
  cutToLength?: boolean
  /** Round 3, with cutToLength: offcuts at least this long go back to stock and can serve shorter lines; the rest is scrap. */
  minOffcutM?: number
  /** Round 3: stock is passed over when more than this share of a piece's mass would be excess (the 30% rule). Off by default. */
  maxExcessShare?: number
}

export function matchSchedule(requirements: Requirement[], listings: PublicListing[], demoDate: string, a: Assumptions, options: MatchOptions = {}): MatchResult {
  const allowUnknown = options.allowUnknownGrade ?? true
  const secured = options.secured ?? {}
  const cut = options.cutToLength ?? false
  const minOffcut = options.minOffcutM ?? Number.POSITIVE_INFINITY
  const maxExcess = options.maxExcessShare
  const r3 = cut || maxExcess !== undefined
  const stock: Stock[] = listings
    .filter((l) => l.family === 'steel_section' && l.status === 'Available' && l.spec.family === 'steel_section' && (l.quantity.pieces ?? 0) > 0)
    .map((l) => {
      const spec = l.spec as { designation: string; lengthM: number }
      const s = sectionOrThrow(spec.designation)
      return { listing: l, designation: s.designation, type: s.type, serial: s.serial, massKgM: s.massKgM, lengthM: spec.lengthM, grade: l.grade ?? 'unknown', remaining: l.quantity.pieces ?? 0, fromOffcut: false }
    })

  const reqs = requirements.map((r) => {
    const s = sectionOrThrow(r.designation)
    const need = Math.max(0, r.count - (secured[r.ref] ?? 0))
    return { r, type: s.type, serial: s.serial, massKgM: s.massKgM, need }
  })
  const order = [...reqs].sort((x, y) => y.r.lengthM - x.r.lengthM || y.massKgM - x.massKgM || naturalRef(x.r.ref, y.r.ref))

  const results = new Map<string, RequirementResult>()
  let baselineMassT = 0
  let stockMassT = 0
  let offcutMassT = 0
  // With cutting: the mass of stock the members use, at the stock section.
  let usedMassT = 0

  for (const q of order) {
    const needBy = q.r.needBy
    /** Members one piece serves: one, or as many as fit when cutting is allowed. */
    const perPiece = (s: Stock) => (cut ? Math.max(1, Math.floor(s.lengthM / q.r.lengthM + EPS)) : 1)
    const leftover = (s: Stock, members = perPiece(s)) => s.lengthM - members * q.r.lengthM
    const excessOf = (s: Stock, members = perPiece(s)) => 1 - (members * q.r.lengthM * q.massKgM) / (s.lengthM * s.massKgM)
    const sameSerial = stock.filter((s) => s.type === q.type && s.serial === q.serial)
    const heavy = sameSerial.filter((s) => s.massKgM >= q.massKgM)
    const long = heavy.filter((s) => s.lengthM >= q.r.lengthM)
    const graded = long.filter((s) => (s.grade === 'unknown' ? allowUnknown : GRADE_RANK[s.grade] >= GRADE_RANK[q.r.minGrade]))
    const timely = graded.filter((s) => availableInTime(s.listing, needBy))
    const lean = maxExcess === undefined ? timely : timely.filter((s) => excessOf(s) <= maxExcess + EPS)
    const eligible = lean.filter((s) => s.remaining > 0)
    eligible.sort((x, y) => {
      // Offcuts already in stock go first, so they are used before a new piece is cut.
      if (cut && x.fromOffcut !== y.fromOffcut) return x.fromOffcut ? -1 : 1
      const ox = Math.round((x.massKgM - q.massKgM) * 10)
      const oy = Math.round((y.massKgM - q.massKgM) * 10)
      if (ox !== oy) return ox - oy
      const cx = Math.round(leftover(x) * 100)
      const cy = Math.round(leftover(y) * 100)
      if (cx !== cy) return cx - cy
      const ax = availabilityStart(x.listing)
      const ay = availabilityStart(y.listing)
      if (ax !== ay) return ax < ay ? -1 : 1
      return x.listing.publicId < y.listing.publicId ? -1 : x.listing.publicId > y.listing.publicId ? 1 : 0
    })
    const allocations: Allocation[] = []
    let remaining = q.need
    for (const s of eligible) {
      if (remaining <= 0) break
      const k = perPiece(s)
      const take = Math.min(remaining, s.remaining * k)
      if (take <= 0) continue
      remaining -= take
      const range = storageRange(s.listing, needBy, demoDate)
      const base = { publicId: s.listing.publicId, overSpecKgM: Math.round((s.massKgM - q.massKgM) * 10) / 10, gradeFlag: s.grade === 'unknown', storageMin: range.min, storageMax: range.max }
      if (!cut) {
        s.remaining -= take
        allocations.push({ ...base, pieces: take, offcutM: Math.round((s.lengthM - q.r.lengthM) * 100) / 100, ...(r3 ? { membersPerPiece: 1, fromOffcut: false, excessShare: excessOf(s, 1) } : {}) })
        baselineMassT += steelMassT(take, q.r.lengthM, q.massKgM)
        stockMassT += steelMassT(take, s.lengthM, s.massKgM)
        offcutMassT += steelMassT(take, s.lengthM - q.r.lengthM, s.massKgM)
        continue
      }
      // Whole pieces cut to k members each, then one piece for the members left over.
      const full = Math.floor(take / k)
      const groups = full > 0 ? [{ pieces: full, members: k }] : []
      if (take - full * k > 0) groups.push({ pieces: 1, members: take - full * k })
      for (const g of groups) {
        s.remaining -= g.pieces
        const left = leftover(s, g.members)
        allocations.push({ ...base, pieces: g.pieces, offcutM: Math.round(left * 100) / 100, membersPerPiece: g.members, fromOffcut: s.fromOffcut, excessShare: excessOf(s, g.members) })
        baselineMassT += steelMassT(g.pieces * g.members, q.r.lengthM, q.massKgM)
        if (!s.fromOffcut) stockMassT += steelMassT(g.pieces, s.lengthM, s.massKgM)
        usedMassT += steelMassT(g.pieces * g.members, q.r.lengthM, s.massKgM)
        if (left > EPS && left >= minOffcut - EPS) stock.push({ ...s, lengthM: left, remaining: g.pieces, fromOffcut: true })
      }
    }
    let reason: string | null = null
    if (remaining > 0) {
      if (sameSerial.length === 0) reason = MATCH_REASONS.serial
      else if (heavy.length === 0) reason = MATCH_REASONS.heavy
      else if (long.length === 0) reason = MATCH_REASONS.long(Math.max(...sameSerial.map((s) => s.lengthM)))
      else if (graded.length === 0) reason = MATCH_REASONS.grade
      else if (timely.length === 0) reason = MATCH_REASONS.time
      else if (lean.length === 0) reason = MATCH_REASONS.excess(maxExcess!)
      else reason = MATCH_REASONS.stock
    }
    results.set(q.r.ref, { ref: q.r.ref, required: q.need, matched: q.need - remaining, allocations, reason })
  }

  const ordered = [...reqs].sort((x, y) => naturalRef(x.r.ref, y.r.ref)).map((q) => results.get(q.r.ref)!)
  const members = reqs.reduce((s, q) => s + q.need, 0)
  const matched = ordered.reduce((s, r) => s + r.matched, 0)
  const avoided = matched > 0 ? steelAllocationCarbon(baselineMassT, stockMassT, a.listingKm, a).avoided : 0
  return {
    lines: requirements.length,
    members,
    matched,
    coverage: members > 0 ? matched / members : 0,
    openOnly: null,
    results: ordered,
    baselineMassT,
    stockMassT,
    offcutMassT: cut ? stockMassT - usedMassT : offcutMassT,
    avoidedT: avoided,
    ...(cut ? offcutSplit(stock, stockMassT - usedMassT) : {}),
  }
}

/** With cutting: offcuts left in stock at the end go back to stock; the rest of the offcut mass is scrap. */
function offcutSplit(stock: Stock[], offcutT: number): { offcutReturnT: number; offcutScrapT: number } {
  const offcutReturnT = stock.filter((s) => s.fromOffcut && s.remaining > 0).reduce((t, s) => t + steelMassT(s.remaining, s.lengthM, s.massKgM), 0)
  return { offcutReturnT, offcutScrapT: Math.max(0, offcutT - offcutReturnT) }
}

/** Mass of every required member at the required section and length. */
export function requiredMassT(requirements: Requirement[]): number {
  return requirements.reduce((s, r) => s + steelMassT(r.count, r.lengthM, sectionOrThrow(r.designation).massKgM), 0)
}
