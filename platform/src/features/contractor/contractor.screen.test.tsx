// @vitest-environment jsdom
// The contractor workspace through the real router (round 3, stage 3): Method and Destinations render cleanly for
// the contractor and, for Destinations, the owner; the contractor records a method, logs a stream and a carrier; the
// owner passes title on Listings and the contractor then lists.
import { describe, expect, it } from 'vitest'
import { byTestId, click, typeInto } from '../../ui/testing'
import { getData, useApp } from '../../store/app'
import { itemByTag, TIVERNE_ID } from '../../domain/seed/world'
import { FENNICK_ID } from '../../sandbox/sampleIds'
import { workFor } from '../../store/actions/contractorWork'
import { decideReservation } from '../../store/actions/reservations'
import { U } from '../../test/fixtures'
import { chooseOption, expectClean, NOW, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const base = `/app/buildings/${TIVERNE_ID}`

describe('rendering', () => {
  it('renders Method for the contractor without a forbidden character', async () => {
    openAs(`${base}/method`, U.kofi)
    await waitFor(() => q('method'))
    expect(byTestId('method-count').textContent).toBe('Method chosen for 10 of 11 items')
    expectClean()
  })

  for (const [who, id] of [['Kofi', U.kofi], ['Tom', U.tom]] as const) {
    it(`renders Destinations for ${who} without a forbidden character`, async () => {
      openAs(`${base}/destinations`, id)
      await waitFor(() => q('destination-log'))
      expect(byTestId('papers').textContent).toBe('1 of 1 moved streams have complete papers')
      expect(q('true-cost')).not.toBeNull()
      expect(!!q('add-stream')).toBe(id === U.kofi)
      expect(!!q('carriers')).toBe(id === U.kofi)
      expectClean()
    })
  }
})

describe('the contractor at work', () => {
  it('chooses a method for TH-09', async () => {
    openAs(`${base}/method`, U.kofi)
    await waitFor(() => q('method-TH-09'))
    chooseOption(byTestId('method-select-TH-09'), 'crane_lift')
    await settle()
    const id = itemByTag(getData().world, 'TH-09').id
    expect(workFor(getData(), TIVERNE_ID)!.methods[id].method).toBe('crane_lift')
    await waitFor(() => byTestId('method-count').textContent === 'Method chosen for 11 of 11 items')
  })

  it('adds a carrier, then logs a stream as weighed out with it', async () => {
    openAs(`${base}/destinations`, U.kofi)
    click(await waitFor(() => q('add-carrier')))
    const c = await waitFor(() => q('carrier-dialog'))
    typeInto(c.querySelector('[data-testid="carrier-name"]')!, 'Haulier D')
    typeInto(c.querySelector('[data-testid="carrier-registration"]')!, 'cbdu900100')
    click(byTestId('save-carrier'))
    await waitFor(() => !q('carrier-dialog'))
    const carrier = getData().contractorWork.carriers[FENNICK_ID].find((x) => x.name === 'Haulier D')!
    expect(carrier.registration).toBe('CBDU900100')

    click(byTestId('add-stream'))
    const d = await waitFor(() => q('stream-dialog'))
    typeInto(d.querySelector('[data-testid="stream-description"]')!, 'Ceiling grid offcuts')
    chooseOption(d.querySelector('[data-testid="stream-route"]')!, 'recycled_off_site')
    typeInto(d.querySelector('[data-testid="stream-forecast"]')!, '2')
    typeInto(d.querySelector('[data-testid="stream-actual"]')!, '2.4')
    typeInto(d.querySelector('[data-testid="stream-moved-on"]')!, NOW.slice(0, 10))
    chooseOption(d.querySelector('[data-testid="stream-carrier"]')!, carrier.id)
    await settle()
    click(byTestId('save-stream'))
    await waitFor(() => !q('stream-dialog'))
    const e = workFor(getData(), TIVERNE_ID)!.destinations.find((x) => x.description === 'Ceiling grid offcuts')!
    expect(e).toMatchObject({ route: 'recycled_off_site', forecastT: 2, actualT: 2.4, carrierId: carrier.id })
    // No site, permit or transfer note yet: the papers say so.
    await waitFor(() => byTestId('papers').textContent === '1 of 2 moved streams have complete papers')
    expectClean()
  })
})

describe('title to the arisings', () => {
  it('the owner passes title on Listings, and the contractor then lists', async () => {
    const s = getData()
    const waiting = Object.values(s.reservations).find((r) => r.status === 'pending')!
    useApp.getState().commit(decideReservation(s, { userId: U.tom, now: NOW }, waiting.id, 'declined', '').state)
    openAs(`${base}/listings`, U.tom)
    click(await waitFor(() => q('pass-title')))
    await waitFor(() => q('title-dialog'))
    click(byTestId('confirm-title'))
    await waitFor(() => getData().world.buildings[TIVERNE_ID].arisingsTitle === 'contractor')
    await waitFor(() => q('take-title-back'))
    expect(byTestId('title-text').textContent).toContain('Fennick Dismantling holds title to the arisings')
    expect((byTestId('edit-TH-07') as HTMLButtonElement).disabled).toBe(true)
    expectClean()
  })
})
