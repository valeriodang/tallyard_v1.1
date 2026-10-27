// @vitest-environment jsdom
// The recovery plan's routes through the real router (round 3, stage 5): the owner changes an item's route, sees the
// score move, opens the cascade, and goes back to the suggestion.
import { describe, expect, it } from 'vitest'
import { byTestId, click } from '../../ui/testing'
import { getData } from '../../store/app'
import { itemByTag, TIVERNE_ID } from '../../domain/seed/world'
import { U } from '../../test/fixtures'
import { chooseOption, expectClean, openAs, q, setupScreenHarness, waitFor } from './screenHarness'

setupScreenHarness()

describe('the routes on the recovery plan', () => {
  it('lets the owner keep the precast panels for reuse on site, and undo it', async () => {
    openAs(`/app/buildings/${TIVERNE_ID}/priorities`, U.tom)
    await waitFor(() => q('route-plan'))
    expect(byTestId('route-score').textContent).toContain('0.68')
    chooseOption(byTestId('route-select-TH-09'), 'reuse_on_site')
    const th09 = itemByTag(getData().world, 'TH-09').id
    await waitFor(() => getData().recoveryPlans[TIVERNE_ID]?.routes[th09] === 'reuse_on_site')
    await waitFor(() => byTestId('route-score').textContent!.includes('0.94'))
    expect(byTestId('route-TH-09').textContent).toContain('Suggested: Downcycle')
    click(byTestId('route-reset-TH-09'))
    await waitFor(() => getData().recoveryPlans[TIVERNE_ID]!.routes[th09] === undefined)
    expectClean()
  })

  it('opens the cascade of uses for an item', async () => {
    openAs(`/app/buildings/${TIVERNE_ID}/priorities`, U.tom)
    const row = await waitFor(() => q('route-TH-01'))
    const toggle = Array.from(row.querySelectorAll('button')).find((b) => b.textContent?.includes('Cascade of uses'))!
    click(toggle)
    await waitFor(() => row.textContent!.includes('Relocated whole, as the same member'))
    expectClean()
  })
})
