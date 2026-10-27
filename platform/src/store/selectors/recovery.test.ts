// The owner's recovery plan: suggested routes, the owner's own choices, and the plan's score against business as usual.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { itemByTag, TIVERNE_ID } from '../../domain/seed/world'
import { RECOVERY_ERRORS, setItemRoute } from '../actions/recovery'
import { ERRORS } from '../access'
import { FORBIDDEN } from '../../ui/testing'
import type { RecoveryRoute } from '../../domain/reference/recovery'

describe("the recovery plan's routes", () => {
  it('suggests reuse elsewhere for what is worth recovering, and the usual way for the rest', () => {
    const v = sel.recoveryPlanView(fresh(), viewer(U.tom), TIVERNE_ID)!
    const route = Object.fromEntries(v.rows.map((r) => [r.tag, r.route]))
    expect(route['TH-01']).toBe('reuse_off_site')
    // The precast panels and the bricks are hard to get out whole: crushed, and remade into brick.
    expect(route['TH-09']).toBe('downcycle')
    expect(route['TH-10']).toBe('recycle')
    expect(v.rows.every((r) => !r.chosen)).toBe(true)
    expect(v.options).toHaveLength(9)
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it("scores the plan above the RICS business-as-usual case and counts the reuse gain", () => {
    const v = sel.recoveryPlanView(fresh(), viewer(U.tom), TIVERNE_ID)!
    // (314.77 x 0.90 + 46.00 x 0.75 + 410.40 x 0.50) / 771.17
    expect(v.scoreText).toBe('0.68')
    expect(v.bauScoreText).toBe('0.58')
    expect(v.totalText).toBe('771.17 t')
    expect(v.reusedText).toBe('314.77 t')
    expect(v.byRoute.map((x) => [x.label, x.text])).toEqual([
      ['Reuse elsewhere', '314.77 t, 40.8%'],
      ['Recycle', '46.00 t, 6.0%'],
      ['Downcycle', '410.40 t, 53.2%'],
    ])
  })

  it("gives each family's cascade, best use first", () => {
    const v = sel.recoveryPlanView(fresh(), viewer(U.tom), TIVERNE_ID)!
    expect(v.rows.find((r) => r.tag === 'TH-01')!.cascade[0]).toBe('Relocated whole, as the same member')
  })

  it('is for the owner only', () => {
    const s = fresh()
    for (const who of [U.dana, U.priya, U.isla, U.marcus]) expect(sel.recoveryPlanView(s, viewer(who), TIVERNE_ID)).toBeNull()
  })
})

describe('choosing a route', () => {
  it('records the owner choice, rescoring the plan, and clears it back to the suggestion', () => {
    const s0 = fresh()
    const th09 = itemByTag(s0.world, 'TH-09').id
    const s1 = must(setItemRoute(s0, actor(U.tom), TIVERNE_ID, th09, 'reuse_on_site')).state
    const row = sel.recoveryPlanView(s1, viewer(U.tom), TIVERNE_ID)!.rows.find((r) => r.itemId === th09)!
    expect(row).toMatchObject({ route: 'reuse_on_site', suggested: 'downcycle', chosen: true, reuse: true, coefficientText: 'Direct reuse, 1.00' })
    // 410.40 t moves from 0.50 to 1.00: (283.29 + 34.50 + 410.40) / 771.17.
    expect(sel.recoveryPlanView(s1, viewer(U.tom), TIVERNE_ID)!.scoreText).toBe('0.94')
    const s2 = must(setItemRoute(s1, actor(U.tom), TIVERNE_ID, th09, null)).state
    expect(sel.recoveryPlanView(s2, viewer(U.tom), TIVERNE_ID)!.rows.find((r) => r.itemId === th09)!.chosen).toBe(false)
  })

  it('refuses anyone but the owner, other buildings and unknown routes', () => {
    const s = fresh()
    const th01 = itemByTag(s.world, 'TH-01').id
    refused(s, setItemRoute(s, actor(U.dana), TIVERNE_ID, th01, 'recycle'), ERRORS.noAccess)
    refused(s, setItemRoute(s, actor(U.tom), TIVERNE_ID, 'itm_missing', 'recycle'), RECOVERY_ERRORS.noItem)
    refused(s, setItemRoute(s, actor(U.tom), TIVERNE_ID, th01, 'bury' as RecoveryRoute), RECOVERY_ERRORS.route)
  })
})
