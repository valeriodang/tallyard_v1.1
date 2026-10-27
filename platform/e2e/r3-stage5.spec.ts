// Round 3, stage 5 (BRIEF section 15.6): the owner's recovery routes, design from stock for the architect, deal terms
// the client proposes and the seller reads banded, and a lot the owner holds for its own projects first.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  tom: 'tom.ashby@ostlea.example',
  priya: 'priya.nair@studiooriel.example',
  isla: 'isla.brennan@lanternquay.example',
} as const
type Who = keyof typeof EMAIL
const TIVERNE = 'bld_zad898'
const MERROWGATE = 'prj_hp23zk'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${page.url()}: ${m.text()}`)
  })
  return errors
}

async function signInWithCard(page: Page, who: Who) {
  await page.goto('/signin')
  await page.getByTestId(`sample-${EMAIL[who]}`).click()
  await page.waitForURL('**/app/home')
}

async function signOut(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/app/home')
  await page.getByTestId('account-menu').click()
  await page.getByTestId('sign-out').click()
  await page.waitForURL('**/signin**')
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement
    const main = document.querySelector('main')
    return Math.max(doc.scrollWidth - doc.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
}

test('the owner keeps the precast panels for reuse on site, on a phone', async ({ page }) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await signInWithCard(page, 'tom')
  await page.goto(`/app/buildings/${TIVERNE}/priorities`)
  await expect(page.getByTestId('route-score')).toContainText('0.68')
  await page.getByTestId('route-select-TH-09').selectOption('reuse_on_site')
  await expect(page.getByTestId('route-score')).toContainText('0.94')
  await expect(page.getByTestId('route-TH-09')).toContainText('Suggested: Downcycle')
  expect(await horizontalOverflow(page)).toBe(0)
  await page.getByTestId('route-reset-TH-09').click()
  await expect(page.getByTestId('route-score')).toContainText('0.68')
  expect(errors).toEqual([])
})

test("the architect matches the project's steel schedule against stock", async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto(`/app/projects/${MERROWGATE}/matching`)
  await expect(page.getByTestId('stock-matched')).toContainText('96 of 102')
  await expect(page.getByTestId('stock-line-R5')).toContainText('No stock long enough')
  await page.getByTestId('stock-excess').click()
  await expect(page.getByTestId('stock-line-R4')).toContainText('18.5% excess')
  await page.getByTestId('stock-cut').click()
  await expect(page.getByTestId('stock-offcut-total')).toContainText('back to stock')
  await expect(page.getByTestId('matching-dropzone')).toBeVisible()
  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})

test('the client proposes a forward sale, which the seller reads banded and accepts', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'isla')
  await page.goto(`/app/projects/${MERROWGATE}/reservations`)
  await page.getByTestId('withdraw-request').click()
  await page.getByTestId('request-L-WPX5A6').click()
  const dialog = page.getByTestId('request-dialog')
  await dialog.getByTestId('request-with-terms').click()
  await dialog.getByRole('radio', { name: /Forward sale/ }).click()
  await dialog.getByTestId('terms-bridge').fill('9')
  await expect(dialog.getByTestId('terms-lines')).toContainText('Storage bridge, 9 months, paid by the seller')
  await expect(dialog.getByTestId('terms-seller-sees')).toContainText('Storage bridge: 7 to 12 months')
  await dialog.getByTestId('request-send').click()
  await expect(page.getByTestId('reservation-terms')).toContainText('Forward sale')
  await signOut(page)

  await signInWithCard(page, 'tom')
  await page.goto('/app/requests')
  const terms = page.getByTestId('request-terms-TH-02')
  await expect(terms).toContainText('7 to 12 months')
  await expect(terms).not.toContainText('9 months')
  await page.getByTestId('accept-TH-02').click()
  await page.getByTestId('decide-confirm').click()
  // With nothing left waiting, the page turns to building claims; the accepted request is under Reservations, Decided.
  await page.getByRole('radio', { name: /^Reservations/ }).click()
  await page.getByRole('radio', { name: /Decided/ }).click()
  await expect(page.getByTestId('request-terms-TH-02')).toContainText('9 months')
  expect(errors).toEqual([])
})

test('the owner holds the stone cladding for its own projects', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'tom')
  await page.goto(`/app/buildings/${TIVERNE}/listings`)
  await page.getByTestId('edit-TH-07').click()
  await page.getByTestId('portfolio-switch').click()
  await expect(page.getByTestId('listing-TH-07')).toContainText('Held for your projects')
  expect(errors).toEqual([])
})
