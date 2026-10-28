// Round 3, stage 6b (BRIEF section 15.7): the consultant's statement workspace, from the decision tree through waste
// and targets to the GLA template export, and the statement that draws on it.
import { expect, test, type Page } from '@playwright/test'

const MARCUS = 'marcus.lindqvist@halewick.example'
const MERROWGATE = 'prj_hp23zk'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${page.url()}: ${m.text()}`)
  })
  return errors
}

async function signIn(page: Page) {
  await page.goto('/signin')
  await page.getByTestId(`sample-${MARCUS}`).click()
  await page.waitForURL('**/app/home')
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

test('the consultant records the tree, waste and targets, then exports the GLA template', async ({ page }) => {
  const errors = watchErrors(page)
  await signIn(page)
  await page.goto(`/app/projects/${MERROWGATE}`)
  await page.getByRole('link', { name: 'Statement inputs' }).first().click()
  await expect(page.getByTestId('ces-readiness')).toHaveText('0 of 2 required items ready for the pre-application stage')

  for (const [q, a] of [['hasBuilding', 'Yes'], ['retainFeasible', 'Yes'], ['suited', 'No'], ['residualValue', 'Yes']] as const) {
    await page.getByTestId(`tree-${q}`).getByRole('radio', { name: a }).click()
  }
  await expect(page.getByTestId('ces-existing')).toContainText('Disassemble and reuse')
  await page.getByTestId('tree-justification').fill('The frame cannot take the added floors; the steel is reused instead.')
  await page.getByTestId('tree-justification').blur()

  await save(page, 'waste-tonnes-demolition', '8,250')
  for (const [k, v] of [['reuseOnsite', '30'], ['reuseOffsite', '5'], ['recycleOffsite', '60'], ['landfill', '5']] as const) await save(page, `waste-demolition-${k}`, v)
  await expect(page.getByTestId('waste-summary-demolition')).toContainText('reused, recycled or recovered 95%')
  await expect(page.getByTestId('waste-demolition')).toContainText('Check that crushed concrete and hardcore used as fill are counted as recycling')

  await save(page, 'aim-cd_recovery', '98')
  await expect(page.getByTestId('target-cd_recovery')).toContainText('Pioneering')

  const xlsx = page.waitForEvent('download')
  await page.getByTestId('export-gla').click()
  expect((await xlsx).suggestedFilename()).toMatch(/^merrowgate-wharf-gla-ce-statement-template-\d{4}-\d{2}-\d{2}\.xlsx$/)

  // The statement takes in the outcome and the aim; the consultant's own wording for the approach is kept and flagged.
  await page.goto(`/app/projects/${MERROWGATE}/statement`)
  await expect(page.getByTestId('statement-stale-approach')).toBeVisible()
  await expect(page.getByTestId('statement-covers-approach')).toContainText('LPG sections 2.3 to 2.5')
  await expect(page.getByTestId('statement-section-targets')).toContainText('98%, above the minimum')
  expect(errors).toEqual([])
})

test('the workspace fits a phone and a laptop', async ({ page }) => {
  const errors = watchErrors(page)
  await signIn(page)
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/app/projects/${MERROWGATE}/ces`)
    await expect(page.getByTestId('ces-bom')).toBeVisible()
    expect(await horizontalOverflow(page), `${width}`).toBe(0)
  }
  expect(errors).toEqual([])
})
