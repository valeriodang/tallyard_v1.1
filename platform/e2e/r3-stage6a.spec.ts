// Round 3, stage 6a (BRIEF section 15.7): the client's procurement pack with its exports, and the architect's reuse
// clauses in the specification.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  priya: 'priya.nair@studiooriel.example',
  isla: 'isla.brennan@lanternquay.example',
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

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement
    const main = document.querySelector('main')
    return Math.max(doc.scrollWidth - doc.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
}

test('the client sets the pack and exports it as Word and a spreadsheet', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'isla')
  await page.goto(`/app/projects/${MERROWGATE}/procurement`)
  await page.getByTestId('pack-route').getByRole('radio', { name: /Free issue by the client/ }).click()
  await expect(page.getByTestId('clause-free_issue').getByRole('checkbox')).toBeChecked()
  await page.getByTestId('pack-objective').getByRole('radio', { name: /Pioneering/ }).click()
  await expect(page.getByTestId('pack-objective-text')).toContainText('at least 10% of its building materials by value')
  const docx = page.waitForEvent('download')
  await page.getByTestId('export-pack-docx').click()
  expect((await docx).suggestedFilename()).toMatch(/^merrowgate-wharf-procurement-pack-\d{4}-\d{2}-\d{2}\.docx$/)
  const xlsx = page.waitForEvent('download')
  await page.getByTestId('export-pack-xlsx').click()
  expect((await xlsx).suggestedFilename()).toMatch(/^merrowgate-wharf-procurement-pack-\d{4}-\d{2}-\d{2}\.xlsx$/)
  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})

test('the architect writes where a reclaimed item goes in its reuse clause', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto(`/app/projects/${MERROWGATE}/specification?mode=draft`)
  await expect(page.getByTestId('spec-selection')).toContainText('Present the items to the architect for selection')
  const clause = page.locator('[data-testid^="reuse-clause-"]').first()
  const publicId = (await clause.getAttribute('data-testid'))!.replace('reuse-clause-', '')
  await page.getByTestId(`reuse-edit-${publicId}`).click()
  await page.getByTestId(`reuse-location-${publicId}`).fill('Level 2 to 4 secondary beams')
  await page.getByTestId(`reuse-location-${publicId}`).blur()
  await page.getByTestId(`reuse-edit-${publicId}`).click()
  await expect(clause).toContainText('Level 2 to 4 secondary beams')
  await expect(clause).toContainText('Edited')
  expect(errors).toEqual([])
})
