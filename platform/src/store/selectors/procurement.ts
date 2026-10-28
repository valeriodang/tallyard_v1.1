// The client's procurement pack (round 3, BRIEF section 15.7): the reuse objective, the supply route with who buys,
// stores, prepares, tests, insures and is liable, the clause pack, the award weightings, the schedule of reclaimed and
// new unit prices with a provisional sum, and a market consultation annex. Built from public listings and the
// project's own records. Client only.
import type { Ambition, AwardTemplateId, SupplyRoute, TargetUnit } from '../../domain/procurementTypes'
import { AMBITIONS, AWARD_TEMPLATES, CLAUSE_LIBRARY, defaultClauseIds, LEGAL_CAVEAT, RESPONSIBILITY_TASKS, REVIEW_CLAUSE_CAP, SUPPLY_ROUTE_ORDER, SUPPLY_ROUTES, type ClauseStage } from '../../domain/reference/procurement'
import { awardProblem, fillClause, priceSchedule, reuseWeight } from '../../domain/engines/procurement'
import { TEST_STATUS_LABELS } from '../../domain/reference/labels'
import * as f from '../../domain/format'
import type { AppData, Viewer } from '../types'
import { isProjectClient } from '../access'
import { projectWishlist } from '../lots'
import { packOf } from '../actions/procurement'
import { shortlistRows } from './shortlist'
import { todayOf } from './common'

const STAGE_LABELS: Record<ClauseStage, string> = { tender: 'Tender', contract: 'Contract', dismantling: 'Dismantling' }

export type ProcurementClauseRow = { id: string; title: string; stage: string; text: string; included: boolean; forRoute: boolean }

export type PriceRowView = { publicId: string; title: string; quantityText: string; reclaimedUnit: string; newUnit: string; reclaimedRange: string; newCost: string }

export type AnnexRow = { publicId: string; title: string; quantityText: string; availability: string; location: string; condition: string; testStatus: string; status: string }

export type ProcurementView = {
  canEdit: boolean
  projectName: string
  ambition: Ambition
  ambitions: { value: Ambition; label: string; text: string }[]
  unit: TargetUnit
  targetText: string
  targetPercent: string
  objective: string
  route: SupplyRoute
  routes: { value: SupplyRoute; label: string; text: string; when: string }[]
  matrix: { task: string; values: { route: SupplyRoute; value: string }[] }[]
  clauses: ProcurementClauseRow[]
  includedCount: number
  award: { template: AwardTemplateId; templates: { value: AwardTemplateId; label: string; text: string }[]; criteria: { id: string; label: string; weight: number; reuse: boolean }[]; problem: string | null; reuseText: string }
  prices: { rows: PriceRowView[]; reclaimedRange: string; reclaimedGuide: string; newCost: string; provisional: string; provisionalPercent: string; empty: boolean }
  annex: AnnexRow[]
  caveat: string
  fileBase: string
}

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function procurementView(state: AppData, viewer: Viewer, projectId: string): ProcurementView | null {
  if (!isProjectClient(state, viewer.userId, projectId)) return null
  const p = state.world.projects[projectId]
  const pack = packOf(state, projectId)
  const list = projectWishlist(state.world, projectId)
  const rows = (list ? shortlistRows(state, viewer, list, p) : []).filter((r) => r.card && r.status !== 'declined')
  const approved = rows.filter((r) => r.status === 'approved')
  const forRoute = new Set(defaultClauseIds(pack.route))
  const fill = { targetShare: pack.targetShare, unit: pack.unit, reviewCap: REVIEW_CLAUSE_CAP, provisionalShare: pack.provisionalShare }
  const schedule = priceSchedule(
    approved.map((r) => {
      const l = r.card!.listing
      return { publicId: l.publicId, title: l.title, family: l.family, units: l.quantity.value, unitLabel: l.quantity.unit, low: l.price.low, high: l.price.high, guide: l.price.guide }
    }),
    pack.provisionalShare,
  )
  const problem = awardProblem(pack.award.criteria)
  return {
    canEdit: true,
    projectName: p.name,
    ambition: pack.ambition,
    ambitions: (Object.keys(AMBITIONS) as Ambition[]).map((a) => ({ value: a, label: AMBITIONS[a].label, text: AMBITIONS[a].text })),
    unit: pack.unit,
    targetText: `${pct(pack.targetShare)} ${pack.unit === 'value' ? 'by value' : 'by mass'}`,
    targetPercent: String(Math.round(pack.targetShare * 1000) / 10),
    objective: fillClause(CLAUSE_LIBRARY.find((c) => c.id === 'objective')!.text, fill),
    route: pack.route,
    routes: SUPPLY_ROUTE_ORDER.map((r) => ({ value: r, label: SUPPLY_ROUTES[r].label, text: SUPPLY_ROUTES[r].text, when: SUPPLY_ROUTES[r].when })),
    matrix: RESPONSIBILITY_TASKS.map((t) => ({ task: t.label, values: SUPPLY_ROUTE_ORDER.map((r) => ({ route: r, value: SUPPLY_ROUTES[r].duties[t.id] })) })),
    clauses: CLAUSE_LIBRARY.map((c) => ({ id: c.id, title: c.title, stage: STAGE_LABELS[c.stage], text: fillClause(c.text, fill), included: pack.clauseIds.includes(c.id), forRoute: forRoute.has(c.id) })),
    includedCount: pack.clauseIds.length,
    award: {
      template: pack.award.template,
      templates: [...(Object.keys(AWARD_TEMPLATES) as Exclude<AwardTemplateId, 'custom'>[]).map((t) => ({ value: t as AwardTemplateId, label: AWARD_TEMPLATES[t].label, text: AWARD_TEMPLATES[t].text })), { value: 'custom' as AwardTemplateId, label: 'Your own', text: 'Weights you set yourself.' }],
      criteria: pack.award.criteria.map((c) => ({ ...c })),
      problem,
      reuseText: `Reuse carries ${reuseWeight(pack.award.criteria)} of 100 points.`,
    },
    prices: {
      rows: schedule.rows.map((r) => ({
        publicId: r.publicId,
        title: r.title,
        quantityText: f.quantity(r.units, r.unitLabel),
        reclaimedUnit: `${f.priceOnly(r.low, r.family)} to ${f.unitPrice(r.high, r.family)}`,
        newUnit: f.unitPrice(r.newPrice, r.family),
        reclaimedRange: `${f.moneyWhole(r.reclaimedLow)} to ${f.moneyWhole(r.reclaimedHigh)}`,
        newCost: f.moneyWhole(r.newCost),
      })),
      reclaimedRange: `${f.moneyWhole(schedule.reclaimedLow)} to ${f.moneyWhole(schedule.reclaimedHigh)}`,
      reclaimedGuide: f.moneyWhole(schedule.reclaimedGuide),
      newCost: f.moneyWhole(schedule.newCost),
      provisional: f.moneyWhole(schedule.provisional),
      provisionalPercent: String(Math.round(pack.provisionalShare * 1000) / 10),
      empty: schedule.rows.length === 0,
    },
    annex: rows.map((r) => {
      const c = r.card!
      return { publicId: c.publicId, title: c.title, quantityText: c.quantityText, availability: c.availabilityText, location: c.locationLabel, condition: `Grade ${c.listing.condition}`, testStatus: TEST_STATUS_LABELS[c.listing.testStatus], status: r.statusLabel }
    }),
    caveat: LEGAL_CAVEAT,
    fileBase: `${slug(p.name)}-procurement-pack-${todayOf(viewer)}`,
  }
}
