// Deal terms on a reservation (round 3, BRIEF section 15.6): the client's draft with its cost, the banded terms a seller
// reads before accepting, and the full terms both sides read after. Placeholder rates throughout.
import type { BlindTerms, DealModel, DealTerms } from '../../domain/dealTypes'
import { DEAL_MODEL_ORDER, DEAL_MODELS, DEPOSIT_SHARES, MAX_BRIDGE_MONTHS, STORAGE_PAYER_LABELS } from '../../domain/reference/deals'
import { checkTerms, defaultTerms, termsCost, type TermsBase } from '../../domain/engines/dealTerms'
import { toBlindTerms } from '../../domain/privacy/blindTerms'
import * as f from '../../domain/format'
import type { AppData, Reservation, Viewer } from '../types'
import { isProjectClient } from '../access'
import { lotByPublicId, listingOf, projectWishlist } from '../lots'
import { termsBaseFor } from '../estimate'
import { todayOf } from './common'

export type TermsRow = { label: string; value: string }

export type TermsView = {
  model: DealModel
  modelLabel: string
  rows: TermsRow[]
  /** The cost of the terms; null on the banded view a seller reads before accepting. */
  lines: { label: string; amount: number }[] | null
}

export const TERMS_CAVEAT = 'Deal terms are proposals between the two sides. The rates are placeholders, and nothing here is a contract.'

const yesNo = (x: boolean) => (x ? 'Yes' : 'No')
const pct = (x: number) => `${Math.round(x * 100)}%`

function commonRows(t: Omit<DealTerms, 'bridgeMonths'>, bridge: string): TermsRow[] {
  return [
    { label: 'Deal model', value: DEAL_MODELS[t.model].label },
    { label: 'Deposit on acceptance', value: t.depositShare === 0 ? 'None' : `${pct(t.depositShare)} of the material` },
    { label: 'Storage bridge', value: bridge },
    { label: 'Storage', value: STORAGE_PAYER_LABELS[t.storagePayer] },
    { label: 'Price lock', value: yesNo(t.priceLock) },
    { label: 'Design-change clause', value: yesNo(t.designChange) },
    { label: 'Buy-back of unused material', value: yesNo(t.buyBack) },
    { label: 'Guarantee', value: yesNo(t.guarantee) },
  ]
}

function modelRows(model: DealModel): TermsRow[] {
  const m = DEAL_MODELS[model]
  return [
    { label: 'Title', value: m.title },
    { label: 'Testing', value: m.testing },
    { label: 'Warranty', value: m.warranty },
  ]
}

/** The terms a seller reads before accepting: no costs, the bridge in bands. */
export function blindTermsView(b: BlindTerms): TermsView {
  return { model: b.model, modelLabel: DEAL_MODELS[b.model].label, rows: [...commonRows(b, b.bridgeBand), ...modelRows(b.model)], lines: null }
}

/** The full terms and their cost, for the client and, once accepted, the seller. */
export function fullTermsView(t: DealTerms, base: TermsBase): TermsView {
  const c = termsCost(t, base)
  return { model: t.model, modelLabel: DEAL_MODELS[t.model].label, rows: [...commonRows(t, t.bridgeMonths === 0 ? 'None' : f.months(t.bridgeMonths)), ...modelRows(t.model)], lines: c.lines.map((l) => ({ label: l.label, amount: l.amount })) }
}

/** What the seller may read of a request's terms: banded until they accept it. */
export function sellerTermsView(r: Reservation): TermsView | null {
  if (!r.terms) return null
  return r.status === 'accepted' ? fullTermsView(r.terms.offer, r.terms.base) : blindTermsView(toBlindTerms(r.terms.offer))
}

export type TermsDraftView = {
  terms: DealTerms
  defaults: Record<DealModel, DealTerms>
  models: { value: DealModel; label: string; text: string; disabled: boolean }[]
  depositOptions: { value: string; label: string }[]
  payerOptions: { value: string; label: string }[]
  maxBridge: number
  fitText: string
  bridgeShortText: string | null
  lines: { label: string; amount: number }[]
  modelRows: TermsRow[]
  /** The same terms as the seller will read them. */
  sellerSees: TermsRow[]
  error: string | null
  caveat: string
}

/** The client's terms as they are being chosen for a request, with their cost. Client only. */
export function termsDraftView(state: AppData, viewer: Viewer, projectId: string, wishItemId: string, draft: DealTerms | null): TermsDraftView | null {
  if (!isProjectClient(state, viewer.userId, projectId)) return null
  const item = projectWishlist(state.world, projectId)?.items.find((x) => x.id === wishItemId)
  const lot = item ? lotByPublicId(state.world, item.publicId) : null
  if (!lot) return null
  const base = termsBaseFor(listingOf(state.world, lot), state.world.projects[projectId], todayOf(viewer))
  const defaults = Object.fromEntries(DEAL_MODEL_ORDER.map((m) => [m, defaultTerms(m, base)])) as Record<DealModel, DealTerms>
  const terms = draft ?? defaults.client_driven
  const error = checkTerms(terms, base)
  const cost = error === null ? termsCost(terms, base) : null
  return {
    terms,
    defaults,
    models: DEAL_MODEL_ORDER.map((m) => ({ value: m, label: DEAL_MODELS[m].label, text: DEAL_MODELS[m].text, disabled: m === 'forward_sale' && base.availableNow })),
    depositOptions: DEPOSIT_SHARES.map((d) => ({ value: String(d), label: d === 0 ? 'No deposit' : `${pct(d)} of the material` })),
    payerOptions: Object.entries(STORAGE_PAYER_LABELS).map(([value, label]) => ({ value, label })),
    maxBridge: MAX_BRIDGE_MONTHS,
    fitText: base.fitMonths > 0 ? `The timeline check needs about ${f.months(base.fitMonths)} of storage.` : 'The timeline check needs no storage.',
    bridgeShortText: cost && cost.bridgeShortMonths > 0 ? `${f.months(cost.bridgeShortMonths)} of storage the deal does not cover.` : null,
    lines: cost ? cost.lines.map((l) => ({ label: l.label, amount: l.amount })) : [],
    modelRows: modelRows(terms.model),
    sellerSees: error === null ? blindTermsView(toBlindTerms(terms)).rows.slice(0, 8) : [],
    error,
    caveat: TERMS_CAVEAT,
  }
}
