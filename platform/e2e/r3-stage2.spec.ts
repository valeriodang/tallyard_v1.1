// Round 3, stage 2 (BRIEF section 15.3): the audits of a donor building. The surveyor finishes the Tiverne House
// pre-deconstruction audit and lists its reusable lines early, the owner downloads the workbook, the contractor reads
// it on a phone, and the pre-redevelopment audit stays closed to the contractor and to every buyer.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  tom: 'tom.ashby@ostlea.example',
  dana: 'dana.kowalski@tarnbrook.example',
  kofi: 'kofi.rennard@fennick.example',
  priya: 'priya.nair@studiooriel.example',
} as const
type Who = keyof typeof EMAIL
const TIVERNE = 'bld_zad898'
const PRA = `/app/buildings/${TIVERNE}/audits/aud_tiv_pra`
const PDA = `/app/buildings/${TIVERNE}/audits/aud_tiv_pda`

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

test('the surveyor completes the pre-deconstruction audit, and the owner downloads it', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'dana')
  await page.goto(`/app/buildings/${TIVERNE}`)
  await page.getByRole('link', { name: 'Audits', exact: true }).first().click()
  await page.waitForURL(`**/app/buildings/${TIVERNE}/audits`)
  await expect(page.getByTestId('audit-status-pre_redevelopment')).toHaveText('Complete')
  await page.getByTestId('open-audit-pre_demolition').click()
  await page.waitForURL(`**${PDA}`)
  await expect(page.getByTestId('complete-audit')).toBeDisabled()
  await page.getByTestId('hazard-status-tar_adhesive').selectOption('not_suspected')
  await expect(page.getByTestId('check-hazards')).toHaveAttribute('data-ok', 'true')
  await page.getByTestId('list-early').click()
  await expect(page.getByTestId('toast').getByText(/private lots? made/)).toBeVisible()
  await expect(page.getByTestId('check-brokers')).toHaveAttribute('data-ok', 'true')
  await page.getByTestId('complete-audit').click()
  await expect(page.getByTestId('audit-status')).toContainText('Complete')
  await expect(page.getByTestId('reopen-audit')).toBeVisible()

  await signOut(page)
  await signInWithCard(page, 'tom')
  await page.goto(PDA)
  await expect(page.getByTestId('audit-status')).toContainText('Complete')
  const download = page.waitForEvent('download')
  await page.getByTestId('audit-download').click()
  expect((await download).suggestedFilename()).toMatch(/^tiverne-house-pre-deconstruction-audit-\d{4}-\d{2}-\d{2}\.xlsx$/)
  expect(errors).toEqual([])
})

test('the contractor reads the pre-deconstruction audit on a phone, and not the pre-redevelopment audit', async ({ page }) => {
  const errors = watchErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await signInWithCard(page, 'kofi')
  await page.goto(`/app/buildings/${TIVERNE}/audits`)
  await expect(page.getByTestId('audit-kind-pre_demolition')).toBeVisible()
  await expect(page.getByTestId('audit-kind-pre_redevelopment')).toHaveCount(0)
  await page.getByTestId('open-audit-pre_demolition').click()
  await page.waitForURL(`**${PDA}`)
  await expect(page.getByTestId('audit-inventories')).toContainText('Carpet tiles, levels 1 to 6')
  await expect(page.getByTestId('add-line')).toHaveCount(0)
  expect(await horizontalOverflow(page)).toBe(0)
  await page.goto(PRA)
  await expect(page.getByText('You do not have access to this')).toBeVisible()
  expect(errors).toEqual([])
})

test('an architect cannot open an audit', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto(PDA)
  await expect(page.getByText('You do not have access to this')).toBeVisible()
  expect(errors).toEqual([])
})
