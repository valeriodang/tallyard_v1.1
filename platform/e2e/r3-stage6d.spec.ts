// Round 3, stage 6d (BRIEF section 15.8): the indicators panel on a project, on the client's home and on the owner's
// home, and Help with the glossary and the latest changes.
import { expect, test, type Page } from '@playwright/test'

const EMAIL = {
  marcus: 'marcus.lindqvist@halewick.example',
  isla: 'isla.brennan@lanternquay.example',
  tom: 'tom.ashby@ostlea.example',
  kofi: 'kofi.rennard@fennick.example',
} as const
type Who = keyof typeof EMAIL
const MERROWGATE = 'prj_hp23zk'
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

test('the consultant reads the indicators on the project, at every width', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'marcus')
  await page.goto(`/app/projects/${MERROWGATE}/sustainability`)
  const panel = page.getByTestId('indicators')
  await expect(panel.getByTestId('indicators-content')).toContainText('Reused content')
  await expect(panel.getByTestId('indicators-layer-skin')).toContainText('Within the band')
  await expect(panel.getByTestId('indicators-eol')).toContainText('0.49')
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})

test("the client's home and the owner's home show their indicators, each linked to its page", async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'isla')
  const client = page.getByTestId('client-indicators')
  await expect(client).toContainText('Merrowgate Wharf')
  await client.getByRole('link', { name: 'Merrowgate Wharf' }).click()
  await page.waitForURL(`**/app/projects/${MERROWGATE}/sustainability`)
  await expect(page.getByTestId('indicators')).toBeVisible()

  await page.goto('/app/home')
  await page.getByTestId('account-menu').click()
  await page.getByTestId('sign-out').click()
  await page.waitForURL('**/signin**')
  await signInWithCard(page, 'tom')
  await expect(page.getByTestId(`owner-indicators-${TIVERNE}`)).toContainText('business as usual')
  await page.setViewportSize({ width: 390, height: 900 })
  expect(await horizontalOverflow(page)).toBe(0)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByTestId(`owner-indicators-${TIVERNE}`).getByRole('link').click()
  await page.waitForURL(`**/app/buildings/${TIVERNE}/priorities`)
  expect(errors).toEqual([])
})

test('Help gives the contractor its guide, the glossary and the latest changes', async ({ page }) => {
  const errors = watchErrors(page)
  await signInWithCard(page, 'kofi')
  await page.goto('/app/help/getting-started')
  await expect(page.getByTestId('getting-started')).toContainText('Deconstruction contractors')
  await page.getByTestId('help-glossary').click()
  await expect(page.getByTestId('term-reuse-gla')).toContainText('crushed concrete and hardcore used as fill are recycling')
  await expect(page.getByTestId('term-retrofit')).toContainText('at least half the existing superstructure')
  await page.getByTestId('help-updated').click()
  await expect(page.getByTestId('changes-yours')).toContainText('Deconstruction contractors sign in')
  await expect(page.getByTestId('what-changed-earlier')).toContainText('Earlier: Updated on 16 October')
  for (const width of [390, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})
