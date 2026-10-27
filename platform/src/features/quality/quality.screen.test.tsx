// @vitest-environment jsdom
// Quality through the real router (round 3, stage 4): the quality panel on an item page, the steel record saved
// from it, the steel limits on a project's Requirements tab, the material page's quality section, and the client's
// provenance pack after acceptance.
import { describe, expect, it } from 'vitest'
import { byTestId, click, typeInto } from '../../ui/testing'
import { getData, useApp } from '../../store/app'
import { itemByTag, MERROWGATE_ID, TIVERNE_ID } from '../../domain/seed/world'
import { decideReservation } from '../../store/actions/reservations'
import { U } from '../../test/fixtures'
import { chooseOption, expectClean, NOW, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const th = (tag: string) => itemByTag(getData().world, tag)

describe('the quality panel', () => {
  it('ticks a raised floor check for the surveyor', async () => {
    openAs(`/app/buildings/${TIVERNE_ID}/inventory/${th('TH-11').id}`, U.dana)
    await waitFor(() => q('quality-panel'))
    expect(byTestId('quality-checks-text').textContent).toBe('4 of 5 checks done')
    click(byTestId('check-pallets'))
    await waitFor(() => th('TH-11').quality!.checks.pallets === true)
    await waitFor(() => byTestId('quality-checks-text').textContent === '5 of 5 checks done')
    expectClean()
  })

  it('saves a tested steel record, which offers the label', async () => {
    openAs(`/app/buildings/${TIVERNE_ID}/inventory/${th('TH-01').id}`, U.tom)
    await waitFor(() => q('steel-record'))
    chooseOption(byTestId('steel-assessment'), 'S3')
    typeInto(byTestId('steel-cert-ref'), 'BT-2231')
    typeInto(byTestId('steel-cert-lab'), 'Brindmoor Testing')
    typeInto(byTestId('steel-cert-date'), '2026-10-01')
    await settle()
    click(byTestId('save-steel'))
    await waitFor(() => th('TH-01').testStatus === 'tested')
    click(await waitFor(() => q('reuse-label')))
    const dialog = await waitFor(() => q('label-dialog'))
    expect(dialog.querySelector('img')!.getAttribute('src')).toContain('L-9F4CQQ')
    expectClean()
  })
})

describe('the steel limits and what the architect reads', () => {
  it('the architect changes the limits, and the material page reads them', async () => {
    openAs(`/app/projects/${MERROWGATE_ID}/requirements`, U.priya)
    await waitFor(() => q('steel-limits'))
    expect(byTestId('steel-limits-text').textContent).toBe('EXC2, CC2, up to S355')
    click(byTestId('edit-steel-limits'))
    const dialog = await waitFor(() => q('steel-limits-dialog'))
    chooseOption(dialog.querySelector('[data-testid="limits-exc"]')!, 'EXC1')
    await settle()
    click(byTestId('save-steel-limits'))
    await waitFor(() => getData().world.projects[MERROWGATE_ID].steelLimits?.exc === 'EXC1')
    expectClean()
  })

  it('shows the quality section on a material page', async () => {
    openAs(`/app/marketplace/L-9F4CQQ?project=${MERROWGATE_ID}`, U.priya)
    const section = await waitFor(() => q('quality'))
    expect(section.textContent).toContain('Declared by the seller')
    expect(section.textContent).toContain("Needs S3 for the project's limits")
    expectClean()
  })
})

describe('the provenance pack', () => {
  it('opens for the client from an accepted reservation', async () => {
    const s = getData()
    const waiting = Object.values(s.reservations).find((r) => r.status === 'pending')!
    useApp.getState().commit(decideReservation(s, { userId: U.tom, now: NOW }, waiting.id, 'accepted', '').state)
    const router = openAs(`/app/projects/${MERROWGATE_ID}/reservations`, U.isla)
    click(await waitFor(() => q('provenance-link')))
    await waitFor(() => router.state.location.pathname === `/app/projects/${MERROWGATE_ID}/reservations/${waiting.id}`)
    const pack = await waitFor(() => q('provenance-pack'))
    expect(byTestId('pack-donor').textContent).toContain('Tiverne House')
    expect(pack.textContent).toContain('Reservation accepted by the seller')
    expectClean()
  })
})
