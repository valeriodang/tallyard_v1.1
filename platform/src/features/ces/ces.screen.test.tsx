// @vitest-environment jsdom
// The consultant's statement workspace through the real router (round 3, stage 6): the decision tree leads to an
// outcome and asks for the reasons; a target aimed above the minimum is marked pioneering; a rate over 100% is refused.
import { describe, expect, it } from 'vitest'
import { byTestId, click, press, typeInto } from '../../ui/testing'
import { getData } from '../../store/app'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { U } from '../../test/fixtures'
import { expectClean, openAs, q, settle, setupScreenHarness, waitFor } from '../buildings/screenHarness'

setupScreenHarness()

const M = MERROWGATE_ID

function answer(question: string, label: 'Yes' | 'No') {
  const group = byTestId(`tree-${question}`)
  click(Array.from(group.querySelectorAll('button')).find((b) => b.textContent === label)!)
}

describe('the statement workspace', () => {
  it('walks the decision tree to an outcome, then takes the reasons for not retaining', async () => {
    openAs(`/app/projects/${M}/ces`, U.marcus)
    await waitFor(() => q('ces-existing'))
    expect(byTestId('ces-readiness').textContent).toBe('0 of 2 required items ready for the pre-application stage')
    answer('hasBuilding', 'Yes')
    await waitFor(() => q('tree-retainFeasible'))
    answer('retainFeasible', 'Yes')
    await waitFor(() => q('tree-suited'))
    answer('suited', 'No')
    await waitFor(() => q('tree-residualValue'))
    answer('residualValue', 'Yes')
    await waitFor(() => getData().ces[M]?.existing.residualValue === 'yes')
    const reasons = await waitFor(() => q<HTMLTextAreaElement>('tree-justification'))
    expect(byTestId('ces-existing').textContent).toContain('Disassemble and reuse')
    typeInto(reasons, 'The frame cannot take the added floors.')
    reasons.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    reasons.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await waitFor(() => getData().ces[M]?.justification === 'The frame cannot take the added floors.')
    expectClean()
  })

  it('marks an aim above the minimum as pioneering and refuses one over 100%', async () => {
    openAs(`/app/projects/${M}/ces`, U.marcus)
    const aim = await waitFor(() => q<HTMLInputElement>('aim-cd_recovery'))
    typeInto(aim, '98')
    press('Enter', aim)
    await waitFor(() => getData().ces[M]?.aiming.cd_recovery === 0.98)
    await waitFor(() => byTestId('target-cd_recovery').textContent?.includes('Pioneering'))
    const content = byTestId('aim-content') as HTMLInputElement
    typeInto(content, '120')
    press('Enter', content)
    await settle()
    expect(getData().ces[M]?.aiming.content).toBeUndefined()
    expect(content.value).toBe('')
    expectClean()
  })

  it('is not open to the client', async () => {
    openAs(`/app/projects/${M}/ces`, U.isla)
    await settle(200)
    expect(q('ces')).toBeNull()
  })
})
