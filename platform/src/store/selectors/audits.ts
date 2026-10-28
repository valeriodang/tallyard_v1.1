// The audits of a donor building, worked out for the screens and the workbook (round 3, BRIEF section 15.3). Every
// figure comes from the audit engine; the screens only lay out the text given here (P2). Audits are owner-private:
// these views open only for the building's owner, its surveyor and, for the pre-deconstruction audit, its contractor.
import type { AppData, Viewer } from '../types'
import type { AuditIndependence, AuditRow, BrokerRoute, BrokerStatus, BuildingAudit, HazardStatus, PreDemolitionAudit, PreRedevelopmentAudit, RetentionOption, RetentionOptionKind, RetentionScale } from '../../domain/auditTypes'
import { BROKER_ROUTE_LABELS, BROKER_STATUS_LABELS, EXISTING_OUTCOMES, FAMILY_AUDIT_DEFAULTS, FOLLOW_ON_ASSESSMENTS, HAZARD_STATUS_LABELS, HAZARDS, INDEPENDENCE_LABELS, NRM_CATEGORIES, nrmLabel, OPTION_KIND_LABELS, RETENTION_FACTORS, RETENTION_SCALE_LABELS, TREE_QUESTIONS } from '../../domain/reference/audit'
import { CITY_CONDITION_BANDS, CITY_MINIMUMS, CITY_OFFICE_BENCHMARKS, DEMOLITION_DEFAULT_KGCO2E_M2, RETROFIT_MIN_SUPERSTRUCTURE_SHARE } from '../../domain/reference/cityOfLondon'
import { GLA_TARGETS } from '../../domain/reference/gla'
import { FAMILIES, FAMILY_IDS } from '../../domain/reference/families'
import { appraiseOptions, auditTotals, awaitsListing, listableRows, existingTreeOutcome, existingTreeQuestions, hazardScreen, hazardSuggestions, isCityOfLondon, preDemolitionChecklist, preRedevelopmentChecklist, rowMetrics, checklistReady, type CheckItem, type OptionMetrics, type RowMetrics } from '../../domain/engines/audit'
import { carbon, date as formatDate, fixed, massT, percent } from '../../domain/format'
import { buildingSide, canCaptureIn, canReadAudit } from '../access'
import { buildingHeader, type BuildingRef } from './owner'
import { todayOf } from './common'
import { slug } from './consultant'
import { LABELS } from '../../domain/reference/labels'

export const AUDIT_KIND_LABELS: Record<BuildingAudit['kind'], string> = { pre_redevelopment: 'Pre-redevelopment audit', pre_demolition: 'Pre-deconstruction audit' }
const STATUS_LABELS: Record<BuildingAudit['status'], string> = { draft: 'Draft', complete: 'Complete' }

const KIND_TEXT: Record<BuildingAudit['kind'], { text: string; source: string }> = {
  pre_redevelopment: {
    text: 'Whether the building can be kept, in whole or in part, before anything is designed: six factors, the GLA decision tree and the carbon of each option.',
    source: 'GLA guidance on circular economy statements (2022); City of London Carbon Options advice note (2023)',
  },
  pre_demolition: {
    text: 'What comes out, in what state and where it goes: the reuse, recycling and waste inventories, the hazard screen, a route for every reusable item and the targets.',
    source: 'GLA guidance on circular economy statements (2022), section 3.4; City of London Planning for Sustainability SPD (2025)',
  },
}

function auditsOfBuilding(state: AppData, viewer: Viewer, buildingId: string): BuildingAudit[] {
  return Object.values(state.audits)
    .filter((a) => a.buildingId === buildingId && canReadAudit(state, viewer.userId, a))
    .sort((x, y) => (x.kind === y.kind ? x.createdAt.localeCompare(y.createdAt) : x.kind === 'pre_redevelopment' ? -1 : 1))
}

function checklistOf(state: AppData, audit: BuildingAudit): CheckItem[] {
  const b = state.world.buildings[audit.buildingId]
  return audit.kind === 'pre_redevelopment' ? preRedevelopmentChecklist(audit, b) : preDemolitionChecklist(audit, b)
}

function orgName(state: AppData, orgId: string): string {
  return state.world.orgs[orgId]?.name ?? ''
}

// ---------- The list ----------

export type AuditListEntry = {
  id: string
  kind: BuildingAudit['kind']
  kindLabel: string
  status: BuildingAudit['status']
  statusLabel: string
  auditorName: string
  updatedText: string
  completedText: string | null
  checksDone: number
  checksTotal: number
  href: string
}

export type AuditKindCard = { kind: BuildingAudit['kind']; title: string; text: string; source: string; existingHref: string | null; canStart: boolean }

export type AuditsView = {
  header: BuildingRef
  canWrite: boolean
  isCity: boolean
  audits: AuditListEntry[]
  kinds: AuditKindCard[]
}

export function auditsView(state: AppData, viewer: Viewer, buildingId: string): AuditsView | null {
  const header = buildingHeader(state, viewer, buildingId)
  if (!header) return null
  const b = state.world.buildings[buildingId]
  const canWrite = canCaptureIn(state, viewer.userId, buildingId)
  const audits = auditsOfBuilding(state, viewer, buildingId).map((a): AuditListEntry => {
    const checks = checklistOf(state, a).filter((c) => c.required)
    return {
      id: a.id,
      kind: a.kind,
      kindLabel: AUDIT_KIND_LABELS[a.kind],
      status: a.status,
      statusLabel: STATUS_LABELS[a.status],
      auditorName: a.auditorName || orgName(state, a.authorOrgId),
      updatedText: formatDate(a.updatedAt.slice(0, 10)),
      completedText: a.completedAt ? formatDate(a.completedAt.slice(0, 10)) : null,
      checksDone: checks.filter((c) => c.ok).length,
      checksTotal: checks.length,
      href: `/app/buildings/${buildingId}/audits/${a.id}`,
    }
  })
  const kinds = (['pre_redevelopment', 'pre_demolition'] as const)
    .filter((k) => header.side !== 'contractor' || k === 'pre_demolition')
    .map((k): AuditKindCard => {
      const existing = audits.find((a) => a.kind === k)
      return { kind: k, title: AUDIT_KIND_LABELS[k], text: KIND_TEXT[k].text, source: KIND_TEXT[k].source, existingHref: existing?.href ?? null, canStart: canWrite && !existing }
    })
  return { header, canWrite, isCity: isCityOfLondon(b), audits, kinds }
}

// ---------- One audit ----------

type DetailBase = {
  header: BuildingRef
  id: string
  title: string
  status: BuildingAudit['status']
  statusLabel: string
  canWrite: boolean
  /** The viewer may write and the audit is a draft. */
  editable: boolean
  isCity: boolean
  auditorName: string
  authorName: string
  independence: AuditIndependence
  independenceLabel: string
  independenceOptions: { value: AuditIndependence; label: string }[]
  reviewer: { name: string; organisation: string; reviewedOn: string | null; note: string } | null
  reviewerText: string
  surveyedOn: string | null
  surveyedOnText: string
  summary: string
  completedText: string | null
  checklist: CheckItem[]
  ready: boolean
  checksDone: number
  checksTotal: number
  listHref: string
  source: string
  buildingName: string
  fileName: string
  caveat: string
}

export type FactorView = { id: string; label: string; question: string; scale: RetentionScale | null; scaleLabel: string; note: string }

export type OptionView = {
  id: string
  raw: RetentionOption
  metrics: OptionMetrics
  label: string
  kindLabel: string
  superstructureText: string
  facadeText: string
  giaText: string
  upfrontText: string
  wlcText: string
  demolitionText: string
  demolitionIsDefault: boolean
  upfrontWithDemolitionText: string
  wlcWithDemolitionText: string
  wlcTonnesText: string
  retrofitText: string
  retrofit: boolean | null
  isPreferred: boolean
  isLowestWlc: boolean
  isLowestUpfront: boolean
}

/** A carbon options appraisal, as the owner's pre-redevelopment audit and the consultant's City module both show it. */
export type CarbonOptionsView = {
  options: OptionView[]
  optionKinds: { value: RetentionOptionKind; label: string }[]
  preferredOptionId: string | null
  needsJustification: boolean
  justification: string
  cityChecks: { id: string; label: string; limitText: string; valueText: string; within: boolean }[]
  retrofitRuleText: string
  demolitionDefaultText: string
}

export type PreRedevelopmentView = DetailBase &
  CarbonOptionsView & {
    kind: 'pre_redevelopment'
    factors: FactorView[]
    scaleOptions: { value: RetentionScale; label: string }[]
    factorsRated: number
    tree: { id: keyof PreRedevelopmentAudit['tree']; text: string; answer: 'yes' | 'no' | null }[]
    outcomes: { id: string; label: string; text: string; reached: boolean }[]
    outcomeLabel: string | null
    followOn: { label: string; checked: boolean }[]
  }

export type HazardView = { id: string; label: string; source: string; indicative: boolean; suggested: boolean; status: HazardStatus | null; statusLabel: string; basis: 'era' | 'survey' | 'test' | null; note: string }

export type AuditRowView = {
  id: string
  raw: AuditRow
  metrics: RowMetrics
  inventoryLabel: string
  familyLabel: string
  nrmText: string
  quantityText: string
  massText: string
  scoreText: string
  reusableText: string
  reusableShareText: string
  avoidedText: string
  bandText: string
  routeLabel: string
  statusLabel: string
  itemHref: string | null
}

export type PreDemolitionView = DetailBase & {
  kind: 'pre_demolition'
  yearBuiltText: string
  deskStudy: PreDemolitionAudit['deskStudy']
  hazards: HazardView[]
  hazardStatusOptions: { value: HazardStatus; label: string }[]
  hazardBasisOptions: { value: 'era' | 'survey' | 'test'; label: string }[]
  registerOptions: { value: PreDemolitionAudit['deskStudy']['asbestosRegister']; label: string }[]
  registerText: string
  rows: AuditRowView[]
  inventories: { id: AuditRow['inventory']; label: string; rows: AuditRowView[]; massText: string }[]
  totalsRaw: ReturnType<typeof auditTotals>
  totals: { totalText: string; reusableText: string; reuseByMassText: string; recoveryText: string; avoidedText: string; recoveryMeetsTarget: boolean | null; recoveryStateText: string; recoveryWarning: string; empty: boolean }
  arisings: { code: string; label: string; massText: string }[]
  targets: PreDemolitionAudit['targets']
  targetsText: { reuse: string; recovery: string }
  recoveryTargetText: string
  /** Reusable lines that can be listed early on Tallyard (not yet listed, or listed and not yet marked). */
  listable: number
  importable: number
  familyOptions: { value: string; label: string }[]
  nrmOptions: { value: string; label: string }[]
  bandOptions: { value: number; label: string }[]
  routeOptions: { value: BrokerRoute; label: string }[]
  brokerStatusOptions: { value: BrokerStatus; label: string }[]
  familyDefaults: Record<string, { nrm: string; ewc: string; unit: string }>
}

export type AuditDetailView = PreRedevelopmentView | PreDemolitionView

const share = (x: number | null) => (x === null ? 'Not given' : percent(x))
const kgm2 = (x: number | null) => (x === null ? 'Not given' : `${fixed(x, 0)} kgCO2e per m2`)

function base(state: AppData, viewer: Viewer, audit: BuildingAudit, header: BuildingRef): DetailBase {
  const checklist = checklistOf(state, audit)
  const required = checklist.filter((c) => c.required)
  const canWrite = canCaptureIn(state, viewer.userId, audit.buildingId)
  const r = audit.reviewer
  return {
    header,
    id: audit.id,
    title: AUDIT_KIND_LABELS[audit.kind],
    status: audit.status,
    statusLabel: STATUS_LABELS[audit.status],
    canWrite,
    editable: canWrite && audit.status === 'draft',
    isCity: isCityOfLondon(state.world.buildings[audit.buildingId]),
    auditorName: audit.auditorName,
    authorName: orgName(state, audit.authorOrgId),
    independence: audit.independence,
    independenceLabel: INDEPENDENCE_LABELS[audit.independence],
    independenceOptions: (Object.keys(INDEPENDENCE_LABELS) as AuditIndependence[]).map((value) => ({ value, label: INDEPENDENCE_LABELS[value] })),
    reviewer: r,
    reviewerText: r && r.name ? `${r.name}${r.organisation ? `, ${r.organisation}` : ''}${r.reviewedOn ? `, ${formatDate(r.reviewedOn)}` : ''}` : 'No reviewer yet',
    surveyedOn: audit.surveyedOn,
    surveyedOnText: audit.surveyedOn ? formatDate(audit.surveyedOn) : 'Not set',
    summary: audit.summary,
    completedText: audit.completedAt ? formatDate(audit.completedAt.slice(0, 10)) : null,
    checklist,
    ready: checklistReady(checklist),
    checksDone: required.filter((c) => c.ok).length,
    checksTotal: required.length,
    listHref: `/app/buildings/${audit.buildingId}/audits`,
    source: KIND_TEXT[audit.kind].source,
    buildingName: header.name,
    fileName: `${slug(header.name)}-${audit.kind === 'pre_redevelopment' ? 'pre-redevelopment' : 'pre-deconstruction'}-audit-${todayOf(viewer)}.xlsx`,
    caveat: LABELS.L20,
  }
}

export function carbonOptionsView(raw: RetentionOption[], preferredId: string | null, justification: string): CarbonOptionsView {
  const appraisal = appraiseOptions(raw, preferredId)
  const options = raw.map((o): OptionView => {
    const m = appraisal.metrics.find((x) => x.id === o.id)!
    return {
      id: o.id,
      raw: o,
      metrics: m,
      label: o.label,
      kindLabel: OPTION_KIND_LABELS[o.kind],
      superstructureText: share(o.superstructureRetainedShare),
      facadeText: share(o.facadeRetainedShare),
      giaText: o.giaM2 === null ? 'Not given' : `${fixed(o.giaM2, 0)} m2`,
      upfrontText: kgm2(o.upfrontKgM2),
      wlcText: kgm2(o.wlcKgM2),
      demolitionText: m.demolitionKgM2 === null ? 'Not given' : `${fixed(m.demolitionKgM2, 1)} kgCO2e per m2`,
      demolitionIsDefault: m.demolitionIsDefault,
      upfrontWithDemolitionText: kgm2(m.upfrontWithDemolitionKgM2),
      wlcWithDemolitionText: kgm2(m.wlcWithDemolitionKgM2),
      wlcTonnesText: m.wlcT === null ? 'Not given' : carbon(m.wlcT),
      retrofitText: m.retrofit === null ? 'Share kept not given' : m.retrofit ? 'Counts as retrofit' : 'Does not count as retrofit',
      retrofit: m.retrofit,
      isPreferred: o.id === preferredId,
      isLowestWlc: o.id === appraisal.lowestWlcId,
      isLowestUpfront: o.id === appraisal.lowestUpfrontId,
    }
  })
  return {
    options,
    optionKinds: (Object.keys(OPTION_KIND_LABELS) as RetentionOptionKind[]).map((value) => ({ value, label: OPTION_KIND_LABELS[value] })),
    preferredOptionId: preferredId,
    needsJustification: appraisal.needsJustification,
    justification,
    cityChecks: appraisal.cityChecks.map((c) => {
      const b = CITY_OFFICE_BENCHMARKS.find((x) => x.id === c.id)!
      return { id: c.id, label: `${c.label}, ${b.modules}`, limitText: `${fixed(c.limit, 0)} kgCO2e per m2`, valueText: `${fixed(c.value, 0)} kgCO2e per m2`, within: c.within }
    }),
    retrofitRuleText: `In the City of London an option counts as retrofit when it keeps at least ${fixed(RETROFIT_MIN_SUPERSTRUCTURE_SHARE * 100, 0)}% of the existing superstructure by mass. Keeping the facade alone does not count.`,
    demolitionDefaultText: `Where an option gives no demolition figure, the demolished floor area is counted at ${DEMOLITION_DEFAULT_KGCO2E_M2} kgCO2e per m2, spread over the option's floor area.`,
  }
}

function preRedevelopmentView(state: AppData, viewer: Viewer, a: PreRedevelopmentAudit, header: BuildingRef): PreRedevelopmentView {
  const outcome = existingTreeOutcome(a.tree)
  const applies = new Set(existingTreeQuestions(a.tree))
  return {
    ...base(state, viewer, a, header),
    ...carbonOptionsView(a.options, a.preferredOptionId, a.justification),
    kind: 'pre_redevelopment',
    factors: RETENTION_FACTORS.map((f) => {
      const v = a.factors[f.id]
      return { id: f.id, label: f.label, question: f.question, scale: v?.scale ?? null, scaleLabel: v?.scale ? RETENTION_SCALE_LABELS[v.scale] : 'Not rated', note: v?.note ?? '' }
    }),
    scaleOptions: (Object.keys(RETENTION_SCALE_LABELS) as RetentionScale[]).map((value) => ({ value, label: RETENTION_SCALE_LABELS[value] })),
    factorsRated: RETENTION_FACTORS.filter((f) => a.factors[f.id]?.scale).length,
    tree: TREE_QUESTIONS.filter((q) => applies.has(q.id)).map((q) => ({ id: q.id, text: q.text, answer: a.tree[q.id] })),
    outcomes: EXISTING_OUTCOMES.map((o) => ({ id: o.id, label: o.label, text: o.text, reached: o.id === outcome })),
    outcomeLabel: outcome ? EXISTING_OUTCOMES.find((o) => o.id === outcome)!.label : null,
    followOn: FOLLOW_ON_ASSESSMENTS.map((label) => ({ label, checked: a.followOn.includes(label) })),
  }
}

function rowView(r: AuditRow, buildingId: string): AuditRowView {
  const m = rowMetrics(r)
  const band = CITY_CONDITION_BANDS.find((b) => b.band === r.cityBand)
  return {
    id: r.id,
    raw: r,
    metrics: m,
    inventoryLabel: r.inventory === 'reuse' ? 'Reuse' : r.inventory === 'recycle' ? 'Recycling' : 'Waste',
    familyLabel: r.family ? FAMILIES[r.family].label : 'Other material',
    nrmText: `${r.nrm} ${nrmLabel(r.nrm)}`,
    quantityText: r.quantity === null ? 'Not given' : `${fixed(r.quantity, Number.isInteger(r.quantity) ? 0 : 1)} ${r.unit}`.trim(),
    massText: r.massT === null ? 'Not given' : massT(r.massT),
    scoreText: m.score === null ? 'Not scored' : `${fixed(m.score * 12, 0)} of 12`,
    reusableText: m.reusableT === null ? '' : massT(m.reusableT),
    reusableShareText: r.reusableShare === null ? '' : `${percent(r.reusableShare)} of the line`,
    avoidedText: m.avoidedT === null ? '' : `${carbon(m.avoidedT)} avoided`,
    bandText: band ? `Band ${band.band}, ${band.label.toLowerCase()}` : 'No band',
    routeLabel: BROKER_ROUTE_LABELS[r.broker.route],
    statusLabel: BROKER_STATUS_LABELS[r.broker.status],
    itemHref: r.itemId ? `/app/buildings/${buildingId}/inventory/${r.itemId}` : null,
  }
}

const HAZARD_BASIS_OPTIONS: PreDemolitionView['hazardBasisOptions'] = [
  { value: 'era', label: 'From the building age' },
  { value: 'survey', label: 'From a survey' },
  { value: 'test', label: 'From a test' },
]

const REGISTER_OPTIONS: PreDemolitionView['registerOptions'] = [
  { value: 'none', label: 'None seen' },
  { value: 'seen', label: 'Asbestos register seen' },
  { value: 'refurbishment_survey', label: 'Refurbishment and demolition survey seen' },
]

function preDemolitionView(state: AppData, viewer: Viewer, a: PreDemolitionAudit, header: BuildingRef): PreDemolitionView {
  const b = state.world.buildings[a.buildingId]
  const suggested = new Set(hazardSuggestions(b.yearBuilt))
  const t = auditTotals(a.rows)
  const recoveryTarget = GLA_TARGETS.find((x) => x.id === 'cd_recovery')!.value
  const rows = a.rows.map((r) => rowView(r, a.buildingId))
  const listed = new Set(a.rows.map((r) => r.itemId).filter(Boolean))
  const canSeeItems = canCaptureIn(state, viewer.userId, a.buildingId)
  return {
    ...base(state, viewer, a, header),
    kind: 'pre_demolition',
    yearBuiltText: b.yearBuilt === null ? 'Year built not known: every hazard is screened' : `Built in ${b.yearBuilt}`,
    deskStudy: a.deskStudy,
    hazards: hazardScreen(a.hazards, b.yearBuilt).map((e) => {
      const h = HAZARDS.find((x) => x.id === e.id)!
      return { id: e.id, label: h.label, source: h.source, indicative: h.status !== 'published', suggested: suggested.has(e.id), status: e.status, statusLabel: e.status ? HAZARD_STATUS_LABELS[e.status] : 'Not screened', basis: e.basis, note: e.note }
    }),
    hazardStatusOptions: (Object.keys(HAZARD_STATUS_LABELS) as HazardStatus[]).map((value) => ({ value, label: HAZARD_STATUS_LABELS[value] })),
    hazardBasisOptions: HAZARD_BASIS_OPTIONS,
    registerOptions: REGISTER_OPTIONS,
    registerText: REGISTER_OPTIONS.find((o) => o.value === a.deskStudy.asbestosRegister)!.label,
    rows: canSeeItems ? rows : rows.map((r) => ({ ...r, itemHref: null })),
    inventories: (['reuse', 'recycle', 'waste'] as const).map((id) => ({
      id,
      label: id === 'reuse' ? 'Reuse inventory' : id === 'recycle' ? 'Recycling inventory' : 'Waste inventory',
      rows: rows.filter((r) => r.raw.inventory === id).map((r) => (canSeeItems ? r : { ...r, itemHref: null })),
      massText: massT(t.byInventory[id]),
    })),
    totalsRaw: t,
    totals: {
      totalText: massT(t.totalT),
      reusableText: massT(t.reusableT),
      reuseByMassText: t.reuseByMass === null ? 'Not worked out' : percent(t.reuseByMass),
      recoveryText: t.recoveryByWeight === null ? 'Not worked out' : percent(t.recoveryByWeight),
      avoidedText: carbon(t.avoidedT),
      recoveryMeetsTarget: t.recoveryByWeight === null ? null : t.recoveryByWeight >= recoveryTarget,
      recoveryStateText: t.recoveryByWeight !== null && t.recoveryByWeight >= recoveryTarget ? `Meets the ${fixed(recoveryTarget * 100, 0)}% target` : `Short of the ${fixed(recoveryTarget * 100, 0)}% target`,
      recoveryWarning: `The lines forecast ${t.recoveryByWeight === null ? 'no figure' : percent(t.recoveryByWeight)}, short of the London Plan's ${fixed(recoveryTarget * 100, 0)}%. Move lines from waste to recycling or reuse where an outlet exists.`,
      empty: a.rows.length === 0,
    },
    arisings: t.arisings.map((x) => ({ code: x.code, label: x.label, massText: massT(x.massT) })),
    targets: a.targets,
    targetsText: { reuse: a.targets.reuseByMass === null ? 'Not set' : percent(a.targets.reuseByMass), recovery: a.targets.recoveryByWeight === null ? 'Not set' : percent(a.targets.recoveryByWeight) },
    recoveryTargetText: `The London Plan asks for ${fixed(recoveryTarget * 100, 0)}% of construction and demolition waste to be reused, recycled or recovered, by weight.`,
    listable: listableRows(a.rows).filter((r) => awaitsListing(r, !!r.itemId && !!state.world.items[r.itemId])).length,
    importable: Object.values(state.world.items).filter((i) => i.buildingId === a.buildingId && !listed.has(i.id)).length,
    familyOptions: [{ value: '', label: 'Other material' }, ...FAMILY_IDS.map((id) => ({ value: id, label: FAMILIES[id].label }))],
    nrmOptions: NRM_CATEGORIES.map((c) => ({ value: c.code, label: `${c.code} ${c.label}` })),
    bandOptions: CITY_CONDITION_BANDS.map((x) => ({ value: x.band, label: `Band ${x.band}, ${x.label.toLowerCase()}, ${x.route}` })),
    routeOptions: (Object.keys(BROKER_ROUTE_LABELS) as BrokerRoute[]).map((value) => ({ value, label: BROKER_ROUTE_LABELS[value] })),
    brokerStatusOptions: (Object.keys(BROKER_STATUS_LABELS) as BrokerStatus[]).map((value) => ({ value, label: BROKER_STATUS_LABELS[value] })),
    familyDefaults: Object.fromEntries(FAMILY_IDS.map((id) => [id, { ...FAMILY_AUDIT_DEFAULTS[id], unit: FAMILIES[id].unitPlural }])),
  }
}

export function auditDetailView(state: AppData, viewer: Viewer, buildingId: string, auditId: string): AuditDetailView | null {
  const audit = state.audits[auditId]
  if (!audit || audit.buildingId !== buildingId || !canReadAudit(state, viewer.userId, audit)) return null
  const header = buildingHeader(state, viewer, buildingId)
  if (!header || !buildingSide(state, viewer.userId, buildingId)) return null
  return audit.kind === 'pre_redevelopment' ? preRedevelopmentView(state, viewer, audit, header) : preDemolitionView(state, viewer, audit, header)
}

/** The City of London minimums, for the reuse catalogue line on the pre-deconstruction audit. */
export const AUDIT_CITY_MINIMUM_TEXT = `The City of London asks for at least ${CITY_MINIMUMS.reuseCatalogueItems} items in the reuse catalogue, each with a condition band.`
