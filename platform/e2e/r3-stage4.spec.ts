// Round 3, stage 4 (BRIEF section 15.5): grading and the steel pathway on an item, the label, what the architect reads
// against the project's steel limits, and the provenance pack the client receives once the seller accepts.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  tom: 'tom.ashby@ostlea.example',
  priya: 'priya.nair@studiooriel.example',
  isla: 'isla.brennan@lanternquay.example',
} as const
type Who = keyof typeof EMAIL
const TIVERNE = 'bld_zad898'
const TH01 = 'itm_7fk2qa'
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

test('the owner records a tested steel member and downloads its label', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'tom')
  await page.goto(`/app/buildings/${TIVERNE}/inventory/${TH01}`)
  await expect(page.getByTestId('quality-assurance')).toHaveText('Declared by the seller')
  await expect(page.getByTestId('steel-samples-text')).toContainText('Test 1 of the 144 members in group UB secondary')
  await page.getByTestId('steel-assessment').selectOption('S3')
  await page.getByTestId('steel-cert-ref').fill('BT-2231')
  await page.getByTestId('steel-cert-lab').fill('Brindmoor Testing')
  await page.getByTestId('steel-cert-date').fill('2026-10-01')
  await page.getByTestId('save-steel').click()
  await expect(page.getByTestId('quality-assurance')).toHaveText('Tested or certified')
  await page.getByTestId('reuse-label').click()
  const download = page.waitForEvent('download')
  await page.getByTestId('download-label').click()
  expect((await download).suggestedFilename()).toBe('L-9F4CQQ-tested-for-reuse.svg')
  expect(errors).toEqual([])
})

test('the architect reads the quality and the testing the project needs', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'priya')
  await page.goto(`/app/projects/${MERROWGATE}/requirements`)
  await expect(page.getByTestId('steel-limits-text')).toHaveText('EXC2, CC2, up to S355')
  await page.goto(`/app/marketplace/L-9F4CQQ?project=${MERROWGATE}`)
  await expect(page.getByTestId('quality')).toContainText('P1, known donor building, after 1970')
  await expect(page.getByTestId('quality')).toContainText("Needs S3 for the project's limits: about 8 weeks")
  expect(errors).toEqual([])
})

test('the client opens the provenance pack once the owner accepts', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'tom')
  await page.goto('/app/requests')
  await page.getByTestId('accept-TH-02').click()
  await page.getByTestId('decide-confirm').click()
  await signOut(page)
  await signInWithCard(page, 'isla')
  await page.goto(`/app/projects/${MERROWGATE}/reservations`)
  await page.getByTestId('provenance-link').click()
  await expect(page.getByTestId('provenance-pack')).toBeVisible()
  await expect(page.getByTestId('pack-donor')).toContainText('Tiverne House')
  await expect(page.getByTestId('pack-steel')).toContainText('Protocol B')
  expect(errors).toEqual([])
})
