// @vitest-environment jsdom
// The Audits tab and the two audits, through the real router: each renders cleanly for each side, and the surveyor
// starts an audit, adds a line, screens a hazard, lists early and completes the Tiverne House audit.
import { describe, expect, it } from 'vitest'
import { byTestId, click, typeInto } from '../../ui/testing'
import { getData } from '../../store/app'
import { HARROWDEN_ID, TIVERNE_ID } from '../../domain/seed/world'
import { SEEDED_AUDIT_IDS } from '../../sandbox/seed-v3'
import type { PreDemolitionAudit } from '../../domain/auditTypes'
import { U } from '../../test/fixtures'
import { chooseOption, expectClean, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const PRA = `/app/buildings/${TIVERNE_ID}/audits/${SEEDED_AUDIT_IDS.tiverneRetention}`
const PDA = `/app/buildings/${TIVERNE_ID}/audits/${SEEDED_AUDIT_IDS.tiverneDeconstruction}`

describe('rendering', () => {
  for (const [who, id] of [['Tom', U.tom], ['Dana', U.dana], ['Kofi', U.kofi]] as const) {
    it(`renders the Audits tab for ${who} without a forbidden character`, async () => {
      openAs(`/app/buildings/${TIVERNE_ID}/audits`, id)
      await waitFor(() => q('audits'))
      expect(q('audit-kind-pre_demolition')).not.toBeNull()
      expectClean()
    })
  }

  it('renders the complete pre-redevelopment audit, locked, with the tree and the options', async () => {
    openAs(PRA, U.tom)
    await waitFor(() => q('audit-detail'))
    expect(byTestId('audit-status').textContent).toContain('Complete')
    expect(byTestId('outcome-disassemble_reuse').getAttribute('data-reached')).toBe('true')
    expect(byTestId('options-table').textContent).toContain('New build, reclaiming the frame and facade')
    expect(byTestId('city-checks').textContent).toContain('Above it')
    expect(q('reopen-audit')).not.toBeNull()
    expect(q('add-option')).toBeNull()
    expectClean()
  })

  it('shows the contractor the pre-deconstruction audit to read, with nothing to edit', async () => {
    openAs(PDA, U.kofi)
    await waitFor(() => q('audit-detail'))
    expect(q('add-line')).toBeNull()
    expect(q('complete-audit')).toBeNull()
    expect(byTestId('audit-inventories').textContent).toContain('Carpet tiles, levels 1 to 6')
    expectClean()
  })

  it('does not open the pre-redevelopment audit for the contractor', async () => {
    openAs(PRA, U.kofi)
    await settle(200)
    expect(q('audit-detail')).toBeNull()
  })
})

describe('the surveyor at work', () => {
  it('starts the pre-redevelopment audit of Harrowden Court and lands on it', async () => {
    const router = openAs(`/app/buildings/${HARROWDEN_ID}/audits`, U.dana)
    click(await waitFor(() => q('start-audit-pre_redevelopment')))
    await waitFor(() => /\/audits\/aud_/.test(router.state.location.pathname))
    await waitFor(() => q('audit-factors'))
    const created = Object.values(getData().audits).find((a) => a.buildingId === HARROWDEN_ID && a.kind === 'pre_redevelopment')!
    expect(created.status).toBe('draft')
    chooseOption(byTestId('factor-scale-technical_capacity'), 'may_be_supported')
    await settle()
    const a = getData().audits[created.id]
    expect(a.kind === 'pre_redevelopment' && a.factors.technical_capacity.scale).toBe('may_be_supported')
    expectClean()
  })

  it('adds a line, screens the last hazard, lists early and completes the Tiverne House audit', async () => {
    openAs(PDA, U.dana)
    await waitFor(() => q('audit-inventories'))
    click(byTestId('add-line'))
    const dialog = await waitFor(() => q('line-dialog'))
    typeInto(dialog.querySelector('[data-testid="line-description"]')!, 'Welsh slates from the plant room roof')
    chooseOption(dialog.querySelector('[data-testid="line-family"]')!, 'natural_slate')
    await settle()
    typeInto(dialog.querySelector('[data-testid="line-quantity"]')!, '800')
    typeInto(dialog.querySelector('[data-testid="line-mass"]')!, '2.8')
    chooseOption(dialog.querySelector('[data-testid="line-extractability"]')!, '3')
    chooseOption(dialog.querySelector('[data-testid="line-quality"]')!, '3')
    chooseOption(dialog.querySelector('[data-testid="line-marketValue"]')!, '3')
    typeInto(dialog.querySelector('[data-testid="line-reusable"]')!, '80')
    chooseOption(dialog.querySelector('[data-testid="line-band"]')!, '2')
    click(byTestId('save-line'))
    await waitFor(() => !q('line-dialog'))
    const rows = () => (getData().audits[SEEDED_AUDIT_IDS.tiverneDeconstruction] as PreDemolitionAudit).rows
    const slate = rows().find((r) => r.description === 'Welsh slates from the plant room roof')!
    expect(slate).toMatchObject({ family: 'natural_slate', nrm: '2.3', ewcCode: '17 09 04', unit: 'slates', quantity: 800, massT: 2.8, reusableShare: 0.8, cityBand: 2 })

    chooseOption(byTestId('hazard-status-tar_adhesive'), 'not_suspected')
    await settle()
    expect(byTestId('check-hazards').getAttribute('data-ok')).toBe('true')

    click(byTestId('list-early'))
    await waitFor(() => rows().find((r) => r.id === slate.id)!.itemId !== null)
    expect(rows().filter((r) => r.inventory === 'reuse' && (r.reusableShare ?? 0) > 0).every((r) => r.broker.route !== 'none')).toBe(true)

    const complete = await waitFor(() => (q<HTMLButtonElement>('complete-audit')?.disabled === false ? q('complete-audit') : null))
    click(complete)
    await waitFor(() => getData().audits[SEEDED_AUDIT_IDS.tiverneDeconstruction].status === 'complete')
    await waitFor(() => q('reopen-audit'))
    expect(getData().notifications.some((n) => n.kind === 'audit' && n.href === PDA)).toBe(true)
    expectClean()
  })
})
