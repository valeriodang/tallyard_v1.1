// The circular economy statement workspace (round 3, BRIEF section 15.7): whether a statement is needed, the
// guidance's stage matrix with how ready the statement is, the decision tree for existing buildings, the bill of
// materials with lifespans, waste factors and end of life, waste reporting with benchmarks and a guard against
// counting crushed material as reuse, targets with pioneering flags, the post-construction deadline and a quality
// check built from the GLA's monitoring findings. Pure.
import type { BillLine } from '../types'
import type { ExistingQuestion, WasteEstimate, WasteRoutes, YesNo } from '../cesTypes'
import { CES_STAGES, GLA_TARGETS, REFERRAL_CRITERIA, STAGE_MATRIX, type CesStage, type Quartiles, type StageNeed } from '../reference/gla'
import { LIFESPANS, WASTE_RATES, type EndOfLifeSplit, type EolScenarioId } from '../reference/rics'
import { NRM_BENCHMARK, NRM_READING, REUSE_GUARD_SHARE, STUDY_PERIOD_YEARS, type ExistingOutcome } from '../reference/ces'
import { bauSplit, FAMILY_EOL_MATERIAL, scenarioSplit } from './eol'
import { quartilePosition, type QuartilePosition } from './benchmark'

// ---------- Is a statement needed? ----------

export type Requirement = { required: boolean; reasons: string[] }

/** A statement is needed for referable schemes, in the City of London for every major, and where the borough asks. */
export function statementRequired(referralIds: string[], localRequirement: boolean, inCity: boolean): Requirement {
  const reasons = REFERRAL_CRITERIA.filter((c) => referralIds.includes(c.id)).map((c) => `Referable to the Mayor: ${c.label.charAt(0).toLowerCase()}${c.label.slice(1)}`)
  if (inCity) reasons.push('In the City of London, every major development provides a statement')
  if (localRequirement) reasons.push("The borough's own plan asks for one")
  return { required: reasons.length > 0, reasons }
}

// ---------- The stage matrix ----------

export type StageRow = { id: string; label: string; need: StageNeed; done: boolean }

/** The guidance's Table 5 at a stage, each row marked done or not from the project's records. */
export function stageRows(stage: CesStage, done: Record<string, boolean>): StageRow[] {
  return STAGE_MATRIX.map((m) => ({ id: m.id, label: m.label, need: m.needs[stage], done: !!done[m.id] }))
}

/** Of the rows the stage requires, how many are done. */
export function readiness(rows: StageRow[]): { done: number; required: number; share: number } {
  const req = rows.filter((r) => r.need === 'required')
  const done = req.filter((r) => r.done).length
  return { done, required: req.length, share: req.length > 0 ? done / req.length : 1 }
}

export function nextStage(stage: CesStage): CesStage | null {
  const i = CES_STAGES.indexOf(stage)
  return i < CES_STAGES.length - 1 ? CES_STAGES[i + 1] : null
}

// ---------- The decision tree for existing buildings ----------

/** Where the template's four questions lead. Unanswered questions on the path leave it incomplete. */
export function existingOutcome(a: Partial<Record<ExistingQuestion, YesNo>>): ExistingOutcome {
  if (!a.hasBuilding) return 'incomplete'
  if (a.hasBuilding === 'no') return 'new_building'
  if (!a.retainFeasible) return 'incomplete'
  if (a.retainFeasible === 'yes') {
    if (!a.suited) return 'incomplete'
    if (a.suited === 'yes') return 'retain'
  }
  if (!a.residualValue) return 'incomplete'
  return a.residualValue === 'yes' ? 'disassemble' : 'demolish'
}

/** Below retention the guidance asks for a justification, the more compelling the further down. */
export function needsJustification(outcome: ExistingOutcome): boolean {
  return outcome === 'disassemble' || outcome === 'demolish'
}

// ---------- The bill of materials ----------

export type BomRow = {
  id: string
  element: string
  massT: number
  intensityKgM2: number
  recycledMassT: number
  recycledValue: number
  lifespanYears: number
  replacements: number
  wasteFactor: number
  wasteT: number
  eol: EndOfLifeSplit
  /** The RICS material whose end of life the line takes, for the Level(s) score. */
  eolMaterial: string
  reusableT: number
  recyclableT: number
}

export type BomBenchmarkRow = { benchmark: string; intensityKgM2: number; quartiles: Quartiles; position: QuartilePosition }

function reading(element: string) {
  const code = element.split(' ')[0]
  return [...NRM_READING].sort((x, y) => y.prefix.length - x.prefix.length).find((r) => code === r.prefix || code.startsWith(`${r.prefix}.`)) ?? NRM_READING[0]
}

/** Replacements over the study period: a part lasting the period or longer is never replaced. */
export function replacementsOver(lifespanYears: number, period = STUDY_PERIOD_YEARS): number {
  return lifespanYears >= period ? 0 : Math.ceil(period / lifespanYears) - 1
}

/** Each line with its intensity, lifespan, replacements, site waste and end of life under a scenario. */
export function bomRows(lines: BillLine[], giaM2: number, scenario: EolScenarioId): BomRow[] {
  return lines.map((l) => {
    const r = reading(l.element)
    const eolMaterial = l.family ? FAMILY_EOL_MATERIAL[l.family].material : r.eolMaterial
    const eol = scenarioSplit(scenario, bauSplit(eolMaterial))
    const lifespanYears = LIFESPANS.find((x) => x.id === r.lifespan)!.years
    const wasteFactor = WASTE_RATES.find((x) => x.id === r.wasteRate)!.rate
    return {
      id: l.id,
      element: l.element,
      massT: l.massT,
      intensityKgM2: giaM2 > 0 ? (l.massT * 1000) / giaM2 : 0,
      recycledMassT: l.massT * l.recycledShare,
      recycledValue: l.valueGbp * l.recycledShare,
      lifespanYears,
      replacements: replacementsOver(lifespanYears),
      wasteFactor,
      wasteT: l.massT * wasteFactor,
      eol,
      eolMaterial,
      reusableT: l.massT * eol.reuse,
      recyclableT: l.massT * eol.recycle,
    }
  })
}

/** The bill's intensity against the guidance's benchmarks, by category. Categories with no lines are left out. */
export function bomBenchmarks(rows: BomRow[], quartiles: Record<string, Quartiles>): BomBenchmarkRow[] {
  const out: BomBenchmarkRow[] = []
  for (const b of [...new Set(NRM_BENCHMARK.map((x) => x.benchmark))]) {
    const prefixes = NRM_BENCHMARK.filter((x) => x.benchmark === b).map((x) => x.prefix)
    const mine = rows.filter((r) => {
      const code = r.element.split(' ')[0]
      return prefixes.some((p) => code === p || code.startsWith(`${p}.`))
    })
    if (mine.length === 0) continue
    const intensity = mine.reduce((s, r) => s + r.intensityKgM2, 0)
    out.push({ benchmark: b, intensityKgM2: intensity, quartiles: quartiles[b], position: quartilePosition(intensity, quartiles[b]) })
  }
  return out
}

// ---------- Waste reporting ----------

export function routesTotal(r: WasteRoutes): number {
  return r.reuseOnsite + r.reuseOffsite + r.recycleOnsite + r.recycleOffsite + r.landfill + r.other
}

export type WasteRow = {
  tonnes: number | null
  tPerM2: number | null
  reuse: number
  recycle: number
  /** Reuse, recycling and recovery: everything but landfill. The 95% targets are read this way. */
  recovered: number
  landfill: number
  /** The routes as entered add up to 100%. */
  complete: boolean
  /** Reuse above the guard share: check crushed material is counted as recycling. */
  guard: boolean
}

/** A stream's rates. Municipal waste is entered per year, so its intensity is per year too. */
export function wasteRow(e: WasteEstimate | undefined, giaM2: number): WasteRow {
  if (!e) return { tonnes: null, tPerM2: null, reuse: 0, recycle: 0, recovered: 0, landfill: 0, complete: false, guard: false }
  const r = e.routes
  const reuse = r.reuseOnsite + r.reuseOffsite
  const recycle = r.recycleOnsite + r.recycleOffsite
  const tPerM2 = e.tonnes !== null && giaM2 > 0 ? e.tonnes / giaM2 : null
  return {
    tonnes: e.tonnes,
    tPerM2,
    reuse,
    recycle,
    recovered: reuse + recycle + r.other,
    landfill: r.landfill,
    complete: Math.abs(routesTotal(r) - 1) < 1e-9,
    guard: reuse > REUSE_GUARD_SHARE,
  }
}

// ---------- Targets ----------

export type TargetRow = { id: string; label: string; minimum: number; basis: string; aiming: number | null; pioneering: boolean; copiesMinimum: boolean; achieved: number | null; met: boolean | null }

/**
 * Each GLA target with what the scheme aims for. Aiming above the minimum earns the template's pioneering status;
 * aiming at exactly the minimum is what the monitoring report found most statements did. The zero landfill target
 * is met at or below its value; the rest at or above.
 */
export function targetRows(aiming: Partial<Record<string, number>>, achieved: Partial<Record<string, number>>): TargetRow[] {
  return GLA_TARGETS.map((t) => {
    const lower = t.id === 'landfill_zero'
    const a = aiming[t.id] ?? null
    const got = achieved[t.id] ?? null
    return {
      id: t.id,
      label: t.label,
      minimum: t.value,
      basis: t.basis === 'policy' ? 'Policy' : 'Guidance aim',
      aiming: a,
      pioneering: a !== null && (lower ? a < t.value : a > t.value),
      copiesMinimum: a !== null && Math.abs(a - t.value) < 1e-9,
      achieved: got,
      met: got === null ? null : lower ? got <= t.value + 1e-9 : got >= t.value - 1e-9,
    }
  })
}

// ---------- Post-construction ----------

/** The date three calendar months after practical completion, by which the post-construction statement is due. */
export function postConstructionDue(completion: string, months: number): string {
  const [y, m, d] = completion.split('-').map(Number)
  const total = y * 12 + (m - 1) + months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`
}

// ---------- The quality check ----------

export type QualityInput = {
  templateComplete: boolean
  pioneeringTargets: number
  allAtMinimum: boolean
  hasBuilding: boolean | null
  outcome: ExistingOutcome
  justified: boolean
  audits: { preRedevelopment: boolean; preDemolition: boolean }
  completionKnown: boolean
}

export type QualityRow = { id: string; pass: boolean; text: string }

/** One line for each failing the GLA's 2023 monitoring found most often. */
export function qualityCheck(i: QualityInput): QualityRow[] {
  const existing = i.hasBuilding === true
  return [
    { id: 'template', pass: i.templateComplete, text: i.templateComplete ? 'Every item the stage requires is in the template.' : '45% of statements came without the template. Complete the items this stage requires.' },
    {
      id: 'minimum_targets',
      pass: i.pioneeringTargets > 0 && !i.allAtMinimum,
      text: i.pioneeringTargets > 0 ? `${i.pioneeringTargets} ${i.pioneeringTargets === 1 ? 'target aims' : 'targets aim'} above the minimum.` : 'Most statements copy the policy minimums. Aim above at least one to reach pioneering status.',
    },
    {
      id: 'retention',
      pass: i.hasBuilding === false || (existing && (i.outcome === 'retain' || (needsJustification(i.outcome) && i.justified))),
      text:
        i.hasBuilding === null
          ? 'Say whether there is a building on the site, then follow the decision tree.'
          : !existing
            ? 'No existing building on the site.'
            : i.outcome === 'retain'
              ? 'The existing building is retained.'
              : i.justified
                ? 'Retention explored, with the reasons given.'
                : 'Only 13% of schemes with a building kept any of it. Answer the decision tree and justify not retaining.',
    },
    {
      id: 'audits',
      pass: i.hasBuilding === false || (existing && i.audits.preRedevelopment && i.audits.preDemolition),
      text:
        i.hasBuilding === null
          ? 'The audits needed depend on whether there is a building on the site.'
          : !existing
            ? 'No audits needed without a building.'
            : i.audits.preRedevelopment && i.audits.preDemolition
              ? 'Both audits accompany the statement.'
              : 'About 19% of sites with buildings sent a pre-redevelopment audit. Attach both audits.',
    },
    { id: 'post_construction', pass: i.completionKnown, text: i.completionKnown ? 'The post-construction statement has a due date.' : 'No post-construction results have been analysed yet. Set practical completion so the due date is known.' },
  ]
}

// ---------- Reused and recycled content ----------

export type ContentSplit = { reusedMassT: number; recycledMassT: number; totalMassT: number; reusedValue: number; recycledValue: number; totalValue: number }

/** Reused and recycled content kept apart, by mass and by value, from the content engine's lines. */
export function contentSplit(lines: { line: BillLine; reusedPercent: number; recycledPercent: number }[]): ContentSplit {
  let reusedMassT = 0
  let recycledMassT = 0
  let reusedValue = 0
  let recycledValue = 0
  for (const l of lines) {
    reusedMassT += l.line.massT * l.reusedPercent
    recycledMassT += l.line.massT * l.recycledPercent
    reusedValue += l.line.valueGbp * l.reusedPercent
    recycledValue += l.line.valueGbp * l.recycledPercent
  }
  return { reusedMassT, recycledMassT, totalMassT: lines.reduce((s, l) => s + l.line.massT, 0), reusedValue, recycledValue, totalValue: lines.reduce((s, l) => s + l.line.valueGbp, 0) }
}

/** The share of the cost plan's material cost the bill covers; the content aim needs at least 80%. */
export function coverage(billValue: number, materialCost: number | null): number | null {
  return materialCost && materialCost > 0 ? Math.min(1, billValue / materialCost) : null
}
