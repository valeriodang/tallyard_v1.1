// The arithmetic and the checks of the two audits (round 3, BRIEF section 15.3). Pure: the store and the screens
// call these and never compute (P2).
import type { InventoryItem, Quantity, SourceBuilding, Spec } from '../types'
import type { AuditRow, ExistingTreeAnswers, HazardEntry, HazardId, PreDemolitionAudit, PreRedevelopmentAudit, RetentionOption } from '../auditTypes'
import { EXISTING_OUTCOMES, FAMILY_AUDIT_DEFAULTS, HAZARDS, OPTION_KIND_ORDER, REUSABLE_SHARE_FROM_RECOVERABILITY, RETENTION_FACTORS, type ExistingOutcome } from '../reference/audit'
import { CITY_OFFICE_BENCHMARKS, CITY_MINIMUMS, DEMOLITION_DEFAULT_KGCO2E_M2, RETROFIT_MIN_SUPERSTRUCTURE_SHARE } from '../reference/cityOfLondon'
import { GLA_TARGETS } from '../reference/gla'
import { FAMILIES, TILE_M2, titleFor } from '../reference/families'
import { DEFAULT_ASSUMPTIONS, type Assumptions } from '../reference/assumptions'
import { carbonAvoided } from './carbon'
import { itemMeasures } from './measures'
import { streamForCode } from '../reference/wasteCodes'

export const CITY_OF_LONDON = 'City of London'

export function isCityOfLondon(b: Pick<SourceBuilding, 'localAuthority'>): boolean {
  return b.localAuthority === CITY_OF_LONDON
}

// ---------- Pre-redevelopment ----------

/** The GLA decision tree for existing buildings, as far as it has been answered. */
export function existingTreeOutcome(t: ExistingTreeAnswers): ExistingOutcome | null {
  const residual = (): ExistingOutcome | null => (t.recoverResidualValue === 'yes' ? 'disassemble_reuse' : t.recoverResidualValue === 'no' ? 'demolish_recycle' : null)
  if (t.feasibleToRetain === null) return null
  if (t.feasibleToRetain === 'no') return residual()
  if (t.suitedInWhole === 'yes') return 'retain_retrofit'
  if (t.suitedInWhole === null) return null
  if (t.suitedInPart === 'yes') return 'partial_retention'
  if (t.suitedInPart === null) return null
  return residual()
}

/** The questions that apply given the answers so far, in order. */
export function existingTreeQuestions(t: ExistingTreeAnswers): (keyof ExistingTreeAnswers)[] {
  const out: (keyof ExistingTreeAnswers)[] = ['feasibleToRetain']
  if (t.feasibleToRetain === 'no') return [...out, 'recoverResidualValue']
  if (t.feasibleToRetain !== 'yes') return out
  out.push('suitedInWhole')
  if (t.suitedInWhole !== 'no') return out
  out.push('suitedInPart')
  if (t.suitedInPart !== 'no') return out
  return [...out, 'recoverResidualValue']
}

export type OptionMetrics = {
  id: string
  /** Demolition carbon per m2 of the option's GIA, from its own figure or the 50 kgCO2e per m2 default. */
  demolitionKgM2: number | null
  demolitionIsDefault: boolean
  upfrontWithDemolitionKgM2: number | null
  wlcWithDemolitionKgM2: number | null
  /** Whole life carbon in tonnes, over the option's GIA. */
  wlcT: number | null
  /** The City's retrofit test: at least half the superstructure kept by mass. Null when the share is not given. */
  retrofit: boolean | null
}

export function optionMetrics(o: RetentionOption): OptionMetrics {
  let demolitionKgM2: number | null = o.demolitionKgM2
  let demolitionIsDefault = false
  if (demolitionKgM2 === null && o.demolishedAreaM2 !== null && o.giaM2) {
    demolitionKgM2 = (o.demolishedAreaM2 * DEMOLITION_DEFAULT_KGCO2E_M2) / o.giaM2
    demolitionIsDefault = true
  }
  const add = (x: number | null) => (x === null ? null : x + (demolitionKgM2 ?? 0))
  const wlc = add(o.wlcKgM2)
  return {
    id: o.id,
    demolitionKgM2,
    demolitionIsDefault,
    upfrontWithDemolitionKgM2: add(o.upfrontKgM2),
    wlcWithDemolitionKgM2: wlc,
    wlcT: wlc !== null && o.giaM2 ? (wlc * o.giaM2) / 1000 : null,
    retrofit: o.superstructureRetainedShare === null ? null : o.superstructureRetainedShare >= RETROFIT_MIN_SUPERSTRUCTURE_SHARE,
  }
}

/** How much an option keeps, for ordering: its superstructure share, else the order of its kind. */
function retentionRank(o: RetentionOption): number {
  return o.superstructureRetainedShare ?? 1 - OPTION_KIND_ORDER.indexOf(o.kind) / OPTION_KIND_ORDER.length
}

export type OptionsAppraisal = {
  metrics: OptionMetrics[]
  lowestWlcId: string | null
  lowestUpfrontId: string | null
  /** The preferred option keeps less than another option explored, or is not the lowest whole life carbon. */
  needsJustification: boolean
  /** Office benchmarks of the City SPD against the preferred option, when it has figures. */
  cityChecks: { id: string; label: string; limit: number; value: number; within: boolean }[]
}

export function appraiseOptions(options: RetentionOption[], preferredId: string | null): OptionsAppraisal {
  const metrics = options.map(optionMetrics)
  const lowest = (key: 'wlcWithDemolitionKgM2' | 'upfrontWithDemolitionKgM2') => {
    const xs = metrics.filter((m) => m[key] !== null)
    if (xs.length === 0) return null
    return xs.reduce((a, b) => ((b[key] as number) < (a[key] as number) ? b : a)).id
  }
  const lowestWlcId = lowest('wlcWithDemolitionKgM2')
  const lowestUpfrontId = lowest('upfrontWithDemolitionKgM2')
  const preferred = options.find((o) => o.id === preferredId) ?? null
  const keepsLess = !!preferred && options.some((o) => o.id !== preferred.id && retentionRank(o) > retentionRank(preferred))
  const needsJustification = !!preferred && (keepsLess || (lowestWlcId !== null && lowestWlcId !== preferred.id))
  const cityChecks: OptionsAppraisal['cityChecks'] = []
  const pm = preferred ? metrics.find((m) => m.id === preferred.id)! : null
  if (pm) {
    for (const b of CITY_OFFICE_BENCHMARKS) {
      const value = b.id === 'upfront_aspirational' ? pm.upfrontWithDemolitionKgM2 : b.id.startsWith('wlc') ? pm.wlcWithDemolitionKgM2 : null
      if (value !== null) cityChecks.push({ id: b.id, label: b.label, limit: b.value, value, within: value < b.value })
    }
  }
  return { metrics, lowestWlcId, lowestUpfrontId, needsJustification, cityChecks }
}

export type CheckItem = { id: string; label: string; ok: boolean; required: boolean; detail: string }

export function preRedevelopmentChecklist(a: PreRedevelopmentAudit, b: Pick<SourceBuilding, 'localAuthority'>): CheckItem[] {
  const city = isCityOfLondon(b)
  const rated = RETENTION_FACTORS.filter((f) => a.factors[f.id]?.scale).length
  const outcome = existingTreeOutcome(a.tree)
  const appraisal = appraiseOptions(a.options, a.preferredOptionId)
  const withCarbon = a.options.filter((o) => o.upfrontKgM2 !== null && o.wlcKgM2 !== null).length
  const kinds = new Set(a.options.map((o) => o.kind)).size
  return [
    { id: 'factors', label: 'Every retention factor rated', ok: rated === RETENTION_FACTORS.length, required: true, detail: `${rated} of ${RETENTION_FACTORS.length} rated` },
    { id: 'tree', label: 'The GLA decision tree answered', ok: outcome !== null, required: true, detail: outcome ? `Reaches ${EXISTING_OUTCOMES.find((o) => o.id === outcome)!.label.toLowerCase()}` : 'Not finished' },
    { id: 'options', label: city ? 'Options at different levels of intervention (City of London)' : 'At least two options compared', ok: a.options.length >= 2 && kinds >= 2, required: true, detail: `${a.options.length} ${a.options.length === 1 ? 'option' : 'options'}` },
    { id: 'carbon', label: 'Upfront and whole life carbon for every option', ok: a.options.length > 0 && withCarbon === a.options.length, required: city, detail: `${withCarbon} of ${a.options.length}` },
    { id: 'preferred', label: 'A preferred option chosen', ok: a.preferredOptionId !== null && a.options.some((o) => o.id === a.preferredOptionId), required: true, detail: '' },
    { id: 'justification', label: 'Why the preferred option keeps less, or emits more', ok: !appraisal.needsJustification || a.justification.trim().length >= 20, required: true, detail: !appraisal.needsJustification ? 'Not needed' : a.justification.trim().length >= 20 ? 'Given' : 'Needed' },
    { id: 'independence', label: 'Independence declared', ok: a.independence !== 'not_declared', required: true, detail: '' },
    { id: 'reviewer', label: city ? 'Independent third-party review (City of London)' : 'Peer review', ok: !!a.reviewer && a.reviewer.name.trim().length > 0, required: city, detail: '' },
  ]
}

// ---------- Pre-deconstruction ----------

/** Hazards suspected from the year the building was built (or last refurbished). */
export function hazardSuggestions(yearBuilt: number | null): HazardId[] {
  if (yearBuilt === null) return HAZARDS.map((h) => h.id)
  return HAZARDS.filter((h) => yearBuilt < h.before).map((h) => h.id)
}

/** The screen as stored, with an entry for every suggested hazard. */
export function hazardScreen(entries: HazardEntry[], yearBuilt: number | null): HazardEntry[] {
  const suggested = new Set(hazardSuggestions(yearBuilt))
  return HAZARDS.filter((h) => suggested.has(h.id) || entries.some((e) => e.id === h.id)).map((h) => entries.find((e) => e.id === h.id) ?? { id: h.id, status: null, basis: null, note: '' })
}

export type RowMetrics = { id: string; score: number | null; reusableT: number | null; avoidedT: number | null }

/** The carbon-factor quantity of a mass of a family: tonnes, or m2 for the families with factors per m2. */
function factorQtyFromMass(family: NonNullable<AuditRow['family']>, massT: number): number {
  const f = FAMILIES[family]
  if (f.factorBasis === 't') return massT
  const areal = f.arealDensityKgM2 ?? ((f.unitMassKg ?? 0) / (TILE_M2[family] ?? 1))
  return areal > 0 ? (massT * 1000) / areal : 0
}

export function rowMetrics(r: AuditRow, a: Assumptions = DEFAULT_ASSUMPTIONS): RowMetrics {
  const score = r.extractability !== null && r.quality !== null && r.marketValue !== null ? (r.extractability + r.quality + r.marketValue) / 12 : null
  const reusableT = r.inventory === 'reuse' && r.massT !== null && r.reusableShare !== null ? r.massT * r.reusableShare : null
  let avoidedT: number | null = null
  if (reusableT !== null && r.family) {
    const q = factorQtyFromMass(r.family, reusableT)
    avoidedT = carbonAvoided({ family: r.family, sourceType: 'deconstruction', baselineQty: q, baselineMassT: reusableT, reuseQty: q, reuseMassT: reusableT, reuseKm: a.listingKm }, a)?.avoided ?? null
  }
  return { id: r.id, score, reusableT, avoidedT }
}

export type AuditTotals = {
  totalT: number
  byInventory: Record<AuditRow['inventory'], number>
  reusableT: number
  /** Reusable mass over everything that comes out. */
  reuseByMass: number | null
  /** Reused or recycled over everything that comes out: the forecast against the 95% target. */
  recoveryByWeight: number | null
  avoidedT: number
  arisings: { code: string; label: string; massT: number }[]
}

export function auditTotals(rows: AuditRow[], a: Assumptions = DEFAULT_ASSUMPTIONS): AuditTotals {
  const byInventory: AuditTotals['byInventory'] = { reuse: 0, recycle: 0, waste: 0 }
  let reusableT = 0
  let avoidedT = 0
  const arisings = new Map<string, number>()
  for (const r of rows) {
    const m = r.massT ?? 0
    byInventory[r.inventory] += m
    const x = rowMetrics(r, a)
    reusableT += x.reusableT ?? 0
    avoidedT += x.avoidedT ?? 0
    const code = r.ewcCode.trim() || 'Not coded'
    arisings.set(code, (arisings.get(code) ?? 0) + m)
  }
  const totalT = byInventory.reuse + byInventory.recycle + byInventory.waste
  // A reuse line's share that is not reusable still leaves the site: count it with recycling.
  const recovered = byInventory.recycle + byInventory.reuse
  return {
    totalT,
    byInventory,
    reusableT,
    reuseByMass: totalT > 0 ? reusableT / totalT : null,
    recoveryByWeight: totalT > 0 ? recovered / totalT : null,
    avoidedT,
    arisings: [...arisings.entries()].map(([code, massT]) => ({ code, label: code === 'Not coded' ? 'Not coded' : (streamForCode(code)?.label ?? 'Other'), massT })).sort((x, y) => y.massT - x.massT),
  }
}

export function preDemolitionChecklist(a: PreDemolitionAudit, b: Pick<SourceBuilding, 'localAuthority' | 'yearBuilt'>): CheckItem[] {
  const city = isCityOfLondon(b)
  const reuseRows = a.rows.filter((r) => r.inventory === 'reuse')
  const reusable = reuseRows.filter((r) => (r.reusableShare ?? 0) > 0)
  const quantified = a.rows.filter((r) => r.massT !== null && r.massT > 0).length
  const carbon = reusable.filter((r) => r.family !== null).length
  const screen = hazardScreen(a.hazards, b.yearBuilt)
  const screened = screen.filter((h) => h.status !== null).length
  const routed = reusable.filter((r) => r.broker.route !== 'none').length
  const banded = reuseRows.filter((r) => r.cityBand !== null).length
  const recoveryTarget = GLA_TARGETS.find((t) => t.id === 'cd_recovery')!.value
  const items: CheckItem[] = [
    { id: 'not_waste_only', label: 'Reuse is assessed, not only waste routes', ok: reusable.length > 0, required: true, detail: `${reusable.length} reusable ${reusable.length === 1 ? 'line' : 'lines'}. An audit that only lists waste routes is not suitable` },
    { id: 'quantified', label: 'Every line has its quantity', ok: a.rows.length > 0 && quantified === a.rows.length, required: true, detail: `${quantified} of ${a.rows.length}` },
    { id: 'carbon', label: 'Embodied carbon estimated for the reusable lines', ok: reusable.length > 0 && carbon === reusable.length, required: true, detail: `${carbon} of ${reusable.length}` },
    { id: 'hazards', label: "Hazards screened for the building's age", ok: screened === screen.length, required: true, detail: `${screened} of ${screen.length}` },
    { id: 'targets', label: `Targets set, recovery at least ${recoveryTarget * 100}%`, ok: a.targets.reuseByMass !== null && a.targets.recoveryByWeight !== null && a.targets.recoveryByWeight >= recoveryTarget, required: true, detail: '' },
    { id: 'brokers', label: 'A route for every reusable line', ok: reusable.length > 0 && routed === reusable.length, required: true, detail: `${routed} of ${reusable.length}` },
    { id: 'independence', label: 'Independence declared', ok: a.independence !== 'not_declared', required: true, detail: '' },
  ]
  if (city) {
    items.push({ id: 'city_catalogue', label: `At least ${CITY_MINIMUMS.reuseCatalogueItems} reuse items catalogued (City of London)`, ok: reuseRows.length >= CITY_MINIMUMS.reuseCatalogueItems, required: true, detail: `${reuseRows.length}` })
    items.push({ id: 'city_bands', label: 'A condition band for every reuse item (City of London)', ok: reuseRows.length > 0 && banded === reuseRows.length, required: true, detail: `${banded} of ${reuseRows.length}` })
  }
  return items
}

export function checklistReady(items: CheckItem[]): boolean {
  return items.every((i) => i.ok || !i.required)
}

/** What a counted item is counted in, where the family's pricing unit is not a count. */
const PIECE_WORDS: Partial<Record<InventoryItem['family'], string>> = { steel_section: 'members', curtain_wall: 'panels' }

/** Audit lines from the surveyed inventory: reusable lines for recoverable items, recycling for the rest. */
export function rowsFromItems(items: InventoryItem[], ids: (i: InventoryItem) => string): AuditRow[] {
  return items.map((i) => {
    const m = itemMeasures(i)
    const d = FAMILY_AUDIT_DEFAULTS[i.family]
    const recoverable = i.recoverability !== 'C'
    return {
      id: ids(i),
      inventory: recoverable ? 'reuse' : 'recycle',
      description: `${i.tag}, ${titleFor(i.spec)}`,
      family: i.family,
      nrm: d.nrm,
      ewcCode: d.ewc,
      quantity: m.pieces ?? m.units,
      unit: m.pieces !== null ? (PIECE_WORDS[i.family] ?? FAMILIES[i.family].unitPlural) : FAMILIES[i.family].unitPlural,
      massT: m.massT,
      extractability: i.recoverability === 'A' ? 4 : i.recoverability === 'B' ? 3 : 1,
      quality: i.condition === 'A' ? 4 : i.condition === 'B' ? 3 : 2,
      marketValue: null,
      reusableShare: recoverable ? REUSABLE_SHARE_FROM_RECOVERABILITY[i.recoverability] : null,
      cityBand: i.condition === 'A' ? 2 : i.condition === 'B' ? 3 : 5,
      considerations: i.notes,
      broker: { route: 'none', status: 'not_offered', outlet: '' },
      itemId: i.id,
    }
  })
}

/** A draft specification for an audit line, or null for families whose sizes must be surveyed (steel, curtain wall). */
export function draftSpecFor(r: AuditRow): Spec | null {
  const lime = /lime/i.test(r.considerations)
  switch (r.family) {
    case 'raised_floor':
      return { family: 'raised_floor', panelSize: '600 by 600' }
    case 'precast_cladding':
      return { family: 'precast_cladding', thicknessMm: 150 }
    case 'stone_cladding':
      return { family: 'stone_cladding', stone: 'Portland', thicknessMm: 50 }
    case 'clay_brick':
      return { family: 'clay_brick', brickType: 'facing', mortar: lime ? 'lime mortar' : 'cement mortar' }
    case 'timber_joist':
      return { family: 'timber_joist', species: 'softwood' }
    case 'natural_slate':
      return { family: 'natural_slate', origin: 'Welsh', sizeMm: '500 by 250' }
    case 'stone_paving':
      return { family: 'stone_paving', stone: 'York', thicknessMm: 50 }
    case 'carpet_tile':
      return { family: 'carpet_tile', sizeMm: '500 by 500', backing: 'bitumen backing' }
    case 'metal_ceiling_tile':
      return { family: 'metal_ceiling_tile', sizeMm: '600 by 600', finish: 'white, perforated' }
    case 'glulam_beam':
      return { family: 'glulam_beam', strengthClass: 'GL24h', sectionMm: '400 by 140' }
    case 'hollowcore_plank':
      return { family: 'hollowcore_plank', depthMm: 200 }
    default:
      return null
  }
}

/** The quantity of a line in its family's capture unit: pieces, m2 or m3. */
export function draftQuantityFor(r: AuditRow): Quantity | null {
  if (!r.family || r.quantity === null || !(r.quantity > 0)) return null
  const kind = FAMILY_QUANTITY_KIND[r.family]
  if (kind === 'pieces') return Number.isInteger(r.quantity) ? { kind: 'pieces', pieces: r.quantity } : null
  if (kind === 'area') return { kind: 'area', areaM2: r.quantity }
  return { kind: 'volume', volumeM3: r.quantity }
}

/** The grades of a line read back as condition and recoverability, for a draft inventory item. */
export function gradesFor(r: AuditRow): { condition: 'A' | 'B' | 'C'; recoverability: 'A' | 'B' | 'C' } {
  const q = r.quality ?? 2
  const e = r.extractability ?? 1
  return { condition: q >= 4 ? 'A' : q === 3 ? 'B' : 'C', recoverability: e >= 4 ? 'A' : e === 3 ? 'B' : 'C' }
}

/** The quantity kind each family is captured in (mirrors the capture form). */
export const FAMILY_QUANTITY_KIND: Record<NonNullable<AuditRow['family']>, Quantity['kind']> = {
  steel_section: 'pieces',
  curtain_wall: 'pieces',
  precast_cladding: 'area',
  stone_cladding: 'area',
  clay_brick: 'pieces',
  raised_floor: 'pieces',
  timber_joist: 'volume',
  natural_slate: 'pieces',
  stone_paving: 'area',
  carpet_tile: 'pieces',
  metal_ceiling_tile: 'pieces',
  glulam_beam: 'volume',
  hollowcore_plank: 'area',
}

/** The reusable lines listing early acts on: everything for reuse that is not kept on site or sent to another outlet. */
export function listableRows(rows: AuditRow[]): AuditRow[] {
  return rows.filter((r) => r.inventory === 'reuse' && (r.reusableShare ?? 0) > 0 && r.broker.route !== 'reuse_on_site' && r.broker.route !== 'other_outlet')
}

/** Whether listing early would still change the line: a surveyed item not yet offered, or a line that can become a lot. */
export function awaitsListing(r: AuditRow, itemExists: boolean): boolean {
  if (r.itemId && itemExists) return r.broker.route !== 'marketplace' || r.broker.status === 'not_offered'
  return draftSpecFor(r) !== null && draftQuantityFor(r) !== null
}
