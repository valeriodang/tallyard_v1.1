// Round 3, stage 3 (BRIEF section 15.4): the contractor's workspace. The contractor chooses a method and logs a
// stream on a phone; the owner reads the destinations and the true cost of waste, then passes title to the arisings;
// the contractor then lists them and answers requests.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  tom: 'tom.ashby@ostlea.example',
  kofi: 'kofi.rennard@fennick.example',
} as const
type Who = keyof typeof EMAIL
const TIVERNE = 'bld_zad898'

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

test('the contractor records a method and logs a stream on a phone', async ({ page }) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await signInWithCard(page, 'kofi')
  await expect(page.getByTestId(`contractor-progress-${TIVERNE}`)).toContainText('Method for 10 of 11')
  await page.goto(`/app/buildings/${TIVERNE}/method`)
  await page.getByTestId('method-select-TH-09').selectOption('crane_lift')
  await expect(page.getByTestId('method-count')).toHaveText('Method chosen for 11 of 11 items')
  expect(await horizontalOverflow(page)).toBe(0)
  await page.goto(`/app/buildings/${TIVERNE}/destinations`)
  await expect(page.getByTestId('papers')).toHaveText('1 of 1 moved streams have complete papers')
  await page.getByTestId('add-stream').click()
  const dialog = page.getByTestId('stream-dialog')
  await dialog.getByTestId('stream-description').fill('Ceiling grid offcuts')
  await dialog.getByTestId('stream-route').selectOption('recycled_off_site')
  await dialog.getByTestId('stream-actual').fill('2.4')
  await dialog.getByTestId('stream-carrier').selectOption({ label: 'Haulier A, CBDU204871' })
  await dialog.getByTestId('stream-facility').fill('Metal recycler, Thames Estuary')
  await dialog.getByTestId('stream-permit').fill('EPR/MR5521')
  await dialog.getByTestId('stream-note-ref').fill('WTN-0102')
  await page.getByTestId('save-stream').click()
  await expect(page.getByTestId('papers')).toHaveText('2 of 2 moved streams have complete papers')
  expect(await horizontalOverflow(page)).toBe(0)
  expect(errors).toEqual([])
})

test('the owner reads the destinations, passes title, and the contractor lists and answers requests', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'tom')
  await page.goto(`/app/buildings/${TIVERNE}/destinations`)
  await expect(page.getByTestId('destination-log')).toContainText('Asbestos insulating board, ceiling voids')
  await expect(page.getByTestId('true-cost')).toBeVisible()
  await expect(page.getByTestId('add-stream')).toHaveCount(0)
  // A request waits, so title cannot pass yet.
  await page.goto(`/app/buildings/${TIVERNE}/listings`)
  await expect(page.getByTestId('pass-title')).toHaveCount(0)
  await page.goto('/app/requests')
  await page.getByTestId('decline-TH-02').click()
  await page.getByTestId('decide-confirm').click()
  await page.goto(`/app/buildings/${TIVERNE}/listings`)
  await page.getByTestId('pass-title').click()
  await page.getByTestId('confirm-title').click()
  await expect(page.getByTestId('take-title-back')).toBeVisible()
  await expect(page.getByTestId('title-text')).toContainText('Fennick Dismantling holds title to the arisings')

  await signOut(page)
  await signInWithCard(page, 'kofi')
  await expect(page.getByTestId(`contractor-progress-${TIVERNE}`)).toContainText('Your firm holds title')
  await page.goto(`/app/buildings/${TIVERNE}/listings`)
  await expect(page.getByTestId('title-text')).toContainText('passed title to the arisings to your firm')
  await expect(page.getByTestId('edit-TH-07')).toBeEnabled()
  await page.goto('/app/requests')
  await expect(page.getByTestId('requests')).toBeVisible()
  await expect(page.getByText('You do not have access to this')).toHaveCount(0)
  expect(errors).toEqual([])
})
