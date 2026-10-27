// The cost of a reservation's terms (round 3, BRIEF section 15.6): the deposit due on acceptance, the storage bridge and
// who pays it, the price lock and guarantee fees, the most a buy-back returns and the deposit kept on a design change.
// Pure: amounts are rounded to pence as each is made.
import type { CostLine } from '../types'
import type { DealModel, DealTerms } from '../dealTypes'
import { BRIDGE_BANDS, DEAL_MODELS, DEAL_RATES, DEPOSIT_SHARES, MAX_BRIDGE_MONTHS, MODEL_DEFAULTS, STORAGE_PAYER_LABELS } from '../reference/deals'
import { roundPence } from '../money'

/** What the terms are costed on: the material at the guide price, storage per month at the hub, and the timeline check. */
export type TermsBase = { material: number; storagePerMonth: number; fitMonths: number; availableNow: boolean }

export const TERMS_ERRORS = {
  model: 'Choose a deal model.',
  deposit: 'Choose a deposit from the list.',
  payer: 'Choose who pays for storage.',
  bridge: `Give the storage bridge in whole months, from 0 to ${MAX_BRIDGE_MONTHS}.`,
  forward: 'A forward sale is for material not yet out of the building. This lot is available now.',
  designChange: 'A design-change clause needs a deposit to release.',
} as const

export function defaultTerms(model: DealModel, base: TermsBase): DealTerms {
  return { model, ...MODEL_DEFAULTS[model], bridgeMonths: Math.min(Math.max(0, base.fitMonths), MAX_BRIDGE_MONTHS) }
}

/** The first problem with the terms, or null. */
export function checkTerms(t: DealTerms, base: TermsBase): string | null {
  if (!(t.model in DEAL_MODELS)) return TERMS_ERRORS.model
  if (!DEPOSIT_SHARES.some((d) => d === t.depositShare)) return TERMS_ERRORS.deposit
  if (!(t.storagePayer in STORAGE_PAYER_LABELS)) return TERMS_ERRORS.payer
  if (!Number.isInteger(t.bridgeMonths) || t.bridgeMonths < 0 || t.bridgeMonths > MAX_BRIDGE_MONTHS) return TERMS_ERRORS.bridge
  if (t.model === 'forward_sale' && base.availableNow) return TERMS_ERRORS.forward
  if (t.designChange && t.depositShare === 0) return TERMS_ERRORS.designChange
  for (const k of ['priceLock', 'designChange', 'buyBack', 'guarantee'] as const) if (typeof t[k] !== 'boolean') return TERMS_ERRORS.model
  return null
}

export type TermsCost = {
  depositDue: number
  storageCost: number
  buyerStorage: number
  sellerStorage: number
  priceLockFee: number
  guaranteeFee: number
  /** The most the seller pays back for unused material, when the deal has a buy-back. */
  buyBackValue: number
  /** The deposit the seller keeps if the client releases the lot after a design change. */
  designChangeKept: number
  /** Months the timeline needs beyond the bridge: storage the deal does not cover. */
  bridgeShortMonths: number
  /** The buyer's extra cost over the material: their storage and the fees. */
  buyerExtra: number
  lines: CostLine[]
}

export function termsCost(t: DealTerms, base: TermsBase): TermsCost {
  const depositDue = roundPence(base.material * t.depositShare)
  const storageCost = roundPence(base.storagePerMonth * t.bridgeMonths)
  const buyerStorage = t.storagePayer === 'buyer' ? storageCost : t.storagePayer === 'shared' ? roundPence(storageCost / 2) : 0
  const sellerStorage = roundPence(storageCost - buyerStorage)
  const priceLockFee = t.priceLock ? roundPence(base.material * DEAL_RATES.priceLock) : 0
  const guaranteeFee = t.guarantee ? roundPence(base.material * DEAL_RATES.guarantee) : 0
  const buyBackValue = t.buyBack ? roundPence(base.material * DEAL_RATES.buyBack) : 0
  const designChangeKept = t.designChange ? roundPence(depositDue * DEAL_RATES.designChangeKept) : 0
  const months = `${t.bridgeMonths} ${t.bridgeMonths === 1 ? 'month' : 'months'}`
  const lines: CostLine[] = [{ id: 'deposit', label: `Deposit on acceptance, ${Math.round(t.depositShare * 100)}% of the material`, amount: depositDue }]
  if (t.bridgeMonths > 0) lines.push({ id: 'bridge', label: `Storage bridge, ${months}, ${STORAGE_PAYER_LABELS[t.storagePayer].toLowerCase()}`, amount: storageCost })
  if (t.priceLock) lines.push({ id: 'priceLock', label: 'Price lock fee', amount: priceLockFee })
  if (t.guarantee) lines.push({ id: 'guarantee', label: 'Guarantee fee', amount: guaranteeFee })
  if (t.buyBack) lines.push({ id: 'buyBack', label: 'Buy-back of unused material, up to', amount: buyBackValue })
  if (t.designChange) lines.push({ id: 'designChange', label: 'Deposit kept by the seller on a design change', amount: designChangeKept })
  return {
    depositDue,
    storageCost,
    buyerStorage,
    sellerStorage,
    priceLockFee,
    guaranteeFee,
    buyBackValue,
    designChangeKept,
    bridgeShortMonths: Math.max(0, base.fitMonths - t.bridgeMonths),
    buyerExtra: roundPence(buyerStorage + priceLockFee + guaranteeFee),
    lines,
  }
}

/** The band a storage bridge falls in. */
export function bridgeBand(months: number): string {
  return (BRIDGE_BANDS.find((b) => months <= b.upTo) ?? BRIDGE_BANDS[BRIDGE_BANDS.length - 1]).label
}
