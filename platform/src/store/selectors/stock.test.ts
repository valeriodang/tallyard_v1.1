// Design from stock: the architect's schedule, the matching settings and what the match reads.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID, SALLOW_ID } from '../../domain/seed/world'
import { clearSteelSchedule, loadSteelSchedule, saveStockMatch, STOCK_ERRORS } from '../actions/stock'
import { SCHEDULE_ERRORS } from '../../domain/engines/schedule'
import { ERRORS } from '../access'
import { FORBIDDEN } from '../../ui/testing'

describe("Merrowgate Wharf's schedule against stock", () => {
  it('matches 96 of the 102 members, as the worked example does', () => {
    const v = sel.stockMatchView(fresh(), viewer(U.priya), MERROWGATE_ID)!
    expect(v.schedule).toMatchObject({ lines: 6, members: 102, requiredMassText: '54.98 t' })
    expect(v.summary).toMatchObject({ matchedText: '96 of 102', coverageText: '94.1%', stockMassText: '51.30 t', offcutText: '3.29 t', returnText: null, avoidedText: '79.9 tCO2e' })
    expect(v.lines.find((l) => l.ref === 'R5')).toMatchObject({ matchedText: '0 of 6', tone: 'danger', reason: 'No stock long enough (longest visible in this serial size is 9.5 m)' })
    expect(v.lines.find((l) => l.ref === 'R1')!.allocations.map((a) => [a.publicId, a.piecesText, a.offcutText, a.storageText])).toEqual([
      ['L-9F4CQQ', '48 pieces', '0.30 m offcut', 'Storage 13 to 16 months'],
      ['L-NHZ32R', '4 pieces', '1.80 m offcut', 'Storage 19 months'],
    ])
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it('reports the excess of each piece once the rule is on, none over 30% here', () => {
    const s = must(saveStockMatch(fresh(), actor(U.priya), MERROWGATE_ID, { excessRule: true })).state
    const v = sel.stockMatchView(s, viewer(U.priya), MERROWGATE_ID)!
    expect(v.settings.excessRule).toBe(true)
    expect(v.lines.find((l) => l.ref === 'R4')!.allocations[0].excessText).toBe('18.5% excess')
    expect(v.lines.flatMap((l) => l.allocations).some((a) => a.excessHigh)).toBe(false)
    expect(v.summary!.matchedText).toBe('96 of 102')
  })

  it('splits offcuts into back to stock and scrap once cutting is on', () => {
    const s = must(saveStockMatch(fresh(), actor(U.priya), MERROWGATE_ID, { cutToLength: true })).state
    expect(sel.stockMatchView(s, viewer(U.priya), MERROWGATE_ID)!.summary).toMatchObject({ returnText: '0.00 t', scrapText: '3.29 t' })
  })

  it('lists the steel in stock by serial size', () => {
    const v = sel.stockMatchView(fresh(), viewer(U.priya), MERROWGATE_ID)!
    const ub457 = v.stock.find((g) => g.serial === 'UB 457x191')!
    expect(ub457.pieces).toBe(74)
    expect(ub457.rows.map((r) => [r.publicId, r.lengthText, r.gradeText, r.availabilityText])).toEqual([
      ['L-6DN4K3', '8.0 m', 'S355', 'November 2026'],
      ['L-9F4CQQ', '7.5 m', 'Grade not known', 'Q1 2027'],
      ['L-NHZ32R', '9.0 m', 'S355', 'Available now'],
    ])
  })

  it('is for the architect only', () => {
    const s = fresh()
    for (const who of [U.isla, U.marcus, U.tom, U.dana]) expect(sel.stockMatchView(s, viewer(who), MERROWGATE_ID)).toBeNull()
  })
})

describe('loading a schedule', () => {
  it('loads the sample onto a project with none, and clears it', () => {
    const s0 = fresh()
    expect(sel.stockMatchView(s0, viewer(U.priya), SALLOW_ID)!.schedule).toBeNull()
    const r = must(loadSteelSchedule(s0, actor(U.priya), SALLOW_ID, null, null))
    expect(r.value).toBe(6)
    const v = sel.stockMatchView(r.state, viewer(U.priya), SALLOW_ID)!
    expect(v.schedule).toMatchObject({ fileName: 'Sample schedule', loadedText: 'Loaded 8 October 2026', members: 102 })
    expect(r.state.world.projects[SALLOW_ID].requirements.every((q) => q.needBy === r.state.world.projects[SALLOW_ID].keyDates.steelNeedBy)).toBe(true)
    const s2 = must(clearSteelSchedule(r.state, actor(U.priya), SALLOW_ID)).state
    expect(sel.stockMatchView(s2, viewer(U.priya), SALLOW_ID)!.schedule).toBeNull()
  })

  it('loads a CSV file and names the line to fix when one is wrong', () => {
    const s = fresh()
    const ok = must(loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 305x165x40,4200,6,S275\n', 'level 2 beams.csv'))
    expect(ok.state.world.projects[SALLOW_ID].requirements).toEqual([{ ref: 'B1', designation: 'UB 305x165x40', lengthM: 4.2, count: 6, minGrade: 'S275', needBy: ok.state.world.projects[SALLOW_ID].keyDates.steelNeedBy }])
    refused(s, loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 999x1x1,4200,6,S275\n', 'a.csv'), SCHEDULE_ERRORS.section(2, 'UB 999x1x1'))
    refused(s, loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 305x165x40,4200,0,S275\n', 'a.csv'), SCHEDULE_ERRORS.count(2))
    refused(s, loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 305x165x40,long,2,S275\n', 'a.csv'), SCHEDULE_ERRORS.length(2))
    refused(s, loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 305x165x40,4200,2,S275\nB1,UB 305x165x40,4000,2,S275\n', 'a.csv'), SCHEDULE_ERRORS.mark(3))
    refused(s, loadSteelSchedule(s, actor(U.priya), SALLOW_ID, 'Mark,Section\n', 'a.csv'), SCHEDULE_ERRORS.empty)
  })

  it('refuses anyone but the architect, and an offcut out of range', () => {
    const s = fresh()
    refused(s, loadSteelSchedule(s, actor(U.isla), MERROWGATE_ID, null, null), ERRORS.role)
    refused(s, saveStockMatch(s, actor(U.marcus), MERROWGATE_ID, { cutToLength: true }), ERRORS.role)
    refused(s, saveStockMatch(s, actor(U.priya), MERROWGATE_ID, { minOffcutM: 0.1 }), STOCK_ERRORS.offcut)
  })
})
