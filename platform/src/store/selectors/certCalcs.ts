// The certification calculators for the consultant (round 3, BRIEF section 15.7): LEED v5 interiors MRc1 and MRc5,
// BREEAM Wst 01 from the statement's waste estimates, and the WELL X01 to X03 screen of the project's reclaimed items.
// Inputs to an assessor's evidence, never an assessment.
import type { SchemeId } from '../../domain/reference/certification'
import { BREEAM_WST01_DIVERSION, LEED_FAMILY_TYPES, LEED_OTHER_TYPES, LEED_TARGETED_TYPES, LEED_TYPE_LABELS, LEED_UNVERIFIED_MIXED_CAP, type LeedMaterialType } from '../../domain/reference/schemes'
import { breeamWst01, leedMrc1, leedMrc5, wellScreen, type WellCheck } from '../../domain/engines/schemeCalc'
import * as f from '../../domain/format'
import type { AppData, Viewer } from '../types'
import { cesOf } from '../actions/ces'
import { projectMetrics } from './consultant'
import { pct, pctInput } from './ces'

const amount = (x: number | null) => (x === null ? '' : String(x))
const points = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`

export type LeedCalcView = {
  inputs: { onsiteReused: string; onsiteTotal: string; furnitureReused: string; furnitureTotal: string; separatedShare: string; mixedRate: string; targetedT: string }
  mrc1: { onsiteShareText: string; onsitePointsText: string; furnitureShareText: string; furniturePointsText: string; option2Text: string; pointsText: string; points: number }
  offsite: { type: LeedMaterialType; label: string; targeted: boolean; share: string; onProjectText: string | null }[]
  mrc5: {
    hasEstimates: boolean
    totalText: string
    salvagedText: string
    recycledText: string
    rateText: string
    separatedShareText: string
    mixedRateText: string
    targetedShareText: string
    pointsText: string
    points: number
  }
}

export type Wst01View = { hasEstimate: boolean; tPerM2Text: string; creditsText: string; nextText: string | null; diversion: { label: string; valueText: string; needText: string; met: boolean | null }[] }

export type WellView = { rows: { publicId: string; description: string; checks: (WellCheck & { label: string })[] }[]; confirmed: number; toCheck: number }

export type CertCalcs = { leed: LeedCalcView | null; breeam: Wst01View | null; well: WellView | null }

function leedView(state: AppData, viewer: Viewer, projectId: string): LeedCalcView {
  const r = cesOf(state, projectId)
  const i = r.leed
  const m1 = leedMrc1(i)
  const items = projectMetrics(state, viewer, projectId)!.items
  const streams = [r.waste.demolition, r.waste.construction].filter((x) => !!x && x.tonnes !== null) as NonNullable<typeof r.waste.demolition>[]
  const m5 = leedMrc5({ streams, separatedShare: i.separatedShare, mixedRate: i.mixedRate, targetedT: i.targetedT })
  const onProject = (t: LeedMaterialType) => {
    const n = items.filter((x) => LEED_FAMILY_TYPES[x.family] === t).length
    return n === 0 ? null : `${n} reclaimed ${n === 1 ? 'item' : 'items'} on the project`
  }
  return {
    inputs: {
      onsiteReused: amount(i.onsiteReused),
      onsiteTotal: amount(i.onsiteTotal),
      furnitureReused: amount(i.furnitureReused),
      furnitureTotal: amount(i.furnitureTotal),
      separatedShare: i.separatedShare === null ? '' : pctInput(i.separatedShare),
      mixedRate: i.mixedRate === null ? '' : pctInput(i.mixedRate),
      targetedT: amount(i.targetedT),
    },
    mrc1: {
      onsiteShareText: m1.onsiteShare === null ? 'Not given' : pct(m1.onsiteShare),
      onsitePointsText: points(m1.onsitePoints),
      furnitureShareText: m1.furnitureShare === null ? 'Not given' : pct(m1.furnitureShare),
      furniturePointsText: points(m1.furniturePoints),
      option2Text: points(m1.option2),
      pointsText: `${points(m1.points)} of 4`,
      points: m1.points,
    },
    offsite: [...LEED_TARGETED_TYPES, ...LEED_OTHER_TYPES].map((t) => ({ type: t, label: LEED_TYPE_LABELS[t], targeted: (LEED_TARGETED_TYPES as readonly string[]).includes(t), share: i.offsite[t] === undefined ? '' : pctInput(i.offsite[t]!), onProjectText: onProject(t) })),
    mrc5: {
      hasEstimates: streams.length > 0,
      totalText: f.massWaste(m5.totalT),
      salvagedText: f.massWaste(m5.salvagedT),
      recycledText: `${f.massWaste(m5.separatedT)} separated, ${f.massWaste(m5.mixedT)} mixed`,
      rateText: m5.rate === null ? 'No estimate yet' : pct(m5.rate),
      separatedShareText: m5.separatedShareOfDiverted === null ? 'No estimate yet' : pct(m5.separatedShareOfDiverted),
      mixedRateText: m5.mixedVerified ? `${pct(m5.mixedRate)}, verified` : `${pct(LEED_UNVERIFIED_MIXED_CAP)}, the cap without verification`,
      targetedShareText: m5.targetedShare === null ? 'Not given' : pct(m5.targetedShare),
      pointsText: `${points(m5.points)} of 4`,
      points: m5.points,
    },
  }
}

function breeamView(state: AppData, projectId: string): Wst01View {
  const r = cesOf(state, projectId)
  const p = state.world.projects[projectId]
  const w = breeamWst01(r.waste.construction, r.waste.demolition, p.giaM2)
  const row = (label: string, share: number | null, need: number, met: boolean | null) => ({ label, valueText: share === null ? 'No estimate yet' : pct(share), needText: `${pct(need)} needed`, met })
  return {
    hasEstimate: w.tPerM2 !== null,
    tPerM2Text: w.tPerM2 === null ? 'No estimate yet' : `${f.number(w.tPerM2, 3)} t/m2`,
    creditsText: w.tPerM2 === null ? 'No estimate yet' : (w.credits ?? 'Above the 1 credit band'),
    nextText: w.next ? `${w.next.credits} at no more than ${w.next.atMost} t/m2` : null,
    diversion: [row('Construction waste diverted from landfill', w.constructionDiverted, BREEAM_WST01_DIVERSION.construction, w.constructionMet), row('Demolition waste diverted from landfill', w.demolitionDiverted, BREEAM_WST01_DIVERSION.demolition, w.demolitionMet)],
  }
}

const FEATURE_LABELS: Record<WellCheck['feature'], string> = { X01: 'X01 material restrictions', X02: 'X02 hazardous materials', X03: 'X03 CCA and lead' }

function wellView(state: AppData, viewer: Viewer, projectId: string): WellView {
  const items = projectMetrics(state, viewer, projectId)!.items
  const rows = wellScreen(items.map((i) => ({ publicId: i.publicId, description: i.description, family: i.family, eraBand: i.eraBand, hazards: i.hazards }))).map((r) => ({ ...r, checks: r.checks.map((c) => ({ ...c, label: FEATURE_LABELS[c.feature] })) }))
  const all = rows.flatMap((r) => r.checks)
  return { rows, confirmed: all.filter((c) => c.status === 'confirmed').length, toCheck: all.filter((c) => c.status === 'check').length }
}

/** The calculators for one scheme's page; the others are null. */
export function certCalcs(state: AppData, viewer: Viewer, projectId: string, scheme: SchemeId): CertCalcs {
  return {
    leed: scheme === 'leed' ? leedView(state, viewer, projectId) : null,
    breeam: scheme === 'breeam' ? breeamView(state, projectId) : null,
    well: scheme === 'well' ? wellView(state, viewer, projectId) : null,
  }
}
