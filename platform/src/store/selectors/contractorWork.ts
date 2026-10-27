// The contractor's workspace, worked out for the screens (round 3, BRIEF section 15.4): the Method tab, the
// destination log with forecast against actual and the duty of care papers, the true cost of waste, and the firm's
// carrier register. Every figure comes from the engine; the screens only lay out the text given here (P2).
import type { AppData, Viewer } from '../types'
import type { Destination } from '../../domain/types'
import type { Carrier, DestinationEntry, DismantlingMethod } from '../../domain/contractorTypes'
import type { PreDemolitionAudit } from '../../domain/auditTypes'
import { DESTINATIONS, destinationLabel } from '../../domain/reference/wasteCodes'
import { FAMILIES, titleFor } from '../../domain/reference/families'
import { TRUE_COST_CASES } from '../../domain/reference/wasteCost'
import { costStreams, destinationTotals, dutyOfCareGaps, DUTY_GAP_LABELS, KEEPS_WHOLE, METHOD_LABELS, needsDutyOfCare, trueCostOfWaste, type TrueCost } from '../../domain/engines/contractorWork'
import { formatDate } from '../../domain/dates'
import { massT, money, percent } from '../../domain/format'
import { buildingSide, isBuildingContractor } from '../access'
import { workFor } from '../actions/contractorWork'
import { todayOf } from './common'
import { buildingHeader, itemQuantityText, itemsOf, type BuildingRef } from './owner'

// ---------- Method ----------

export type MethodRow = {
  itemId: string
  tag: string
  title: string
  familyLabel: string
  quantityText: string
  location: string
  /** The surveyor's grade, as a starting point. */
  recoverabilityText: string
  method: DismantlingMethod | null
  methodLabel: string
  extractability: number | null
  extractabilityText: string
  protection: string
  note: string
  /** The method breaks the item, so it cannot be reused whole. */
  breaks: boolean
  updatedText: string | null
}

export type MethodView = {
  header: BuildingRef
  rows: MethodRow[]
  methodOptions: { value: DismantlingMethod; label: string }[]
  recorded: number
  breaking: number
  empty: boolean
}

const RECOVERABILITY_TEXT: Record<'A' | 'B' | 'C', string> = { A: 'Surveyor: comes out easily (A)', B: 'Surveyor: comes out with care (B)', C: 'Surveyor: hard to recover (C)' }

export function methodView(state: AppData, viewer: Viewer, buildingId: string): MethodView | null {
  if (!isBuildingContractor(state, viewer.userId, buildingId)) return null
  const header = buildingHeader(state, viewer, buildingId)
  if (!header) return null
  const work = workFor(state, buildingId)
  const rows = itemsOf(state, buildingId).map((i): MethodRow => {
    const m = work?.methods[i.id] ?? null
    return {
      itemId: i.id,
      tag: i.tag,
      title: titleFor(i.spec),
      familyLabel: FAMILIES[i.family].label,
      quantityText: itemQuantityText(i),
      location: i.location,
      recoverabilityText: RECOVERABILITY_TEXT[i.recoverability],
      method: m?.method ?? null,
      methodLabel: m?.method ? METHOD_LABELS[m.method] : 'Not chosen',
      extractability: m?.extractability ?? null,
      extractabilityText: m?.extractability === null || m?.extractability === undefined ? 'Not scored' : `${m.extractability} of 4`,
      protection: m?.protection ?? '',
      note: m?.note ?? '',
      breaks: !!m?.method && !KEEPS_WHOLE[m.method],
      updatedText: m ? formatDate(m.updatedAt.slice(0, 10)) : null,
    }
  })
  return {
    header,
    rows,
    methodOptions: (Object.keys(METHOD_LABELS) as DismantlingMethod[]).map((value) => ({ value, label: METHOD_LABELS[value] })),
    recorded: rows.filter((r) => r.method !== null).length,
    breaking: rows.filter((r) => r.breaks).length,
    empty: rows.length === 0,
  }
}

/** How an item comes out, for the owner and the surveyor on the item's page. Null until the contractor says. */
export function itemMethodText(state: AppData, itemId: string): string | null {
  const item = state.world.items[itemId]
  if (!item) return null
  const m = workFor(state, item.buildingId)?.methods[itemId]
  if (!m || (!m.method && m.extractability === null)) return null
  const parts = [m.method ? METHOD_LABELS[m.method] : null, m.extractability !== null ? `extractability ${m.extractability} of 4` : null].filter(Boolean)
  return parts.join(', ')
}

// ---------- Destinations ----------

export type DestinationRow = {
  id: string
  raw: DestinationEntry
  description: string
  ewcCode: string
  routeLabel: string
  forecastText: string
  actualText: string
  moved: boolean
  movedText: string
  carrierText: string
  /** The receiving site and the note, in one line. */
  siteText: string
  /** Nothing about the papers is filled in yet, and the stream has not moved: they are due when it does. */
  papersDue: boolean
  /** The papers still missing on a moved stream of waste. */
  gaps: string[]
  needsPapers: boolean
  fromAudit: boolean
}

export type WasteCostView = {
  lines: { route: Destination; label: string; tonnesText: string; handlingText: string; haulageText: string; gateFeeText: string; landfillTaxText: string; totalText: string }[]
  totalExVatText: string
  vatText: string
  totalIncVatText: string
  perTonneText: string
  landfillAvoidedText: string
  /** Some tonnes were reused, so reuse kept landfill costs off the bill. */
  reuseAvoids: boolean
  empty: boolean
}

export type DestinationsView = {
  header: BuildingRef
  canWrite: boolean
  contractorName: string | null
  rows: DestinationRow[]
  byRoute: { route: Destination; label: string; forecastText: string; actualText: string; forecastT: number; actualT: number }[]
  totals: {
    forecastText: string
    actualText: string
    forecastReuseText: string
    actualReuseText: string
    forecastRecoveryText: string
    actualRecoveryText: string
    hazardousText: string
    movedText: string
    targetsText: string | null
  }
  papers: { complete: number; needed: number; text: string }
  cost: { forecast: WasteCostView; actual: WasteCostView; casesText: string }
  /** Audit lines with a mass that are not in the log yet. */
  auditForecastable: number
  hasAudit: boolean
  routeOptions: { value: Destination; label: string }[]
  carrierOptions: { value: string; label: string }[]
  empty: boolean
}

function costView(t: TrueCost): WasteCostView {
  return {
    lines: t.lines.map((l) => ({ route: l.route, label: destinationLabel(l.route), tonnesText: massT(l.tonnes), handlingText: money(l.handling), haulageText: money(l.haulage), gateFeeText: money(l.gateFee), landfillTaxText: money(l.landfillTax), totalText: money(l.total) })),
    totalExVatText: money(t.totalExVat),
    vatText: money(t.vat),
    totalIncVatText: money(t.totalIncVat),
    perTonneText: t.perTonne === null ? 'No tonnes yet' : `${money(t.perTonne)} per t`,
    landfillAvoidedText: money(t.landfillAvoidedByReuse),
    reuseAvoids: t.landfillAvoidedByReuse > 0,
    empty: t.lines.length === 0,
  }
}

const shareText = (x: number | null) => (x === null ? 'No tonnes yet' : percent(x))

function carriersOf(state: AppData, orgId: string | null): Carrier[] {
  return orgId ? (state.contractorWork.carriers[orgId] ?? []) : []
}

export function destinationsView(state: AppData, viewer: Viewer, buildingId: string): DestinationsView | null {
  const side = buildingSide(state, viewer.userId, buildingId)
  const contractor = isBuildingContractor(state, viewer.userId, buildingId)
  if (side !== 'owner' && !contractor) return null
  const header = buildingHeader(state, viewer, buildingId)
  if (!header) return null
  const b = state.world.buildings[buildingId]
  const work = workFor(state, buildingId)
  const entries = work?.destinations ?? []
  const carriers = carriersOf(state, b.contractorOrgId)
  const rows = entries.map((e): DestinationRow => {
    const c = e.carrierId ? carriers.find((x) => x.id === e.carrierId) : undefined
    return {
      id: e.id,
      raw: e,
      description: e.description,
      ewcCode: e.ewcCode,
      routeLabel: destinationLabel(e.route),
      forecastText: e.forecastT === null ? 'Not forecast' : massT(e.forecastT),
      actualText: e.actualT === null ? 'Not moved yet' : massT(e.actualT),
      moved: e.actualT !== null,
      movedText: e.movedOn ? formatDate(e.movedOn) : '',
      carrierText: c ? `${c.name}${c.registration ? `, ${c.registration}` : ''}` : 'No carrier named',
      siteText: `${e.facility || 'No receiving site named'}, ${e.transferNoteRef ? e.transferNoteRef : e.route === 'hazardous_disposal' ? 'no consignment note' : 'no transfer note'}`,
      papersDue: e.actualT === null && !c && !e.facility && !e.transferNoteRef,
      gaps: dutyOfCareGaps(e, carriers).map((g) => DUTY_GAP_LABELS[g]),
      needsPapers: needsDutyOfCare(e.route),
      fromAudit: e.auditRowId !== null,
    }
  })
  const t = destinationTotals(entries)
  const audit = Object.values(state.audits).find((x): x is PreDemolitionAudit => x.buildingId === buildingId && x.kind === 'pre_demolition')
  const logged = new Set(entries.map((e) => e.auditRowId).filter(Boolean))
  const papersNeeded = rows.filter((r) => r.moved && r.needsPapers)
  const complete = papersNeeded.filter((r) => r.gaps.length === 0).length
  const targets = audit && (audit.targets.reuseByMass !== null || audit.targets.recoveryByWeight !== null) ? `The audit's targets: reuse ${audit.targets.reuseByMass === null ? 'not set' : percent(audit.targets.reuseByMass)} by mass, reuse, recycling and recovery ${audit.targets.recoveryByWeight === null ? 'not set' : percent(audit.targets.recoveryByWeight)} by weight.` : null
  return {
    header,
    canWrite: contractor,
    contractorName: b.contractorOrgId ? (state.world.orgs[b.contractorOrgId]?.name ?? null) : null,
    rows,
    byRoute: DESTINATIONS.map((d) => ({ route: d.id, label: d.label, forecastText: massT(t.forecast[d.id]), actualText: massT(t.actual[d.id]), forecastT: t.forecast[d.id], actualT: t.actual[d.id] })).filter((x) => x.forecastT > 0 || x.actualT > 0),
    totals: {
      forecastText: massT(t.forecastT),
      actualText: massT(t.actualT),
      forecastReuseText: shareText(t.forecastReuse),
      actualReuseText: shareText(t.actualReuse),
      forecastRecoveryText: shareText(t.forecastRecovery),
      actualRecoveryText: shareText(t.actualRecovery),
      hazardousText: `${massT(t.hazardousForecastT)} forecast, ${massT(t.hazardousActualT)} moved`,
      movedText: `${t.moved} of ${entries.length} streams moved`,
      targetsText: targets,
    },
    papers: { complete, needed: papersNeeded.length, text: papersNeeded.length === 0 ? 'No waste has moved yet' : `${complete} of ${papersNeeded.length} moved streams have complete papers` },
    cost: {
      forecast: costView(trueCostOfWaste(costStreams(entries, 'forecast'))),
      actual: costView(trueCostOfWaste(costStreams(entries, 'actual'))),
      casesText: TRUE_COST_CASES.map((c) => `${c.label.charAt(0).toLowerCase()}${c.label.slice(1)}, £${c.trueCostPerM3} per m3 against £${c.skipOnlyPerM3} for the skip alone`).join('; ') + '.',
    },
    auditForecastable: audit ? audit.rows.filter((r) => r.massT !== null && r.massT > 0 && !logged.has(r.id)).length : 0,
    hasAudit: !!audit,
    routeOptions: DESTINATIONS.map((d) => ({ value: d.id, label: d.label })),
    carrierOptions: carriers.map((c) => ({ value: c.id, label: `${c.name}${c.registration ? `, ${c.registration}` : ''}` })),
    empty: entries.length === 0,
  }
}

// ---------- Carriers ----------

export type CarrierRow = { id: string; raw: Carrier; name: string; registration: string; tierLabel: string; expiresText: string; expired: boolean; inUse: number }

export type CarriersView = { rows: CarrierRow[]; empty: boolean }

/** The viewer's firm's carrier register, for a firm that works as a deconstruction contractor. */
export function carriersView(state: AppData, viewer: Viewer): CarriersView | null {
  const orgId = state.users[viewer.userId]?.orgId
  if (!orgId || !Object.values(state.world.buildings).some((b) => b.contractorOrgId === orgId && isBuildingContractor(state, viewer.userId, b.id))) return null
  const today = todayOf(viewer)
  const rows = carriersOf(state, orgId).map((c): CarrierRow => ({
    id: c.id,
    raw: c,
    name: c.name,
    registration: c.registration || 'No number',
    tierLabel: c.tier === 'upper' ? 'Upper tier' : 'Lower tier',
    expiresText: c.expiresOn ? formatDate(c.expiresOn) : 'No date',
    expired: !!c.expiresOn && c.expiresOn < today,
    inUse: Object.values(state.contractorWork.buildings).filter((w) => w.contractorOrgId === orgId).reduce((n, w) => n + w.destinations.filter((d) => d.carrierId === c.id).length, 0),
  }))
  return { rows, empty: rows.length === 0 }
}
