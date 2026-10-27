// Deal models and the terms of a reservation (round 3, BRIEF section 15.6). The four models come from the UK steel
// reuse supply chain study (literature review note 01, D10): who holds title, who tests, who stores and who carries
// the warranty. Forward sale comes from notes 04 and 05 (a London futures service, and futures valued at about half
// the original value). The rates are placeholders until the founder supplies real ones.
import type { DealModel, DealTerms, StoragePayer } from '../dealTypes'
import type { Parameter } from './assumptions'

export type DealModelInfo = { label: string; text: string; title: string; testing: string; storage: string; warranty: string }

export const DEAL_MODELS: Record<DealModel, DealModelInfo> = {
  client_driven: {
    label: 'Client-driven',
    text: 'The client buys from the donor and arranges testing, storage and delivery.',
    title: 'Client, from donor to site',
    testing: 'Client, through an accredited laboratory',
    storage: 'Client',
    warranty: 'Not settled: agree who carries indemnity before acceptance',
  },
  stockholder: {
    label: 'Stockholder',
    text: 'A stockholder buys, tests, stores and sells on. Simplest for the client.',
    title: 'Stockholder, then client on delivery',
    testing: 'Stockholder, through an accredited laboratory',
    storage: 'Stockholder',
    warranty: "Fabricator, backed by the stockholder's product liability insurance",
  },
  hybrid: {
    label: 'Hybrid',
    text: 'The client buys; a stockholder tests, stores and delivers for a fee.',
    title: 'Client',
    testing: 'Stockholder, for a fee',
    storage: 'Stockholder, for a fee',
    warranty: 'Fabricator and stockholder, as agreed',
  },
  forward_sale: {
    label: 'Forward sale',
    text: 'The client buys before the building comes down, at a price agreed now, for delivery when it is ready.',
    title: 'Passes on deconstruction',
    testing: 'As agreed, before delivery',
    storage: 'Seller until ready, then as agreed',
    warranty: 'As agreed',
  },
}

export const DEAL_MODEL_ORDER: DealModel[] = ['client_driven', 'stockholder', 'hybrid', 'forward_sale']

export const STORAGE_PAYER_LABELS: Record<StoragePayer, string> = { buyer: 'Paid by the buyer', seller: 'Paid by the seller', shared: 'Shared half and half' }

export const DEPOSIT_SHARES = [0, 0.1, 0.2, 0.3] as const

/** Storage for up to three years appears in a live London statement (note 08). */
export const MAX_BRIDGE_MONTHS = 36

/** Placeholder rates, as a share of the material price, and the share of the deposit kept on a design change. */
export const DEAL_RATES = { priceLock: 0.02, guarantee: 0.05, buyBack: 0.5, designChangeKept: 0.5 } as const

/** Bands the seller sees for the storage bridge, by the most months each covers. */
export const BRIDGE_BANDS: { upTo: number; label: string }[] = [
  { upTo: 0, label: 'No storage' },
  { upTo: 6, label: 'Up to 6 months' },
  { upTo: 12, label: '7 to 12 months' },
  { upTo: 24, label: '13 to 24 months' },
  { upTo: 36, label: '25 to 36 months' },
]

/** Each model's starting terms. The storage bridge starts at the months the timeline check gives. */
export const MODEL_DEFAULTS: Record<DealModel, Omit<DealTerms, 'model' | 'bridgeMonths'>> = {
  client_driven: { depositShare: 0.1, storagePayer: 'buyer', priceLock: false, designChange: false, buyBack: false, guarantee: false },
  stockholder: { depositShare: 0.1, storagePayer: 'seller', priceLock: false, designChange: false, buyBack: false, guarantee: true },
  hybrid: { depositShare: 0.1, storagePayer: 'buyer', priceLock: false, designChange: false, buyBack: false, guarantee: false },
  forward_sale: { depositShare: 0.2, storagePayer: 'seller', priceLock: true, designChange: true, buyBack: false, guarantee: false },
}

const SOURCE = 'Literature review notes 01, 04 and 05: the UK steel reuse supply chain study and toolkit, a London futures service'

export function dealRows(): Parameter[] {
  const g = 'Deal models and terms'
  const pct = (x: number) => String(Math.round(x * 100))
  return [
    { id: 'deal.models', group: g, label: 'Deal models', value: DEAL_MODEL_ORDER.map((m) => DEAL_MODELS[m].label).join(', '), unit: '', source: `Published: ${SOURCE}`, status: 'published' },
    { id: 'deal.deposit', group: g, label: 'Deposit options', value: DEPOSIT_SHARES.map(pct).join(', '), unit: '% of the material price', source: 'Placeholder: deposits are named in the toolkit, with no rate', status: 'placeholder' },
    { id: 'deal.bridge', group: g, label: 'Longest storage bridge', value: String(MAX_BRIDGE_MONTHS), unit: 'months', source: 'Indicative: storage for up to three years in a live London statement (note 08)', status: 'indicative' },
    { id: 'deal.priceLock', group: g, label: 'Price lock fee', value: pct(DEAL_RATES.priceLock), unit: '% of the material price', source: 'Placeholder', status: 'placeholder' },
    { id: 'deal.guarantee', group: g, label: 'Guarantee fee', value: pct(DEAL_RATES.guarantee), unit: '% of the material price', source: 'Placeholder', status: 'placeholder' },
    { id: 'deal.buyBack', group: g, label: 'Buy-back of unused material', value: pct(DEAL_RATES.buyBack), unit: '% of the price paid', source: 'Placeholder: futures valued at about 50% of the original value (note 05); a fit-out bought back at 18% after 10 years (note 06)', status: 'placeholder' },
    { id: 'deal.designChange', group: g, label: 'Deposit kept on a design change', value: pct(DEAL_RATES.designChangeKept), unit: '% of the deposit', source: 'Placeholder', status: 'placeholder' },
  ]
}
