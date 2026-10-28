// @vitest-environment jsdom
// The procurement pack and the reuse clauses through the real router (round 3, stage 6): the client changes the route
// and the weights; the architect writes a clause's location, which the client reads.
import { describe, expect, it } from 'vitest'
import { byTestId, click, typeInto } from '../../ui/testing'
import { getData } from '../../store/app'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { U } from '../../test/fixtures'
import { expectClean, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

describe('the procurement pack', () => {
  it('lets the client pick free issue, which brings its clause into the pack', async () => {
    openAs(`/app/projects/${MERROWGATE_ID}/procurement`, U.isla)
    const route = await waitFor(() => q('pack-route'))
    expect(byTestId('pack-objective-text').textContent).toContain('at least 5% of its building materials by value')
    const free = Array.from(route.querySelectorAll('button[role="radio"]')).find((b) => b.textContent?.includes('Free issue by the client'))!
    click(free)
    await waitFor(() => getData().procurement[MERROWGATE_ID]?.route === 'free_issue')
    await waitFor(() => byTestId('clause-free_issue').querySelector('button[role="checkbox"]')?.getAttribute('data-state') === 'checked')
    expect(byTestId('pack-reclaimed-range').textContent).toBe('£41,003 to £47,136')
    expectClean()
  })

  it('refuses weights that do not add up, then saves ones that do', async () => {
    openAs(`/app/projects/${MERROWGATE_ID}/procurement`, U.isla)
    const price = await waitFor(() => q<HTMLInputElement>('award-weight-price'))
    typeInto(price, '35')
    await settle()
    expect(byTestId('award-total').textContent).toContain('Total 95 of 100')
    click(byTestId('award-save'))
    await settle()
    expect(getData().procurement[MERROWGATE_ID]).toBeUndefined()
    typeInto(byTestId('award-weight-reuse_supply'), '10')
    await settle()
    click(byTestId('award-save'))
    await waitFor(() => getData().procurement[MERROWGATE_ID]?.award.template === 'custom')
    expectClean()
  })
})

describe('reuse clauses in the specification', () => {
  it("lets the architect set a clause's location, which the client reads", async () => {
    openAs(`/app/projects/${MERROWGATE_ID}/specification?mode=draft`, U.priya)
    await waitFor(() => q('spec-selection'))
    const clause = document.querySelector<HTMLElement>('[data-testid^="reuse-clause-"]')!
    const publicId = clause.getAttribute('data-testid')!.replace('reuse-clause-', '')
    click(byTestId(`reuse-edit-${publicId}`))
    const field = await waitFor(() => q<HTMLTextAreaElement>(`reuse-location-${publicId}`))
    typeInto(field, 'Level 2 to 4 secondary beams')
    field.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await waitFor(() => getData().specs[MERROWGATE_ID]?.clauses?.[publicId]?.location === 'Level 2 to 4 secondary beams')
    expectClean()
    openAs(`/app/projects/${MERROWGATE_ID}/specification?mode=draft`, U.isla)
    const read = await waitFor(() => q(`reuse-clause-${publicId}`))
    expect(read.textContent).toContain('Level 2 to 4 secondary beams')
    expect(q(`reuse-edit-${publicId}`)).toBeNull()
  })
})
