// Design from stock (round 3, BRIEF section 15.6): the matcher's cut-to-length, offcut and excess options. With none
// set, one stock piece serves one member, as before.
import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS as A } from '../reference/assumptions'
import { DEMO_TODAY } from '../constants'
import { createSeed, MERROWGATE_ID } from '../seed/world'
import { listingsVisibleToProject } from '../visibility'
import { sectionOrThrow } from '../reference/sections'
import { matchSchedule, MATCH_REASONS, type MatchOptions } from './matcher'
import type { PublicListing, Requirement, SteelGrade } from '../types'

const w = createSeed()
const merrowgate = { ...w.projects[MERROWGATE_ID], termsAccepted: true }
const base = listingsVisibleToProject(w, merrowgate, A).find((l) => l.family === 'steel_section')!
const UB67 = 'UB 457x191x67'
const kg = sectionOrThrow(UB67).massKgM

function stock(publicId: string, lengthM: number, pieces: number, designation = UB67, grade: SteelGrade = 'S355'): PublicListing {
  return { ...base, publicId, status: 'Available', availability: { kind: 'now' }, grade, spec: { ...base.spec, designation, lengthM } as PublicListing['spec'], quantity: { ...base.quantity, pieces, value: pieces } }
}

function req(ref: string, lengthM: number, count: number, designation = UB67): Requirement {
  return { ref, designation, lengthM, count, minGrade: 'S275', needBy: '2028-04-03' }
}

const run = (reqs: Requirement[], listings: PublicListing[], options: MatchOptions = {}) => matchSchedule(reqs, listings, DEMO_TODAY, A, options)

describe('cut to length', () => {
  const listings = [stock('L-AAAA01', 12.0, 4)]
  const reqs = [req('R1', 5.5, 8)]

  it('is off by default: one 12 m piece serves one 5.5 m member', () => {
    const r = run(reqs, listings)
    expect(r.matched).toBe(4)
    expect(r.results[0].allocations).toEqual([{ publicId: 'L-AAAA01', pieces: 4, overSpecKgM: 0, offcutM: 6.5, gradeFlag: false, storageMin: 19, storageMax: 19 }])
    expect(r.offcutReturnT).toBeUndefined()
  })

  it('cuts two members from each piece when allowed, leaving a 1 m offcut', () => {
    const r = run(reqs, listings, { cutToLength: true })
    expect(r.matched).toBe(8)
    expect(r.results[0].allocations).toEqual([{ publicId: 'L-AAAA01', pieces: 4, overSpecKgM: 0, offcutM: 1, gradeFlag: false, storageMin: 19, storageMax: 19, membersPerPiece: 2, fromOffcut: false, excessShare: 1 - 11 / 12 }])
    expect(r.stockMassT).toBeCloseTo((4 * 12 * kg) / 1000, 10)
    expect(r.offcutMassT).toBeCloseTo((4 * 1 * kg) / 1000, 10)
  })

  it('cuts a last piece for the members left over', () => {
    const r = run([req('R1', 5.5, 5)], [stock('L-AAAA01', 12.0, 3)], { cutToLength: true })
    expect(r.results[0].allocations.map((a) => [a.pieces, a.membersPerPiece, a.offcutM])).toEqual([
      [2, 2, 1],
      [1, 1, 6.5],
    ])
  })
})

describe('offcuts back to stock', () => {
  it('serves a shorter line from the offcuts of a longer one, before cutting a new piece', () => {
    const r = run([req('R1', 7.5, 3), req('R2', 4.0, 2)], [stock('L-AAAA01', 12.0, 5)], { cutToLength: true, minOffcutM: 3 })
    const r2 = r.results.find((x) => x.ref === 'R2')!
    expect(r2.allocations.map((a) => [a.pieces, a.fromOffcut, a.offcutM])).toEqual([[2, true, 0.5]])
    // Three pieces bought; two 4.5 m offcuts used for R2, one left over and back in stock; two 0.5 m ends are scrap.
    expect(r.stockMassT).toBeCloseTo((3 * 12 * kg) / 1000, 10)
    expect(r.offcutMassT).toBeCloseTo(((36 - 22.5 - 8) * kg) / 1000, 10)
    expect(r.offcutReturnT).toBeCloseTo((4.5 * kg) / 1000, 10)
    expect(r.offcutScrapT).toBeCloseTo((1.0 * kg) / 1000, 10)
  })

  it('scraps offcuts shorter than the minimum', () => {
    const r = run([req('R1', 7.5, 3), req('R2', 4.0, 2)], [stock('L-AAAA01', 12.0, 5)], { cutToLength: true, minOffcutM: 5 })
    const r2 = r.results.find((x) => x.ref === 'R2')!
    expect(r2.allocations.every((a) => !a.fromOffcut)).toBe(true)
    expect(r.offcutReturnT).toBe(0)
  })
})

describe('the excess rule', () => {
  const reqs = [req('R1', 7.2, 2)]
  const listings = [stock('L-AAAA01', 12.0, 2)]

  it('passes over a piece that would be more than 30% excess', () => {
    expect(run(reqs, listings).matched).toBe(2)
    const r = run(reqs, listings, { maxExcessShare: 0.3 })
    expect(r.matched).toBe(0)
    expect(r.results[0].reason).toBe(MATCH_REASONS.excess(0.3))
    expect(r.results[0].reason).toBe('All stock in time would be more than 30% excess')
  })

  it('counts a heavier section as excess too, and reports the share', () => {
    const r = run(reqs, [stock('L-AAAA02', 7.4, 2, 'UB 457x191x82')], { maxExcessShare: 0.3 })
    expect(r.matched).toBe(2)
    expect(r.results[0].allocations[0].excessShare).toBeCloseTo(1 - (7.2 * kg) / (7.4 * 82.0), 10)
  })

  it('leaves the seeded schedule as it was with no option set', () => {
    const listingsMg = listingsVisibleToProject(w, merrowgate, A)
    expect(run(merrowgate.requirements, listingsMg, {})).toEqual(run(merrowgate.requirements, listingsMg))
    expect(run(merrowgate.requirements, listingsMg, { cutToLength: false }).matched).toBe(run(merrowgate.requirements, listingsMg).matched)
  })
})
