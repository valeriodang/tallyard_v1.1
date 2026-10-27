// Deal terms: each model's defaults, the cost of the terms, the checks, and the bands a seller sees.
import { describe, expect, it } from 'vitest'
import { bridgeBand, checkTerms, defaultTerms, termsCost, TERMS_ERRORS, type TermsBase } from './dealTerms'
import { toBlindTerms } from '../privacy/blindTerms'
import { DEAL_MODEL_ORDER } from '../reference/deals'

const base: TermsBase = { material: 10000, storagePerMonth: 120.5, fitMonths: 13, availableNow: false }

describe('defaults', () => {
  it('starts the bridge at the months the timeline gives, up to three years', () => {
    expect(defaultTerms('client_driven', base)).toEqual({ model: 'client_driven', depositShare: 0.1, storagePayer: 'buyer', bridgeMonths: 13, priceLock: false, designChange: false, buyBack: false, guarantee: false })
    expect(defaultTerms('client_driven', { ...base, fitMonths: 40 }).bridgeMonths).toBe(36)
    for (const m of DEAL_MODEL_ORDER) expect(checkTerms(defaultTerms(m, base), base), m).toBeNull()
  })

  it('has the stockholder store and guarantee, and the forward sale lock the price', () => {
    expect(defaultTerms('stockholder', base)).toMatchObject({ storagePayer: 'seller', guarantee: true })
    expect(defaultTerms('forward_sale', base)).toMatchObject({ depositShare: 0.2, storagePayer: 'seller', priceLock: true, designChange: true })
  })
})

describe('the cost of the terms', () => {
  it('costs the deposit and a storage bridge the buyer pays', () => {
    const c = termsCost(defaultTerms('client_driven', base), base)
    expect(c).toMatchObject({ depositDue: 1000, storageCost: 1566.5, buyerStorage: 1566.5, sellerStorage: 0, buyerExtra: 1566.5, bridgeShortMonths: 0 })
    expect(c.lines.map((l) => [l.label, l.amount])).toEqual([
      ['Deposit on acceptance, 10% of the material', 1000],
      ['Storage bridge, 13 months, paid by the buyer', 1566.5],
    ])
  })

  it('splits shared storage to the penny', () => {
    const c = termsCost({ ...defaultTerms('client_driven', base), storagePayer: 'shared', bridgeMonths: 3 }, base)
    // 361.50 in all: 180.75 each.
    expect([c.buyerStorage, c.sellerStorage]).toEqual([180.75, 180.75])
  })

  it('costs a forward sale: price lock, and the deposit kept if the design changes', () => {
    const c = termsCost({ ...defaultTerms('forward_sale', base), buyBack: true }, base)
    expect(c).toMatchObject({ depositDue: 2000, priceLockFee: 200, designChangeKept: 1000, buyBackValue: 5000, buyerStorage: 0, sellerStorage: 1566.5, buyerExtra: 200 })
  })

  it('counts the months the bridge leaves uncovered', () => {
    expect(termsCost({ ...defaultTerms('hybrid', base), bridgeMonths: 9 }, base).bridgeShortMonths).toBe(4)
  })
})

describe('checks', () => {
  it('refuses a forward sale of a lot available now, and bad values', () => {
    const now = { ...base, availableNow: true }
    expect(checkTerms(defaultTerms('forward_sale', base), now)).toBe(TERMS_ERRORS.forward)
    expect(checkTerms({ ...defaultTerms('hybrid', base), bridgeMonths: 37 }, base)).toBe(TERMS_ERRORS.bridge)
    expect(checkTerms({ ...defaultTerms('hybrid', base), bridgeMonths: 2.5 }, base)).toBe(TERMS_ERRORS.bridge)
    expect(checkTerms({ ...defaultTerms('hybrid', base), depositShare: 0.15 }, base)).toBe(TERMS_ERRORS.deposit)
    expect(checkTerms({ ...defaultTerms('hybrid', base), depositShare: 0, designChange: true }, base)).toBe(TERMS_ERRORS.designChange)
  })
})

describe('what the seller sees', () => {
  it('bands the storage bridge and keeps every other term', () => {
    expect([0, 1, 6, 7, 12, 13, 24, 25, 36].map(bridgeBand)).toEqual(['No storage', 'Up to 6 months', 'Up to 6 months', '7 to 12 months', '7 to 12 months', '13 to 24 months', '13 to 24 months', '25 to 36 months', '25 to 36 months'])
    const b = toBlindTerms({ ...defaultTerms('hybrid', base), bridgeMonths: 9 })
    expect(Object.keys(b).sort()).toEqual(['bridgeBand', 'buyBack', 'depositShare', 'designChange', 'guarantee', 'model', 'priceLock', 'storagePayer'])
    expect(b.bridgeBand).toBe('7 to 12 months')
  })
})
