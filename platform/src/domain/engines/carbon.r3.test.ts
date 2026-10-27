// The round 3 carbon rules (BRIEF section 15.2): reclaimed material counts its reprocessing only, the new product
// travels its RICS transport category, and module D never enters a project's figures.
import { describe, it, expect } from 'vitest'
import { closeTo } from '../../test/helpers'
import { DEFAULT_ASSUMPTIONS as A } from '../reference/assumptions'
import { FAMILIES, FAMILY_IDS } from '../reference/families'
import { TRANSPORT_DEFAULTS } from '../reference/rics'
import { carbonAvoided } from './carbon'
import { createSeed } from '../seed/world'

describe('round 3 carbon rules', () => {
  it('reclaimed A1 to A3 is the processing factor times the quantity, whatever the new product', () => {
    for (const f of FAMILY_IDS) {
      const k = FAMILIES[f].factorBasis === 't' ? 1 : 0.001
      const r = carbonAvoided({ family: f, sourceType: 'deconstruction', baselineQty: 10, baselineMassT: 1, reuseQty: 10, reuseMassT: 1, reuseKm: 0 }, A)!
      closeTo(r.a13Reuse, 10 * FAMILIES[f].factorReuse * k, 9)
      expect(r.a4Reuse).toBe(0)
    }
  })
  it('new product A4 follows the family transport category, with a sea leg for European and global ones', () => {
    for (const f of FAMILY_IDS) {
      const t = TRANSPORT_DEFAULTS[FAMILIES[f].newOrigin]
      const r = carbonAvoided({ family: f, sourceType: 'deconstruction', baselineQty: 1, baselineMassT: 2, reuseQty: 1, reuseMassT: 2, reuseKm: 50 }, A)!
      closeTo(r.a4New, 2 * (t.roadKm * A.road + t.seaKm * A.sea), 9)
      expect([r.newKm, r.newSeaKm]).toEqual([t.roadKm, t.seaKm])
    }
    expect(FAMILIES.curtain_wall.newOrigin).toBe('european')
  })
  it('the result has no module D figure: the benefit beyond the system boundary stays with the donor', () => {
    const r = carbonAvoided({ family: 'steel_section', sourceType: 'deconstruction', baselineQty: 1, baselineMassT: 1, reuseQty: 1, reuseMassT: 1, reuseKm: 50 }, A)!
    expect(Object.keys(r).some((k) => /moduleD|module_d|benefitD/i.test(k))).toBe(false)
    closeTo(r.avoided, r.a13New + r.a4New - r.a13Reuse - r.a4Reuse, 9)
  })
  it('the seeded deals carry exactly what the engine gives at their confirmed distances', () => {
    const w = createSeed()
    const deals = Object.values(w.projects).flatMap((p) => p.seededDeals ?? [])
    expect(deals.length).toBeGreaterThan(0)
    for (const d of deals) {
      const f = FAMILIES[d.family]
      const qty = f.factorBasis === 't' ? d.massT : d.family === 'raised_floor' ? d.quantityUnits * 0.36 : d.quantityUnits
      const km = d.hubId === 'HUB-BARK' ? 39 : 49
      const r = carbonAvoided({ family: d.family, sourceType: 'deconstruction', baselineQty: qty, baselineMassT: d.massT, reuseQty: qty, reuseMassT: d.massT, reuseKm: km }, A)!
      closeTo(d.avoidedT, r.avoided, 3)
    }
  })
})
