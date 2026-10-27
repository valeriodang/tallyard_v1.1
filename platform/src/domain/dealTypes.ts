// Deal models and terms (round 3, BRIEF section 15.6). The client proposes terms with a reservation request; the
// seller sees them banded until accepting. Every rate is a labelled placeholder.

export type DealModel = 'client_driven' | 'stockholder' | 'hybrid' | 'forward_sale'

export type StoragePayer = 'buyer' | 'seller' | 'shared'

export type DealTerms = {
  model: DealModel
  /** Share of the material price paid when the seller accepts, from `DEPOSIT_SHARES`. */
  depositShare: number
  storagePayer: StoragePayer
  /** Whole months of storage the deal covers before delivery, 0 to `MAX_BRIDGE_MONTHS`. */
  bridgeMonths: number
  /** The price is held from acceptance to delivery, for a fee. */
  priceLock: boolean
  /** If the design changes before delivery, the client may release the lot and the seller keeps part of the deposit. */
  designChange: boolean
  /** The seller buys back material the project does not use. */
  buyBack: boolean
  /** The seller or its stockholder guarantees the material's stated properties, for a fee. */
  guarantee: boolean
}

/** What a seller sees of the terms before accepting: the storage bridge in bands, so the need-by date stays a window. */
export type BlindTerms = Omit<DealTerms, 'bridgeMonths'> & { bridgeBand: string }
