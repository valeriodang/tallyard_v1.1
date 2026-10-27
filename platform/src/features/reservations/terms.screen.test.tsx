// @vitest-environment jsdom
// Deal terms through the real router (round 3, stage 5): the client proposes a deal with a request, reads it back,
// and the seller reads it banded on Requests.
import { describe, expect, it } from 'vitest'
import { byTestId, click, typeInto } from '../../ui/testing'
import { getData, useApp } from '../../store/app'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { withdrawReservation } from '../../store/actions/reservations'
import { U } from '../../test/fixtures'
import { chooseOption, expectClean, NOW, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const TH02 = 'wli_hp23zk_1'

function withdrawSeeded() {
  const s = getData()
  const waiting = Object.values(s.reservations).find((r) => r.wishItemId === TH02 && r.status === 'pending')!
  useApp.getState().commit(withdrawReservation(s, { userId: U.isla, now: NOW }, waiting.id).state)
}

describe('deal terms', () => {
  it('lets the client propose a hybrid deal with a nine-month bridge, which the seller reads banded', async () => {
    withdrawSeeded()
    openAs(`/app/projects/${MERROWGATE_ID}/reservations`, U.isla)
    click(await waitFor(() => q('request-L-WPX5A6')))
    await waitFor(() => q('request-dialog'))
    click(byTestId('request-with-terms'))
    const picker = await waitFor(() => q('terms-picker'))
    const hybrid = Array.from(picker.querySelectorAll('button[role="radio"]')).find((b) => b.textContent?.includes('Hybrid'))!
    click(hybrid)
    chooseOption(byTestId('terms-deposit'), '0.2')
    typeInto(byTestId('terms-bridge'), '9')
    await settle()
    await waitFor(() => byTestId('terms-lines').textContent!.includes('Storage bridge, 9 months, paid by the buyer'))
    expect(byTestId('terms-seller-sees').textContent).toContain('Storage bridge: 7 to 12 months')
    click(byTestId('request-send'))
    await waitFor(() => Object.values(getData().reservations).some((r) => r.wishItemId === TH02 && r.status === 'pending' && r.terms?.offer.model === 'hybrid' && r.terms.offer.bridgeMonths === 9))
    await waitFor(() => q('reservation-terms'))
    expect(byTestId('reservation-terms').textContent).toContain('Hybrid')
    expectClean()

    openAs('/app/requests', U.tom)
    const terms = await waitFor(() => q('request-terms-TH-02'))
    expect(terms.textContent).toContain('7 to 12 months')
    expect(terms.textContent).not.toContain('9 months')
    expectClean()
  })
})
