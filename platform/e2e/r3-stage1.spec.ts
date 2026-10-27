// Round 3, stage 1 (BRIEF section 15.2): the deconstruction contractor signs in to their own workspace, a surveyor
// captures one of the new families on a phone, and Methodology lists the literature tables with their sources.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  kofi: 'kofi.rennard@fennick.example',
  dana: 'dana.kowalski@tarnbrook.example',
  priya: 'priya.nair@studiooriel.example',
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

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement
    const main = document.querySelector('main')
    return Math.max(doc.scrollWidth - doc.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
}

test('the deconstruction contractor opens their own home and sets dates on an appointed building', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'kofi')
  await expect(page.getByTestId('contractor-home')).toBeVisible()
  const card = page.getByTestId(`contractor-building-${TIVERNE}`)
  await expect(card).toContainText('Tiverne House')
  await expect(page.getByTestId(`contractor-dated-${TIVERNE}`)).toContainText(/\d+ of \d+ dated/)
  // The sidebar lists the appointed building with the contractor tabs only.
  await expect(page.getByRole('navigation').getByText('Appointed buildings')).toBeVisible()
  await card.getByRole('link', { name: 'Set dates' }).click()
  await page.waitForURL(`**/app/buildings/${TIVERNE}/availability`)
  // Nothing of the owner's records: capture and inventory are refused.
  await page.goto(`/app/buildings/${TIVERNE}/inventory`)
  await expect(page.getByText('You do not have access to this')).toBeVisible()
  expect(errors).toEqual([])
})

test('a new deconstruction contractor signs up and opens on its first steps', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/signup')
  await page.getByTestId('signup-name').fill('Ruth Calder')
  await page.getByTestId('signup-email').fill('ruth.calder@corbelyard.example')
  await page.locator('input[type=password]').fill('sandbox-pass')
  await page.getByTestId('signup-continue').click()
  await page.getByTestId('signup-org').fill('Corbel Yard')
  await page.getByRole('radio', { name: /Deconstruction contractor/ }).click()
  await page.getByTestId('signup-submit').click()
  await page.waitForURL('**/app/home**')
  await expect(page.getByTestId('contractor-first-run')).toBeVisible()
  expect(errors).toEqual([])
})

test('a surveyor captures natural slate on a phone', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'dana')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/app/buildings/${TIVERNE}/capture`)
  await page.getByTestId('capture-text').fill('About 9,000 Welsh slates on the main roof')
  await expect(page.getByTestId('capture-family')).toContainText(/slate/i)
  await page.getByTestId('capture-pieces').fill('9000')
  await page.getByTestId('capture-condition').getByText(/^A/).first().click()
  await page.getByTestId('capture-recoverability').getByText(/^A/).first().click()
  expect(await horizontalOverflow(page)).toBe(0)
  await page.getByTestId('capture-save').click()
  await expect(page.getByTestId('item-sheet')).toContainText('Welsh roofing slates, 500 by 250 mm')
  expect(errors).toEqual([])
})

test('Methodology lists the RICS, Level(s) and GLA tables with their sources', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto('/app/help/methodology')
  await expect(page.getByRole('heading', { name: 'Transport, RICS defaults' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Circularity coefficients, Level(s) 2.4' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'End of life, RICS business as usual' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Benchmarks: guidance benchmarks' })).toBeVisible()
  expect(errors).toEqual([])
})
