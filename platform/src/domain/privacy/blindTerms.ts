// The only description of a buyer's proposed terms a seller sees before accepting (round 3, BRIEF section 15.6). The
// storage bridge is banded, so with the blind buyer's need-by window it says no more about the buyer's programme.
import type { BlindTerms, DealTerms } from '../dealTypes'
import { bridgeBand } from '../engines/dealTerms'

export function toBlindTerms(t: DealTerms): BlindTerms {
  return { model: t.model, depositShare: t.depositShare, storagePayer: t.storagePayer, bridgeBand: bridgeBand(t.bridgeMonths), priceLock: t.priceLock, designChange: t.designChange, buyBack: t.buyBack, guarantee: t.guarantee }
}
