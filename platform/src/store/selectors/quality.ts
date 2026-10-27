// Quality and assurance, worked out for the screens (round 3, BRIEF section 15.5): the quality panel on an item for
// the owner and the surveyor, what a buyer reads on a material page, the provenance pack a client receives once a
// reservation is accepted, and a project's limits on reclaimed steel. Every figure comes from the engines.
import type { AppData, Viewer } from '../types'
import type { FamilyId, InventoryItem, PublicListing, TestStatus } from '../../domain/types'
import type { AssuranceTier, ItemQuality, Processing, SteelLimits, SteelRecord, WarrantyKind, YesNoUnknown } from '../../domain/qualityTypes'
import { FAMILIES, titleFor } from '../../domain/reference/families'
import { ASSURANCE_LABELS, GRADING, hazardApplies, PROCESSING_LABELS, WARRANTY_LABELS } from '../../domain/reference/grading'
import { HAZARDS } from '../../domain/reference/audit'
import { ADMISSIBILITY_RULES, ASSESSMENT_LABELS, CONSEQUENCE_CLASSES, EXECUTION_CLASSES, PROTOCOLS, PROVENANCE_LABELS } from '../../domain/reference/steelAssessment'
import { testingCompanyById } from '../../domain/reference/testing'
import { assuranceTier, gradingVerdict, layerNeed, meetsLayerNeed, usableQuantity } from '../../domain/engines/grading'
import { admissibility, assessmentOf, checkPublic, freshSteelRecord, protocolFor, samplesNeeded, statusFrom, usableGrade } from '../../domain/engines/steelAssessment'
import { hazardSuggestions } from '../../domain/engines/audit'
import { reuseLabelSvg } from '../../domain/engines/reuseLabel'
import { itemMeasures } from '../../domain/engines/measures'
import { formatDate } from '../../domain/dates'
import { fixed, percent } from '../../domain/format'
import { buildingSide, canCaptureIn, isProjectArchitect, projectSide } from '../access'
import { acceptedReservation, lotOfItem } from '../lots'
import { itemMethodText } from './contractorWork'
import { itemQuantityText } from './owner'
import { materialHref } from '../paths'

const STATUS_TEXT: Record<TestStatus, string> = { untested: 'Untested', inspected: 'Inspected', tested: 'Tested', certified: 'CE or UKCA marked (EN 1090-2)' }
const YES_NO_UNKNOWN: { value: YesNoUnknown; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not known' },
]

// ---------- The quality panel on an item ----------

export type SteelPanel = {
  record: SteelRecord
  recorded: boolean
  provenanceOptions: { value: string; label: string }[]
  assessmentOptions: { value: string; label: string }[]
  answerOptions: { value: YesNoUnknown; label: string }[]
  questions: { id: keyof SteelRecord['admissibility']; label: string; answer: YesNoUnknown }[]
  verdictText: string
  verdict: ReturnType<typeof admissibility>['verdict']
  reasons: string[]
  protocolText: string
  groupMembers: number
  samplesText: string
  statusText: string
  gradeText: string
}

export type ItemQualityView = {
  itemId: string
  family: FamilyId
  canEdit: boolean
  lockedText: string | null
  grades: { A: string; B: string; C: string }
  conditionText: string
  checks: { id: string; label: string; done: boolean }[]
  rejects: { id: string; label: string; found: boolean }[]
  rejected: boolean
  checksText: string
  hazards: { id: string; label: string; suggested: boolean; status: 'suspected' | 'confirmed' | 'cleared' | null }[]
  yield: { share: number; recorded: boolean; text: string; source: string }
  surplusText: string
  storage: string
  processing: Processing
  processingOptions: { value: Processing; label: string }[]
  warranty: ItemQuality['warranty']
  warrantyOptions: { value: WarrantyKind; label: string }[]
  assurance: { tier: AssuranceTier; text: string; needText: string; meets: boolean }
  methodText: string | null
  steel: SteelPanel | null
  label: { svg: string; fileName: string } | null
}

/** The testing company and day of the latest results that covered the item, if any. */
function lastTest(state: AppData, item: InventoryItem): { tester: string; on: string } | null {
  const done = Object.values(state.testingRequests)
    .filter((r) => r.status === 'results' && r.itemIds.includes(item.id))
    .map((r) => ({ r, at: r.history.find((h) => h.status === 'results')?.at ?? '' }))
    .sort((x, y) => (x.at < y.at ? 1 : -1))[0]
  if (done) return { tester: testingCompanyById(done.r.companyId)?.name ?? 'The testing company', on: done.at.slice(0, 10) }
  const c = item.quality?.steel?.certificate
  return c ? { tester: c.lab, on: c.issuedOn } : null
}

function groupMembers(state: AppData, item: InventoryItem, groupId: string): number {
  return Object.values(state.world.items)
    .filter((i) => i.buildingId === item.buildingId && i.family === 'steel_section' && (i.id === item.id || i.quality?.steel?.groupId === groupId))
    .reduce((n, i) => n + (i.quantity.kind === 'pieces' ? i.quantity.pieces : 0), 0)
}

function steelPanel(state: AppData, item: InventoryItem): SteelPanel {
  const b = state.world.buildings[item.buildingId]
  const record = item.quality?.steel ?? freshSteelRecord(b.yearBuilt, item.tag)
  const a = admissibility(record.admissibility)
  const protocol = protocolFor(record.provenance)
  const members = groupMembers(state, item, record.groupId)
  const needed = samplesNeeded(protocol, members)
  const verdictText = {
    admissible: 'Admissible for reuse under SCI P427',
    conditional: 'Admissible on a condition',
    p440: 'Made before 1970: assess under SCI P440, testing every member',
    not_admissible: 'Not admissible for reuse',
    incomplete: 'Answer every question to screen it',
  }[a.verdict]
  return {
    record,
    recorded: !!item.quality?.steel,
    provenanceOptions: Object.entries(PROVENANCE_LABELS).map(([value, label]) => ({ value, label: `${value}, ${label.charAt(0).toLowerCase()}${label.slice(1)}` })),
    assessmentOptions: Object.entries(ASSESSMENT_LABELS).map(([value, label]) => ({ value, label: `${value}, ${label.charAt(0).toLowerCase()}${label.slice(1)}` })),
    answerOptions: YES_NO_UNKNOWN,
    questions: ADMISSIBILITY_RULES.map((r) => ({ id: r.id as keyof SteelRecord['admissibility'], label: QUESTION_TEXT[r.id] ?? r.label, answer: record.admissibility[r.id as keyof SteelRecord['admissibility']] })),
    verdictText,
    verdict: a.verdict,
    reasons: [...a.fails, ...a.conditions],
    protocolText: `${PROTOCOLS[protocol].label}: ${PROTOCOLS[protocol].text.charAt(0).toLowerCase()}${PROTOCOLS[protocol].text.slice(1)}`,
    groupMembers: members,
    samplesText: needed === 0 ? `No member of group ${record.groupId} needs a destructive test` : `Test ${needed} of the ${members} members in group ${record.groupId}; ${record.samplesTested} tested so far`,
    statusText: STATUS_TEXT[statusFrom(record)],
    gradeText: usableGrade(record) === 'unknown' ? 'Grade not known yet' : `Usable as ${usableGrade(record)}`,
  }
}

const QUESTION_TEXT: Record<string, string> = {
  builtAfter1970: 'Made after 1970?',
  fireExposure: 'Exposed to fire?',
  plasticDeformation: 'Any sign of plastic deformation?',
  sectionLossOver5: 'Corrosion section loss over 5% of the thickness?',
  builtUpOrSpliced: 'Built up or spliced?',
  fatigueLoading: 'Dynamically or fatigue loaded?',
  withinTolerances: 'Within EN 1090-2 tolerances, or can be straightened?',
}

export function itemQualityView(state: AppData, viewer: Viewer, buildingId: string, itemId: string): ItemQualityView | null {
  const item = state.world.items[itemId]
  if (!item || item.buildingId !== buildingId || !canCaptureIn(state, viewer.userId, buildingId)) return null
  const b = state.world.buildings[buildingId]
  const lot = lotOfItem(state.world, itemId)
  const reserved = !!lot && !!acceptedReservation(state, lot.id)
  const owner = buildingSide(state, viewer.userId, buildingId) === 'owner'
  const canEdit = !reserved && (owner || !lot || lot.visibility === 'private')
  const g = GRADING[item.family]
  const q = item.quality
  const verdict = gradingVerdict(item.family, q)
  const suggested = new Set(hazardSuggestions(b.yearBuilt).filter((h) => hazardApplies(h, item.family)))
  const share = q?.yieldShare ?? g.yieldShare
  const units = itemMeasures(item).units
  const unitWord = FAMILIES[item.family].unitPlural
  const warranty = q?.warranty ?? { kind: 'none' as const, years: null, note: '' }
  const tier = assuranceTier(item.testStatus, warranty.kind)
  const need = layerNeed(item.family)
  const tested = lastTest(state, item)
  const showLabel = (item.testStatus === 'tested' || item.testStatus === 'certified') && !!lot
  const steel = item.family === 'steel_section' ? steelPanel(state, item) : null
  return {
    itemId,
    family: item.family,
    canEdit,
    lockedText: reserved ? 'This item is reserved. Its record is fixed.' : canEdit ? null : 'Shared or published: the owner can still change this record.',
    grades: g.grades,
    conditionText: `Graded ${item.condition}: ${g.grades[item.condition]}`,
    checks: g.checks.map((c) => ({ id: c.id, label: c.label, done: q?.checks[c.id] === true })),
    rejects: g.rejects.map((r) => ({ id: r.id, label: r.label, found: (q?.rejects ?? []).includes(r.id) })),
    rejected: verdict.rejected,
    checksText: verdict.rejected ? `Fails: ${verdict.rejectLabels.join('; ')}. It cannot be offered for reuse.` : `${verdict.checksDone} of ${verdict.checksTotal} checks done`,
    hazards: HAZARDS.filter((h) => suggested.has(h.id) || q?.hazards.some((x) => x.id === h.id)).map((h) => ({ id: h.id, label: h.label, suggested: suggested.has(h.id), status: q?.hazards.find((x) => x.id === h.id)?.status ?? null })),
    yield: { share, recorded: q?.yieldShare != null, text: `${fixed(usableQuantity(units, share), Number.isInteger(units) ? 0 : 1)} of ${fixed(units, Number.isInteger(units) ? 0 : 1)} ${unitWord} expected usable (${percent(share)})`, source: q?.yieldShare != null ? 'Recorded for this item' : g.yieldSource },
    surplusText: g.surplusShare > 0 ? `Buyers order ${percent(g.surplusShare)} extra for breakage and cutting` : g.surplusSource,
    storage: g.storage,
    processing: q?.processing ?? 'as_removed',
    processingOptions: (Object.keys(PROCESSING_LABELS) as Processing[]).map((value) => ({ value, label: PROCESSING_LABELS[value] })),
    warranty,
    warrantyOptions: (Object.keys(WARRANTY_LABELS) as WarrantyKind[]).map((value) => ({ value, label: WARRANTY_LABELS[value] })),
    assurance: { tier, text: ASSURANCE_LABELS[tier], needText: `${FAMILIES[item.family].layer} asks for: ${ASSURANCE_LABELS[need].toLowerCase()}`, meets: meetsLayerNeed(need, { testStatus: item.testStatus, warranty: warranty.kind }) },
    methodText: itemMethodText(state, itemId),
    steel,
    label:
      showLabel && lot
        ? {
            svg: reuseLabelSvg({
              publicId: lot.publicId,
              title: titleFor(item.spec),
              statusText: STATUS_TEXT[item.testStatus],
              codes: item.quality?.steel ? `${item.quality.steel.provenance}, ${item.quality.steel.assessment}` : null,
              tester: tested?.tester ?? 'Not recorded',
              testedOnText: tested ? formatDate(tested.on) : 'Not recorded',
              path: materialHref(lot.publicId),
            }),
            fileName: `${lot.publicId}-tested-for-reuse.svg`,
          }
        : null,
  }
}

// ---------- What a buyer reads ----------

export type ListingQualityView = {
  assuranceText: string
  needText: string
  meets: boolean
  meetsText: string
  processingText: string
  warrantyText: string
  steelText: string | null
  hazardsText: string[]
  /** Against the steel limits of the project being checked, when it sets them. */
  steelFit: { meets: boolean; text: string; notes: string[] } | null
}

export function listingQualityView(listing: PublicListing, limits: SteelLimits | null | undefined): ListingQualityView {
  const q = listing.quality
  const need = layerNeed(listing.family)
  const steel = listing.family === 'steel_section'
  let steelFit: ListingQualityView['steelFit'] = null
  if (steel && limits) {
    const c = checkPublic(assessmentOf(q.steel, listing.testStatus), limits)
    steelFit = { meets: c.meets, text: c.meets ? `Meets the project's limits (${limits.exc}, ${limits.cc}, ${limits.grade})` : `Needs ${c.required} for the project's limits: about ${c.leadWeeks} weeks to ready for fabrication`, notes: c.notes }
  }
  return {
    assuranceText: ASSURANCE_LABELS[q.assurance],
    needText: `${FAMILIES[listing.family].layer} asks for: ${ASSURANCE_LABELS[need].toLowerCase()}`,
    meets: meetsLayerNeed(need, { testStatus: listing.testStatus, warranty: q.warranty }),
    meetsText: meetsLayerNeed(need, { testStatus: listing.testStatus, warranty: q.warranty }) ? 'This listing meets it.' : 'This listing does not meet it yet: ask the seller about testing or a warranty.',
    processingText: PROCESSING_LABELS[q.processing],
    warrantyText: WARRANTY_LABELS[q.warranty],
    steelText: q.steel ? `${q.steel.provenance}, ${PROVENANCE_LABELS[q.steel.provenance].toLowerCase()}. ${q.steel.assessment}, ${ASSESSMENT_LABELS[q.steel.assessment].toLowerCase()}` : null,
    hazardsText: q.hazards.map((id) => `${HAZARDS.find((h) => h.id === id)!.label.split(',')[0]} confirmed: dealt with before use`),
    steelFit,
  }
}

// ---------- The provenance pack ----------

export type ProvenancePackView = {
  title: string
  publicId: string
  sellerOrg: string
  identity: { label: string; value: string }[]
  donor: { label: string; value: string }[]
  steel: { label: string; value: string }[] | null
  grading: { label: string; value: string }[]
  events: { at: string; dateText: string; text: string }[]
  documents: { label: string; value: string }[]
  fileName: string
}

/**
 * The provenance pack of a reserved lot, for the client organisation once the seller has accepted: the identity
 * sheet, the donor building (the CEN technical specification needs its location in the test record), the steel
 * record, the grading, the custody events and the documents. Null for anyone else, and before acceptance.
 */
export function provenancePackView(state: AppData, viewer: Viewer, projectId: string, reservationId: string): ProvenancePackView | null {
  const r = state.reservations[reservationId]
  if (!r || r.projectId !== projectId || r.status !== 'accepted' || !r.exchanged) return null
  const p = state.world.projects[projectId]
  // The client side of the project, which may be an owner building something of its own.
  if (!p || projectSide(state, viewer.userId, projectId) !== 'client' || state.users[viewer.userId]?.orgId !== p.clientOrgId) return null
  const lot = state.world.lots[r.lotId]
  const item = lot ? state.world.items[lot.itemId] : null
  const b = item ? state.world.buildings[item.buildingId] : null
  if (!lot || !item || !b) return null
  const m = itemMeasures(item)
  const q = item.quality
  const s = q?.steel ?? null
  const events: ProvenancePackView['events'] = []
  const ev = (at: string | null | undefined, text: string) => {
    if (at) events.push({ at, dateText: formatDate(at.slice(0, 10)), text })
  }
  ev(item.capturedOn, `Captured on site by ${item.capturedBy}`)
  for (const t of Object.values(state.testingRequests).filter((x) => x.itemIds.includes(item.id))) {
    const company = testingCompanyById(t.companyId)?.name ?? 'the testing company'
    for (const h of t.history) if (h.status === 'requested' || h.status === 'booked' || h.status === 'results') ev(h.at, h.status === 'results' ? `Results recorded by ${company}` : h.status === 'booked' ? `Site visit booked with ${company}` : `Testing requested from ${company}`)
  }
  const audit = Object.values(state.audits).find((x) => x.buildingId === b.id && x.kind === 'pre_demolition' && x.rows.some((row) => row.itemId === item.id))
  if (audit) ev(audit.completedAt ?? audit.updatedAt, audit.completedAt ? 'In the completed pre-deconstruction audit' : 'In the pre-deconstruction audit, in draft')
  ev(item.contractorDatedOn, 'Removal dated by the deconstruction contractor')
  if (lot.inStock) ev(lot.inStock.since, 'Taken into stock at the collection hub')
  ev(r.decidedAt, 'Reservation accepted by the seller')
  events.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0))
  const documents: ProvenancePackView['documents'] = []
  if (s?.certificate) documents.push({ label: 'EN 10204 3.1 certificate', value: `${s.certificate.ref}, ${s.certificate.lab}, ${formatDate(s.certificate.issuedOn)}, ${s.certificate.grade}` })
  for (const t of Object.values(state.testingRequests).filter((x) => x.status === 'results' && x.itemIds.includes(item.id))) {
    const res = t.results?.find((x) => x.itemId === item.id)
    if (res) documents.push({ label: `Test results, ${testingCompanyById(t.companyId)?.name ?? 'testing company'}`, value: `${STATUS_TEXT[res.testStatus]}${res.grade ? `, ${res.grade}` : ''}${res.note ? `. ${res.note}` : ''}` })
  }
  if (audit) documents.push({ label: 'Pre-deconstruction audit', value: `By ${audit.auditorName}${audit.completedAt ? `, completed ${formatDate(audit.completedAt.slice(0, 10))}` : ', in draft'}` })
  const method = itemMethodText(state, item.id)
  const warranty = q?.warranty ?? { kind: 'none' as const, years: null, note: '' }
  return {
    title: titleFor(item.spec),
    publicId: lot.publicId,
    sellerOrg: r.exchanged.sellerOrg,
    identity: [
      { label: 'Public ID', value: lot.publicId },
      { label: "Seller's tag", value: item.tag },
      { label: 'Material', value: `${FAMILIES[item.family].label}, ${titleFor(item.spec)}` },
      { label: 'Quantity', value: itemQuantityText(item) },
      { label: 'Mass', value: `${fixed(m.massT, 2)} t` },
      { label: 'Condition', value: item.condition },
      { label: 'Test status', value: STATUS_TEXT[item.testStatus] },
      ...(item.family === 'steel_section' ? [{ label: 'Grade', value: item.grade ?? 'unknown' }] : []),
    ],
    donor: [
      { label: 'Building', value: b.name },
      { label: 'Address', value: b.address },
      { label: 'Local authority', value: b.localAuthority },
      { label: 'Built', value: b.yearBuilt === null ? 'Year not known' : String(b.yearBuilt) },
      { label: 'Location in the building', value: item.location || 'Not recorded' },
    ],
    steel: s
      ? [
          { label: 'Provenance', value: `${s.provenance}, ${PROVENANCE_LABELS[s.provenance].toLowerCase()}` },
          { label: 'Assessment', value: `${s.assessment}, ${ASSESSMENT_LABELS[s.assessment].toLowerCase()}` },
          { label: 'Protocol', value: PROTOCOLS[protocolFor(s.provenance)].label },
          { label: 'Group', value: `${s.groupId}, ${s.samplesTested} members tested` },
          { label: 'Admissibility', value: (() => { const a = admissibility(s.admissibility); return a.verdict === 'admissible' ? 'Admissible under SCI P427' : [a.verdict, ...a.fails, ...a.conditions].join('; ') })() },
        ]
      : null,
    grading: [
      { label: 'Checks', value: (() => { const v = gradingVerdict(item.family, q); return `${v.checksDone} of ${v.checksTotal} done` })() },
      { label: 'Hazards', value: (q?.hazards ?? []).length === 0 ? 'None recorded' : q!.hazards.map((h) => `${HAZARDS.find((x) => x.id === h.id)!.label.split(',')[0]}, ${h.status}`).join('; ') },
      { label: 'Processing', value: PROCESSING_LABELS[q?.processing ?? 'as_removed'] },
      { label: 'Warranty', value: warranty.kind === 'none' ? 'None' : `${WARRANTY_LABELS[warranty.kind]}${warranty.years ? `, ${warranty.years} years` : ''}` },
      { label: 'How it comes out', value: method ?? 'Not recorded' },
      { label: 'Storage', value: GRADING[item.family].storage },
    ],
    events,
    documents,
    fileName: `${lot.publicId}-provenance-pack`,
  }
}

// ---------- A project's steel limits ----------

export type SteelLimitsView = {
  limits: SteelLimits | null
  canEdit: boolean
  text: string
  excOptions: { value: string; label: string }[]
  ccOptions: { value: string; label: string }[]
  gradeOptions: { value: string; label: string }[]
}

export function steelLimitsView(state: AppData, viewer: Viewer, projectId: string): SteelLimitsView | null {
  const p = state.world.projects[projectId]
  if (!p || !projectSide(state, viewer.userId, projectId)) return null
  const limits = p.steelLimits ?? null
  return {
    limits,
    canEdit: isProjectArchitect(state, viewer.userId, projectId),
    text: limits ? `${limits.exc}, ${limits.cc}, up to ${limits.grade}${limits.fatigue ? ', fatigue loading' : ''}${limits.seismic ? ', seismic design' : ''}` : 'Not set: steel listings show no testing need',
    excOptions: EXECUTION_CLASSES.map((x) => ({ value: x, label: x })),
    ccOptions: CONSEQUENCE_CLASSES.map((x) => ({ value: x, label: x })),
    gradeOptions: [
      { value: 'S275', label: 'S275' },
      { value: 'S355', label: 'S355' },
    ],
  }
}
