// Round 3, stage 6c (BRIEF section 15.7): the City of London module once a project is in the City, and the
// certification calculators: LEED v5 interiors MRc1 and MRc5, BREEAM Wst 01 and the WELL hazard screen.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  priya: 'priya.nair@studiooriel.example',
  marcus: 'marcus.lindqvist@halewick.example',
} as const
type Who = keyof typeof EMAIL
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

async function save(page: Page, testId: string, value: string) {
  const field = page.getByTestId(testId)
  await field.fill(value)
  await field.press('Enter')
}

test('a project moved into the City gains the City module, where the consultant compares options', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto(`/app/projects/${MERROWGATE}`)
  await page.locator('button[aria-haspopup="dialog"]', { hasText: /^Edit$/ }).click()
  await page.getByTestId('edit-project-local-authority').selectOption('City of London')
  await page.getByTestId('edit-project-save').click()
  await expect(page.getByTestId('edit-project-dialog')).toBeHidden()
  await signOut(page)

  await signInWithCard(page, 'marcus')
  await page.goto(`/app/projects/${MERROWGATE}`)
  await page.getByRole('link', { name: 'City of London' }).first().click()
  await expect(page.getByTestId('minimum-catalogue')).toContainText('0 of 5')

  const options = page.getByTestId('city-options')
  for (const [label, kept, facade] of [
    ['Refurbish and extend', '80', ''],
    ['Facade kept, new behind', '20', '90'],
  ]) {
    await options.getByTestId('add-option').click()
    await page.getByTestId('option-label').fill(label)
    await page.getByTestId('option-superstructure').fill(kept)
    if (facade) await page.getByTestId('option-facade').fill(facade)
    await page.getByTestId('save-option').click()
    await expect(page.getByTestId('option-dialog')).toBeHidden()
  }
  await options.getByTestId('preferred-option').selectOption({ label: 'Facade kept, new behind' })
  await expect(page.getByTestId('city-verdict')).toHaveText('The preferred option counts as new build.')
  await expect(page.getByTestId('city-facade-only')).toBeVisible()

  await save(page, 'reviewer-name', 'Wren Tallis')
  await save(page, 'reviewer-years', '5')
  await page.getByTestId('reviewer-signoff').click()
  await expect(page.getByTestId('reviewer-signed')).toContainText('Signed off on')

  for (const item of ['Raised floor panels', 'Steel beams']) {
    await page.getByTestId('catalogue-item').fill(item)
    await page.getByTestId('catalogue-add').click()
  }
  await expect(page.getByTestId('minimum-catalogue')).toContainText('2 of 5')

  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})

test('the calculators score LEED, place Wst 01 and screen for WELL', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'marcus')
  await page.goto(`/app/projects/${MERROWGATE}/ces`)
  await save(page, 'waste-tonnes-construction', '1,000')
  await save(page, 'waste-construction-recycleOffsite', '97')
  await save(page, 'waste-construction-landfill', '3')

  await page.goto(`/app/projects/${MERROWGATE}/certification?scheme=leed`)
  await save(page, 'mrc1-onsite-total', '100000')
  await save(page, 'mrc1-onsite-reused', '30000')
  await expect(page.getByTestId('mrc1-points')).toHaveText('3 points of 4')
  await save(page, 'mrc5-separated', '100')
  await expect(page.getByTestId('mrc5-rate')).toHaveText('97%')
  await expect(page.getByTestId('mrc5-points')).toHaveText('3 points of 4')

  await page.goto(`/app/projects/${MERROWGATE}/certification?scheme=breeam`)
  await expect(page.getByTestId('wst01-intensity')).toContainText('t/m2')
  await page.goto(`/app/projects/${MERROWGATE}/certification?scheme=well`)
  await expect(page.getByTestId('calc-well')).toContainText('to check')
  await page.setViewportSize({ width: 390, height: 900 })
  expect(await horizontalOverflow(page)).toBe(0)
  expect(errors).toEqual([])
})
