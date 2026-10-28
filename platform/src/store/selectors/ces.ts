// The consultant's circular economy statement workspace (round 3, BRIEF section 15.7): the records behind the GLA
// template, worked out for the screen and the template export. Consultant only.
import type { CesLayer, ExistingQuestion, WasteRoutes, WasteStream } from '../../domain/cesTypes'
import { BENCHMARKS, BENCHMARK_LABELS, CES_STAGE_LABELS, CES_STAGES, POST_CONSTRUCTION_MONTHS, REFERRAL_CRITERIA, type CesStage, type StageNeed } from '../../domain/reference/gla'
import { EOL_SCENARIOS, type EolScenarioId } from '../../domain/reference/rics'
import { FAMILIES } from '../../domain/reference/families'
import { BILL_LINE_NAMES } from '../../domain/seed/world'
import { CES_LAYERS, DESIGN_APPROACHES, EXISTING_OUTCOMES, EXISTING_QUESTIONS, WASTE_STREAMS, type ExistingOutcome } from '../../domain/reference/ces'
import { bomBenchmarks, bomRows, contentSplit, coverage, existingOutcome, needsJustification, nextStage, postConstructionDue, qualityCheck, readiness, stageRows, statementRequired, targetRows, wasteRow, type QualityRow } from '../../domain/engines/ces'
import { QUARTILE_POSITION_TEXT, quartilePosition } from '../../domain/engines/benchmark'
import { formatDate } from '../../domain/dates'
import * as f from '../../domain/format'
import type { BillLine } from '../../domain/types'
import type { AppData, Viewer } from '../types'
import { projectSide } from '../access'
import { cesOf } from '../actions/ces'
import { projectMetrics } from './consultant'
import { todayOf } from './common'

const NEED_LABELS: Record<StageNeed, string> = { required: 'Required', encouraged: 'Encouraged', not_needed: 'Not needed' }

export const pct = (x: number) => `${Math.round(x * 1000) / 10}%`
export const pctInput = (x: number) => String(Math.round(x * 1000) / 10)

export type CesWasteView = {
  stream: WasteStream
  label: string
  perYear: boolean
  tonnes: string
  source: string
  routes: Record<keyof WasteRoutes, string>
  tPerM2Text: string
  reuseText: string
  recycleText: string
  recoveredText: string
  landfillText: string
  complete: boolean
  guard: boolean
  benchmarkText: string | null
}

export type CesView = {
  canEdit: boolean
  projectName: string
  giaText: string
  requirement: { required: boolean; reasons: string[]; inCity: boolean; localRequirement: boolean; criteria: { id: string; label: string; checked: boolean }[] }
  stage: CesStage
  stages: { value: CesStage; label: string }[]
  matrix: { id: string; label: string; need: StageNeed; needLabel: string; done: boolean }[]
  readinessText: string
  readinessShare: number
  nextStageText: string | null
  tree: {
    questions: { id: ExistingQuestion; text: string; answer: 'yes' | 'no' | null; shown: boolean }[]
    outcome: ExistingOutcome
    outcomeLabel: string
    outcomeText: string
    needsJustification: boolean
    justification: string
  }
  layers: { id: CesLayer; label: string; text: string; nrm: string; response: string; approaches: { id: string; label: string; checked: boolean }[] }[]
  approaches: { id: string; label: string; text: string }[]
  bom: {
    empty: boolean
    scenario: EolScenarioId
    scenarios: { value: EolScenarioId; label: string; text: string }[]
    rows: { id: string; element: string; name: string; massText: string; intensityText: string; lifespanText: string; replacements: number; wasteText: string; eolText: string }[]
    totals: { massText: string; intensityText: string; wasteText: string; reusableText: string; recyclableText: string }
    benchmarks: { label: string; intensityText: string; medianText: string; positionText: string }[]
    content: { reusedMassText: string; recycledMassText: string; reusedMassShare: string; recycledMassShare: string; reusedValueShare: string; recycledValueShare: string }
    materialCost: string
    coverageText: string | null
    coverageOk: boolean | null
  }
  waste: CesWasteView[]
  targets: { id: string; label: string; minimumText: string; basis: string; aiming: string; achieved: string; pioneering: boolean; copiesMinimum: boolean; met: boolean | null }[]
  post: { completionText: string; dueText: string; dueIso: string; overdue: boolean; achievements: { id: string; measure: string; action: string }[]; lessons: { id: string; description: string; solution: string }[] }
  audits: { preRedevelopment: boolean; preDemolition: boolean }
  quality: QualityRow[]
  qualityPassed: number
  fileName: string
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** What a bill line is made of: its name in the cost plan, or its material family. */
function lineName(line: BillLine): string {
  return BILL_LINE_NAMES[line.id] ?? (line.family ? FAMILIES[line.family].label : '')
}

export function cesView(state: AppData, viewer: Viewer, projectId: string): CesView | null {
  if (projectSide(state, viewer.userId, projectId) !== 'consultant') return null
  const p = state.world.projects[projectId]
  const r = cesOf(state, projectId)
  const today = todayOf(viewer)
  const inCity = p.localAuthority === 'City of London'
  const requirement = statementRequired(r.referralIds, r.localRequirement, inCity)

  // The decision tree: a question shows once the answers before it lead to it.
  const outcome = existingOutcome(r.existing)
  const shown: Record<ExistingQuestion, boolean> = {
    hasBuilding: true,
    retainFeasible: r.existing.hasBuilding === 'yes',
    suited: r.existing.hasBuilding === 'yes' && r.existing.retainFeasible === 'yes',
    residualValue: r.existing.hasBuilding === 'yes' && (r.existing.retainFeasible === 'no' || r.existing.suited === 'no'),
  }
  const justified = !needsJustification(outcome) || r.justification.trim().length > 0

  // What the project's records already hold, for the stage matrix.
  const noBuilding = r.existing.hasBuilding === 'no'
  const layersAnswered = CES_LAYERS.filter((l) => (r.layers[l.id]?.response ?? '').trim().length > 0).length
  const wasteDone = (s: WasteStream) => {
    const w = wasteRow(r.waste[s], p.giaM2)
    return w.tonnes !== null && w.complete
  }
  const done: Record<string, boolean> = {
    targets: Object.keys(r.aiming).length > 0,
    approaches: outcome !== 'incomplete' && justified,
    principles: layersAnswered > 0,
    layers: layersAnswered === CES_LAYERS.length,
    pre_redevelopment: noBuilding || r.audits.preRedevelopment,
    pre_demolition: noBuilding || r.audits.preDemolition,
    bill_of_materials: p.billOfMaterials.length > 0,
    end_of_life: r.eolScenario !== null,
    operational_waste: wasteDone('municipal'),
    waste_reporting: wasteDone('demolition') && wasteDone('construction'),
    lessons: r.achievements.length > 0 && r.lessons.length > 0,
  }
  const rows = stageRows(r.stage, done)
  const ready = readiness(rows)
  const next = nextStage(r.stage)

  // The bill of materials.
  const scenario = r.eolScenario ?? 'bau'
  const bom = bomRows(p.billOfMaterials, p.giaM2, scenario)
  const bench = bomBenchmarks(bom, BENCHMARKS.lpg.values)
  const metrics = projectMetrics(state, viewer, projectId)!
  const split = contentSplit(metrics.secured.lines)
  const cov = coverage(split.totalValue, r.materialCost)
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

  // Targets and the quality check.
  const targets = targetRows(r.aiming, r.achieved)
  const completion = p.programme.practicalCompletion
  const due = postConstructionDue(completion, POST_CONSTRUCTION_MONTHS)
  const quality = qualityCheck({
    templateComplete: ready.done === ready.required,
    pioneeringTargets: targets.filter((t) => t.pioneering).length,
    allAtMinimum: targets.filter((t) => t.aiming !== null).every((t) => t.copiesMinimum),
    hasBuilding: r.existing.hasBuilding === undefined ? null : r.existing.hasBuilding === 'yes',
    outcome,
    justified: r.justification.trim().length > 0,
    audits: r.audits,
    completionKnown: !!completion,
  })

  return {
    canEdit: true,
    projectName: p.name,
    giaText: `${f.number(p.giaM2)} m2 GIA`,
    requirement: { ...requirement, inCity, localRequirement: r.localRequirement, criteria: REFERRAL_CRITERIA.map((c) => ({ id: c.id, label: c.label, checked: r.referralIds.includes(c.id) })) },
    stage: r.stage,
    stages: CES_STAGES.map((s) => ({ value: s, label: CES_STAGE_LABELS[s] })),
    matrix: rows.map((m) => ({ ...m, needLabel: NEED_LABELS[m.need] })),
    readinessText: `${ready.done} of ${ready.required} required items ready for the ${CES_STAGE_LABELS[r.stage].toLowerCase()} stage`,
    readinessShare: ready.share,
    nextStageText: next ? `Next: ${CES_STAGE_LABELS[next].toLowerCase()}` : null,
    tree: {
      questions: EXISTING_QUESTIONS.map((q) => ({ id: q.id, text: q.text, answer: r.existing[q.id] ?? null, shown: shown[q.id] })),
      outcome,
      outcomeLabel: outcome === 'incomplete' ? 'Answer the questions to find the approach' : EXISTING_OUTCOMES[outcome].label,
      outcomeText: outcome === 'incomplete' ? 'The guidance starts from keeping what is there.' : EXISTING_OUTCOMES[outcome].text,
      needsJustification: needsJustification(outcome),
      justification: r.justification,
    },
    layers: CES_LAYERS.map((l) => ({ id: l.id, label: l.label, text: l.text, nrm: l.nrm, response: r.layers[l.id]?.response ?? '', approaches: DESIGN_APPROACHES.map((d) => ({ id: d.id, label: d.label, checked: (r.layers[l.id]?.approaches ?? []).includes(d.id) })) })),
    approaches: DESIGN_APPROACHES.map((d) => ({ id: d.id, label: d.label, text: d.text })),
    bom: {
      empty: bom.length === 0,
      scenario,
      scenarios: (Object.keys(EOL_SCENARIOS) as EolScenarioId[]).map((s) => ({ value: s, label: EOL_SCENARIOS[s].label, text: EOL_SCENARIOS[s].description })),
      rows: bom.map((b, i) => ({
        id: b.id,
        element: b.element,
        name: lineName(p.billOfMaterials[i]),
        massText: f.massWaste(b.massT),
        intensityText: `${f.number(b.intensityKgM2, 1)} kg/m2`,
        lifespanText: `${b.lifespanYears} years`,
        replacements: b.replacements,
        wasteText: pct(b.wasteFactor),
        eolText: `${pct(b.eol.reuse)} reuse, ${pct(b.eol.recycle)} recycling, ${pct(b.eol.energy + b.eol.disposal)} other`,
      })),
      totals: {
        massText: f.massWaste(sum(bom.map((b) => b.massT))),
        intensityText: `${f.number(sum(bom.map((b) => b.intensityKgM2)), 1)} kg/m2`,
        wasteText: f.massWaste(sum(bom.map((b) => b.wasteT))),
        reusableText: f.massWaste(sum(bom.map((b) => b.reusableT))),
        recyclableText: f.massWaste(sum(bom.map((b) => b.recyclableT))),
      },
      benchmarks: bench.map((b) => ({ label: BENCHMARK_LABELS[b.benchmark as keyof typeof BENCHMARK_LABELS].label, intensityText: `${f.number(b.intensityKgM2, 1)} kg/m2`, medianText: `${f.number(b.quartiles.median, 1)} kg/m2`, positionText: QUARTILE_POSITION_TEXT[b.position] })),
      // Shares by value only: the consultant's views carry no money figure (P3), as for the rest of sustainability.
      content: {
        reusedMassText: f.massWaste(split.reusedMassT),
        recycledMassText: f.massWaste(split.recycledMassT),
        reusedMassShare: pct(split.totalMassT > 0 ? split.reusedMassT / split.totalMassT : 0),
        recycledMassShare: pct(split.totalMassT > 0 ? split.recycledMassT / split.totalMassT : 0),
        reusedValueShare: pct(split.totalValue > 0 ? split.reusedValue / split.totalValue : 0),
        recycledValueShare: pct(split.totalValue > 0 ? split.recycledValue / split.totalValue : 0),
      },
      materialCost: r.materialCost === null ? '' : String(r.materialCost),
      coverageText: cov === null ? null : `The bill covers ${pct(cov)} of the material cost.`,
      coverageOk: cov === null ? null : cov >= 0.8,
    },
    waste: WASTE_STREAMS.map((w) => {
      const e = r.waste[w.id]
      const row = wasteRow(e, p.giaM2)
      const q = BENCHMARKS.lpg.values[w.benchmark]
      return {
        stream: w.id,
        label: w.label,
        perYear: w.perYear,
        tonnes: e?.tonnes === null || e?.tonnes === undefined ? '' : String(e.tonnes),
        source: e?.source ?? '',
        routes: Object.fromEntries((['reuseOnsite', 'reuseOffsite', 'recycleOnsite', 'recycleOffsite', 'landfill', 'other'] as (keyof WasteRoutes)[]).map((k) => [k, e ? pctInput(e.routes[k]) : '0'])) as Record<keyof WasteRoutes, string>,
        tPerM2Text: row.tPerM2 === null ? 'Not estimated' : `${f.number(row.tPerM2, 3)} t/m2${w.perYear ? ' a year' : ''}`,
        reuseText: pct(row.reuse),
        recycleText: pct(row.recycle),
        recoveredText: pct(row.recovered),
        landfillText: pct(row.landfill),
        complete: row.complete,
        guard: row.guard,
        benchmarkText: row.tPerM2 === null ? null : `${QUARTILE_POSITION_TEXT[quartilePosition(row.tPerM2, q)]}; the guidance median is ${q.median}`,
      }
    }),
    targets: targets.map((t) => ({
      id: t.id,
      label: t.label,
      minimumText: t.id === 'landfill_zero' ? 'None to landfill by 2026' : `${pct(t.minimum)} at least`,
      basis: t.basis,
      aiming: t.aiming === null ? '' : pctInput(t.aiming),
      achieved: t.achieved === null ? '' : pctInput(t.achieved),
      pioneering: t.pioneering,
      copiesMinimum: t.copiesMinimum,
      met: t.met,
    })),
    post: {
      completionText: completion ? formatDate(completion) : 'Not set',
      dueText: completion ? formatDate(due) : 'Not set',
      dueIso: due,
      overdue: !!completion && today > due && r.lessons.length === 0,
      achievements: r.achievements,
      lessons: r.lessons,
    },
    audits: r.audits,
    quality,
    qualityPassed: quality.filter((x) => x.pass).length,
    fileName: `${slug(p.name)}-gla-ce-statement-template-${today}.xlsx`,
  }
}

// ---------- The GLA template's model ----------

export type CesTemplate = {
  details: [string, string][]
  existing: { question: string; answer: string }[]
  strategy: string
  justification: string
  layers: { layer: string; approaches: string; response: string }[]
  bom: { element: string; material: string; massKg: number; intensity: number; recycledKg: number; recycledValueShare: number; wasteFactor: number; wasteKg: number; lifespan: number; replacements: number; replacementKg: number; scenario: string; reuse: number; recycle: number; landfill: number; reusableKg: number; recyclableKg: number }[]
  giaM2: number
  waste: { type: string; source: string; tonnes: number | null; routes: WasteRoutes; perYear: boolean }[]
  targets: { label: string; requirement: string; aiming: number | null; achieved: number | null; met: string }[]
  achievements: { measure: string; action: string }[]
  lessons: { description: string; solution: string }[]
  stageLabel: string
  cityOfLondon: boolean
}

/** The workspace as the GLA template's tables, with raw numbers for the spreadsheet. Consultant only. */
export function cesTemplate(state: AppData, viewer: Viewer, projectId: string): CesTemplate | null {
  if (projectSide(state, viewer.userId, projectId) !== 'consultant') return null
  const p = state.world.projects[projectId]
  const r = cesOf(state, projectId)
  const scenario = r.eolScenario ?? 'bau'
  const outcome = existingOutcome(r.existing)
  const clientName = state.world.orgs[p.clientOrgId]?.name ?? ''
  const consultantName = state.world.orgs[p.consultantOrgId]?.name ?? ''
  return {
    details: [
      ['Project name', p.name],
      ['Planning application reference number', ''],
      ['Applicant', clientName],
      ['Local planning authority', p.localAuthority],
      ['Brief description of the project', p.description],
      ['Author', consultantName],
      ['Date of assessment', formatDate(todayOf(viewer))],
      ['Overall GIA (m2)', String(p.giaM2)],
      ['Stage', CES_STAGE_LABELS[r.stage]],
    ],
    existing: EXISTING_QUESTIONS.map((q) => ({ question: q.text, answer: r.existing[q.id] === 'yes' ? 'Yes' : r.existing[q.id] === 'no' ? 'No' : '' })),
    strategy: outcome === 'incomplete' ? '' : EXISTING_OUTCOMES[outcome].label,
    justification: r.justification,
    layers: CES_LAYERS.map((l) => ({ layer: l.label, approaches: (r.layers[l.id]?.approaches ?? []).map((a) => DESIGN_APPROACHES.find((d) => d.id === a)!.label).join(', '), response: r.layers[l.id]?.response ?? '' })),
    bom: bomRows(p.billOfMaterials, p.giaM2, scenario).map((b, i) => {
      const line = p.billOfMaterials[i]
      return {
        element: b.element,
        material: lineName(line),
        massKg: b.massT * 1000,
        intensity: b.intensityKgM2,
        recycledKg: b.recycledMassT * 1000,
        recycledValueShare: line.recycledShare,
        wasteFactor: b.wasteFactor,
        wasteKg: b.wasteT * 1000,
        lifespan: b.lifespanYears,
        replacements: b.replacements,
        replacementKg: b.massT * 1000 * b.replacements,
        scenario: EOL_SCENARIOS[scenario].label,
        reuse: b.eol.reuse,
        recycle: b.eol.recycle,
        landfill: b.eol.energy + b.eol.disposal,
        reusableKg: b.reusableT * 1000,
        recyclableKg: b.recyclableT * 1000,
      }
    }),
    giaM2: p.giaM2,
    waste: WASTE_STREAMS.map((w) => {
      const e = r.waste[w.id]
      return { type: w.label, source: e?.source ?? '', tonnes: e?.tonnes ?? null, routes: e?.routes ?? { reuseOnsite: 0, reuseOffsite: 0, recycleOnsite: 0, recycleOffsite: 0, landfill: 0, other: 0 }, perYear: w.perYear }
    }),
    targets: targetRows(r.aiming, r.achieved).map((t) => ({ label: t.label, requirement: t.id === 'landfill_zero' ? 'None to landfill by 2026' : `${pct(t.minimum)} at least (${t.basis.toLowerCase()})`, aiming: t.aiming, achieved: t.achieved, met: t.met === null ? '' : t.met ? 'Yes' : 'No' })),
    achievements: r.achievements.map((a) => ({ measure: a.measure, action: a.action })),
    lessons: r.lessons.map((l) => ({ description: l.description, solution: l.solution })),
    stageLabel: CES_STAGE_LABELS[r.stage],
    cityOfLondon: p.localAuthority === 'City of London',
  }
}
