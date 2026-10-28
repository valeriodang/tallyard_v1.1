// @vitest-environment jsdom
// The City of London module and the certification calculators through the real router (round 3, stage 6c). The
// architect moves Merrowgate Wharf into the City first, as in the product.
import { describe, expect, it } from 'vitest'
import { byTestId, click, press, typeInto } from '../../ui/testing'
import { getData } from '../../store/app'
import { act as actions } from '../../store'
import { setSessionUserId } from '../../store/sessionId'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { U } from '../../test/fixtures'
import { expectClean, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const M = MERROWGATE_ID

function moveIntoTheCity() {
  setSessionUserId(U.priya, false)
  const r = actions.updateProject(M, { region: 'Central London', localAuthority: 'City of London' })
  expect(r.ok).toBe(true)
}

async function enter(testId: string, value: string) {
  const field = await waitFor(() => q<HTMLInputElement>(testId))
  typeInto(field, value)
  press('Enter', field)
  await settle()
}

describe('the City of London module', () => {
  it('compares an option, applies the retrofit test and catalogues an item', async () => {
    moveIntoTheCity()
    openAs(`/app/projects/${M}/city`, U.marcus)
    await waitFor(() => q('city-minimums'))
    expect(byTestId('minimum-catalogue').getAttribute('data-met')).toBe('false')
    click(byTestId('city-options').querySelector('[data-testid="add-option"]')!)
    typeInto(await waitFor(() => q('option-label')), 'Refurbish and extend')
    typeInto(byTestId('option-superstructure'), '80')
    click(byTestId('save-option'))
    await waitFor(() => getData().ces[M]?.city.options.length === 1)
    expect(getData().ces[M]!.city.options[0].superstructureRetainedShare).toBe(0.8)
    await waitFor(() => byTestId('city-options').textContent?.includes('Counts as retrofit'))
    typeInto(byTestId('catalogue-item'), 'Raised floor panels')
    click(byTestId('catalogue-add'))
    await waitFor(() => getData().ces[M]?.city.catalogue.length === 1)
    expect(byTestId('minimum-catalogue').textContent).toContain('1 of 5')
    expectClean()
  })

  it('is not there for a project outside the City', async () => {
    openAs(`/app/projects/${M}/city`, U.marcus)
    await settle(200)
    expect(q('city')).toBeNull()
  })
})

describe('the certification calculators', () => {
  it('scores LEED MRc1 from the costs typed in', async () => {
    openAs(`/app/projects/${M}/certification?scheme=leed`, U.marcus)
    await waitFor(() => q('calc-mrc1'))
    await enter('mrc1-onsite-total', '100,000')
    await enter('mrc1-onsite-reused', '30,000')
    await waitFor(() => byTestId('mrc1-points').textContent === '3 points of 4')
    expect(byTestId('calc-mrc5').textContent).toContain('No waste estimates yet')
    expectClean()
  })

  it('screens the reclaimed items for WELL', async () => {
    openAs(`/app/projects/${M}/certification?scheme=well`, U.marcus)
    const card = await waitFor(() => q('calc-well'))
    expect(card.querySelectorAll('[data-testid^="well-L-"]').length).toBeGreaterThan(0)
    expectClean()
  })
})
