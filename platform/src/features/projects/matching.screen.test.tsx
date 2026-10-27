// @vitest-environment jsdom
// Design from stock through the real router (round 3, stage 5): the architect reads Merrowgate Wharf's schedule
// against stock, turns on the excess rule, loads a schedule on a project with none, and is told which line to fix.
import { describe, expect, it } from 'vitest'
import { act as reactAct } from 'react'
import { byTestId, click } from '../../ui/testing'
import { getData } from '../../store/app'
import { MERROWGATE_ID, SALLOW_ID } from '../../domain/seed/world'
import { U } from '../../test/fixtures'
import { expectClean, openAs, q, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

async function upload(input: HTMLInputElement, name: string, text: string) {
  const file = new File([text], name, { type: 'text/csv' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await reactAct(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('design from stock', () => {
  it("reads Merrowgate Wharf's schedule against stock, line by line", async () => {
    openAs(`/app/projects/${MERROWGATE_ID}/matching`, U.priya)
    await waitFor(() => q('stock-results'))
    expect(byTestId('stock-matched').textContent).toContain('96 of 102')
    expect(byTestId('stock-line-R5').textContent).toContain('No stock long enough')
    expect(byTestId('stock-explorer').textContent).toContain('UB 457x191')
    expect(q('matching-dropzone')).not.toBeNull()
    click(byTestId('stock-excess'))
    await waitFor(() => getData().world.projects[MERROWGATE_ID].stockMatch?.excessRule === true)
    await waitFor(() => byTestId('stock-line-R4').textContent!.includes('18.5% excess'))
    expectClean()
  })

  it('loads the sample on a project with no schedule', async () => {
    openAs(`/app/projects/${SALLOW_ID}/matching`, U.priya)
    click(await waitFor(() => q('load-sample-schedule')))
    await waitFor(() => getData().world.projects[SALLOW_ID].requirements.length === 6)
    await waitFor(() => q('stock-results'))
    expect(byTestId('schedule-summary').textContent).toContain('Sample schedule')
    expectClean()
  })

  it('names the line to fix in an uploaded schedule', async () => {
    openAs(`/app/projects/${SALLOW_ID}/matching`, U.priya)
    const input = await waitFor(() => q<HTMLInputElement>('schedule-file'))
    await upload(input, 'frame.csv', 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 999x1x1,4200,6,S275\n')
    await waitFor(() => document.body.textContent!.includes('Line 2: "UB 999x1x1" is not a section in the table.'))
    await upload(input, 'frame.csv', 'Mark,Section,Length (mm),Qty,Grade\nB1,UB 305x165x40,4200,6,S275\n')
    await waitFor(() => getData().world.projects[SALLOW_ID].requirements.length === 1)
    await waitFor(() => byTestId('schedule-summary').textContent!.includes('frame.csv'))
    expectClean()
  })
})
