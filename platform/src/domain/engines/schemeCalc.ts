// The certification calculators of round 3 (BRIEF section 15.7): LEED v5 interiors MRc1 and MRc5, BREEAM Wst 01 from
// the statement's waste estimates, and the WELL X01 to X03 screen of reclaimed items. Rule-based and indicative: they
// prepare inputs for an assessor, never an assessment.
import type { EraBand, FamilyId } from '../types'
import type { HazardId } from '../auditTypes'
import type { WasteEstimate } from '../cesTypes'
import {
  BREEAM_WST01_BANDS,
  BREEAM_WST01_DIVERSION,
  LEED_DIVERSION_PATHS,
  LEED_FURNITURE_REUSE_POINTS,
  LEED_MRC1_MAX,
  LEED_MRC5_MAX,
  LEED_OFFSITE_REUSE_RUNGS,
  LEED_ONSITE_REUSE_POINTS,
  LEED_OTHER_TYPES,
  LEED_SALVAGE_WEIGHT,
  LEED_TARGETED_DIVERSION_SHARE,
  LEED_TARGETED_TYPES,
  LEED_UNVERIFIED_MIXED_CAP,
  WELL_LEAD_PAINT_LIMIT_PPM,
  WELL_LIMITS,
  WELL_X01_FAMILIES,
  WELL_X03_FAMILIES,
  type LeedMaterialType,
} from '../reference/schemes'
import { hazardApplies } from '../reference/grading'

/** Shares typed as whole percentages arrive as exact fractions; this absorbs a division's last-digit drift. */
const EPS = 1e-9

function pointsFor(share: number | null, table: { atLeast: number; points: number }[]): number {
  if (share === null) return 0
  return table.reduce((best, r) => (share + EPS >= r.atLeast ? Math.max(best, r.points) : best), 0)
}

function shareOf(part: number | null, whole: number | null): number | null {
  return part !== null && whole !== null && whole > 0 ? Math.min(1, part / whole) : null
}

// ---------- LEED v5 MRc1, interior materials reuse ----------

export type Mrc1Input = {
  onsiteReused: number | null
  onsiteTotal: number | null
  furnitureReused: number | null
  furnitureTotal: number | null
  offsite: Partial<Record<LeedMaterialType, number>>
}

export type Mrc1Result = {
  onsiteShare: number | null
  onsitePoints: number
  furnitureShare: number | null
  furniturePoints: number
  /** Option 1 takes the better of its two paths. */
  option1: number
  option2: number
  points: number
}

/** Option 2: the best rung whose alternative the shares meet. The guide's weighted-average route is not computed. */
export function offsitePoints(shares: Partial<Record<LeedMaterialType, number>>): number {
  const targeted = LEED_TARGETED_TYPES.map((t) => shares[t] ?? 0)
  const other = LEED_OTHER_TYPES.map((t) => shares[t] ?? 0)
  const count = (xs: number[], at: number) => xs.filter((x) => x > 0 && x + EPS >= at).length
  let best = 0
  for (const rung of LEED_OFFSITE_REUSE_RUNGS)
    for (const alt of rung.alternatives) {
      const meets = (alt.targetedCount === 0 || count(targeted, alt.targetedAt) >= alt.targetedCount) && (alt.otherCount === 0 || count(other, alt.otherAt) >= alt.otherCount)
      if (meets) best = Math.max(best, rung.points)
    }
  return best
}

export function leedMrc1(i: Mrc1Input): Mrc1Result {
  const onsiteShare = shareOf(i.onsiteReused, i.onsiteTotal)
  const furnitureShare = shareOf(i.furnitureReused, i.furnitureTotal)
  const onsitePoints = pointsFor(onsiteShare, LEED_ONSITE_REUSE_POINTS)
  const furniturePoints = pointsFor(furnitureShare, LEED_FURNITURE_REUSE_POINTS)
  const option1 = Math.max(onsitePoints, furniturePoints)
  const option2 = offsitePoints(i.offsite)
  return { onsiteShare, onsitePoints, furnitureShare, furniturePoints, option1, option2, points: Math.min(LEED_MRC1_MAX, option1 + option2) }
}

// ---------- LEED v5 MRc5, construction and demolition waste diversion ----------

export type Mrc5Input = {
  /** The demolition and construction estimates; excavation and municipal waste are outside the credit. */
  streams: WasteEstimate[]
  separatedShare: number | null
  mixedRate: number | null
  targetedT: number | null
}

export type Mrc5Result = {
  /** All the waste counted, less reuse on site, which belongs to MRc1. */
  totalT: number
  onsiteExcludedT: number
  salvagedT: number
  separatedT: number
  mixedT: number
  mixedRate: number
  mixedVerified: boolean
  /** The diversion rate with salvage counted twice, capped at 100%. */
  rate: number | null
  /** Salvaged and source-separated tonnes as a share of the tonnes diverted. */
  separatedShareOfDiverted: number | null
  pathPoints: number
  targetedShare: number | null
  targetedPoint: number
  points: number
}

export function leedMrc5(i: Mrc5Input): Mrc5Result {
  let all = 0
  let onsite = 0
  let salvaged = 0
  let recycled = 0
  for (const s of i.streams) {
    if (s.tonnes === null) continue
    all += s.tonnes
    onsite += s.tonnes * s.routes.reuseOnsite
    salvaged += s.tonnes * s.routes.reuseOffsite
    recycled += s.tonnes * (s.routes.recycleOnsite + s.routes.recycleOffsite)
  }
  const totalT = all - onsite
  const separatedT = recycled * (i.separatedShare ?? 0)
  const mixedT = recycled - separatedT
  const mixedVerified = i.mixedRate !== null
  const mixedRate = i.mixedRate ?? LEED_UNVERIFIED_MIXED_CAP
  const divertedT = salvaged + separatedT + mixedT * mixedRate
  const creditT = salvaged * LEED_SALVAGE_WEIGHT + separatedT + mixedT * mixedRate
  const rate = totalT > 0 ? Math.min(1, creditT / totalT) : null
  const separatedShareOfDiverted = divertedT > 0 ? (salvaged + separatedT) / divertedT : null
  let pathPoints = 0
  if (rate !== null && separatedShareOfDiverted !== null)
    for (const p of LEED_DIVERSION_PATHS) if (rate + EPS >= p.divertedAtLeast && separatedShareOfDiverted + EPS >= p.salvagedShareAtLeast) pathPoints = Math.max(pathPoints, p.points)
  const targetedShare = i.targetedT !== null && totalT > 0 ? i.targetedT / totalT : null
  // Path 4 asks for more than 10%, not at least.
  const targetedPoint = targetedShare !== null && targetedShare > LEED_TARGETED_DIVERSION_SHARE ? 1 : 0
  return { totalT, onsiteExcludedT: onsite, salvagedT: salvaged, separatedT, mixedT, mixedRate, mixedVerified, rate, separatedShareOfDiverted, pathPoints, targetedShare, targetedPoint, points: Math.min(LEED_MRC5_MAX, pathPoints + targetedPoint) }
}

// ---------- BREEAM Wst 01, construction waste management ----------

export type Wst01Result = {
  /** Construction waste in tonnes per m2 GIA; null without an estimate. */
  tPerM2: number | null
  /** The best band the figure reaches, as its credits label; null when it reaches none. */
  credits: string | null
  /** The next band up and the figure it needs. */
  next: { credits: string; atMost: number } | null
  constructionDiverted: number | null
  constructionMet: boolean | null
  demolitionDiverted: number | null
  demolitionMet: boolean | null
}

/** Diverted from landfill: every route but landfill. */
function diverted(e: WasteEstimate | undefined): number | null {
  if (!e || e.tonnes === null) return null
  const r = e.routes
  return r.reuseOnsite + r.reuseOffsite + r.recycleOnsite + r.recycleOffsite + r.other
}

export function breeamWst01(construction: WasteEstimate | undefined, demolition: WasteEstimate | undefined, giaM2: number): Wst01Result {
  const tPerM2 = construction && construction.tonnes !== null && giaM2 > 0 ? construction.tonnes / giaM2 : null
  let reached = -1
  if (tPerM2 !== null) BREEAM_WST01_BANDS.forEach((b, i) => (tPerM2 <= b.atMost + EPS ? (reached = i) : null))
  const nextBand = tPerM2 === null ? null : (BREEAM_WST01_BANDS[reached + 1] ?? null)
  const c = diverted(construction)
  const d = diverted(demolition)
  return {
    tPerM2,
    credits: reached >= 0 ? BREEAM_WST01_BANDS[reached].credits : null,
    next: nextBand ? { credits: nextBand.credits, atMost: nextBand.atMost } : null,
    constructionDiverted: c,
    constructionMet: c === null ? null : c + EPS >= BREEAM_WST01_DIVERSION.construction,
    demolitionDiverted: d,
    demolitionMet: d === null ? null : d + EPS >= BREEAM_WST01_DIVERSION.demolition,
  }
}

// ---------- WELL v2 X01 to X03, reclaimed items ----------

export type WellItem = { publicId: string; description: string; family: FamilyId; eraBand: EraBand | null; hazards: HazardId[] }

export type WellCheck = { feature: 'X01' | 'X02' | 'X03'; status: 'confirmed' | 'check'; text: string }

export type WellRow = { publicId: string; description: string; checks: WellCheck[] }

/** What each reclaimed item asks of WELL's hazardous materials features, from its family, era and confirmed hazards. */
export function wellScreen(items: WellItem[]): WellRow[] {
  return items.map((it) => {
    const checks: WellCheck[] = []
    const has = (h: HazardId) => it.hazards.includes(h)
    const oldOrUnknown = it.eraBand !== '1970 or later'
    const category = WELL_X01_FAMILIES[it.family]
    if (has('asbestos')) checks.push({ feature: 'X01', status: 'confirmed', text: 'Asbestos is confirmed and not cleared: the item cannot be installed as it is.' })
    else if (has('tar_adhesive')) checks.push({ feature: 'X01', status: 'confirmed', text: 'Tar adhesive is confirmed and may hold asbestos: remove it before installation.' })
    else if (category) checks.push({ feature: 'X01', status: 'check', text: `${category} are an X01 category: show asbestos at no more than ${WELL_LIMITS.asbestosPpmNewProducts.toLocaleString('en-GB')} ppm, by test or declaration.` })
    if (has('lead_paint') || has('red_lead')) checks.push({ feature: 'X01', status: 'confirmed', text: `Lead in the coating is confirmed: strip it, or seal it and refinish with paint of no more than ${WELL_LEAD_PAINT_LIMIT_PPM} ppm lead.` })
    else if (hazardApplies('lead_paint', it.family) || hazardApplies('red_lead', it.family))
      checks.push({ feature: 'X01', status: 'check', text: oldOrUnknown ? 'Built before 1970 or of unknown age: test any coating for lead before it is left as a finish.' : 'Coatings from before about 1990 may hold lead: test any coating before it is left as a finish.' })
    if (has('pcb')) checks.push({ feature: 'X02', status: 'confirmed', text: 'PCBs are confirmed in the sealants: replace them before installation.' })
    else if (hazardApplies('pcb', it.family) && oldOrUnknown) checks.push({ feature: 'X02', status: 'check', text: `Sealants made before ${WELL_LIMITS.pcbBeforeYear} may hold PCBs: check them before installation.` })
    if (has('cca_timber')) checks.push({ feature: 'X03', status: 'confirmed', text: 'Chromated copper arsenate is confirmed: do not reuse the timber outdoors; dispose of it without burning or chipping.' })
    else if (WELL_X03_FAMILIES.includes(it.family)) checks.push({ feature: 'X03', status: 'check', text: 'Timber from an outdoor use may hold chromated copper arsenate: check purchase records or test for arsenic.' })
    return { publicId: it.publicId, description: it.description, checks }
  })
}
