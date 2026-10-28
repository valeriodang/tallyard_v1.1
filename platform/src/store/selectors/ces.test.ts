// The consultant's statement workspace through the store: the requirement, the stage matrix, the decision tree, the
// layers, waste, targets, the post-construction report, the quality check, and what the statement draws from it.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, refused, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID } from '../../domain/seed/world'
import { addAchievement, addLesson, answerExisting, CES_ERRORS, removeCesEntry, saveCesSettings, saveJustification, saveLayer, saveWaste, setTargetRate } from '../actions/ces'
import { ERRORS } from '../access'
import { FORBIDDEN } from '../../ui/testing'
import type { AppData } from '../types'

const M = MERROWGATE_ID
const marcus = () => actor(U.marcus)

function withTree(s: AppData): AppData {
  for (const [q, a] of [['hasBuilding', 'yes'], ['retainFeasible', 'yes'], ['suited', 'no'], ['residualValue', 'yes']] as const) s = must(answerExisting(s, marcus(), M, q, a)).state
  return s
}

describe('the workspace at the start', () => {
  it('reads the project bill and the guidance matrix for the pre-application stage', () => {
    const v = sel.cesView(fresh(), viewer(U.marcus), M)!
    expect(v.stage).toBe('pre_app')
    expect(v.readinessText).toBe('0 of 2 required items ready for the pre-application stage')
    expect(v.requirement.required).toBe(false)
    expect(v.bom.rows).toHaveLength(12)
    expect(v.bom.totals.massText).toBe('19,658.9 t')
    expect(v.bom.benchmarks.find((b) => b.label === 'Frame')).toMatchObject({ intensityText: '69.7 kg/m2', positionText: 'Better than the lower quartile' })
    // The seed's programme is set against the sandbox clock, so Merrowgate completes on 30 June 2029.
    expect(v.post).toMatchObject({ completionText: '30 June 2029', dueText: '30 September 2029' })
    // The tree is unanswered, so retention and the audits are not yet passed.
    expect(v.quality.map((q) => q.pass)).toEqual([false, false, false, false, true])
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it('is for the consultant only', () => {
    const s = fresh()
    for (const who of [U.priya, U.isla, U.tom]) expect(sel.cesView(s, viewer(who), M)).toBeNull()
    refused(s, saveCesSettings(s, actor(U.isla), M, { stage: 'full' }), ERRORS.role)
  })
})

describe('the decision tree and the layers', () => {
  it('leads to disassemble and reuse, and asks why the building is not kept', () => {
    let s = withTree(fresh())
    let v = sel.cesView(s, viewer(U.marcus), M)!
    expect(v.tree).toMatchObject({ outcome: 'disassemble', outcomeLabel: 'Disassemble and reuse', needsJustification: true })
    expect(v.matrix.find((m) => m.id === 'approaches')!.done).toBe(false)
    s = must(saveJustification(s, marcus(), M, 'The frame cannot take the added floors; the steel is reused instead.')).state
    v = sel.cesView(s, viewer(U.marcus), M)!
    expect(v.matrix.find((m) => m.id === 'approaches')!.done).toBe(true)
    expect(v.quality.find((q) => q.id === 'retention')!.pass).toBe(true)
  })

  it('records approaches and a response per layer', () => {
    const s = must(saveLayer(fresh(), marcus(), M, 'structure', { approaches: ['disassembly', 'reuse'], response: 'Bolted steel frame with reclaimed beams.' })).state
    const l = sel.cesView(s, viewer(U.marcus), M)!.layers.find((x) => x.id === 'structure')!
    // In the guidance's order, whatever order they were picked in.
    expect(l.approaches.filter((a) => a.checked).map((a) => a.label)).toEqual(['Component or material reuse', 'Disassembly'])
    expect(sel.cesView(s, viewer(U.marcus), M)!.matrix.find((m) => m.id === 'principles')!.done).toBe(true)
    refused(s, saveLayer(s, marcus(), M, 'structure', { approaches: ['magic' as never] }), CES_ERRORS.approach)
  })
})

describe('waste and targets', () => {
  it('reads a stream, guards reuse that may be crushed material, and refuses routes over 100%', () => {
    let s = must(saveWaste(fresh(), marcus(), M, 'demolition', { tonnes: 8250, routes: { reuseOnsite: 0.3, reuseOffsite: 0.05, recycleOffsite: 0.6, landfill: 0.05 }, source: 'Pre-demolition audit' })).state
    const w = sel.cesView(s, viewer(U.marcus), M)!.waste.find((x) => x.stream === 'demolition')!
    expect(w).toMatchObject({ tPerM2Text: '0.500 t/m2', reuseText: '35%', recoveredText: '95%', complete: true, guard: true })
    expect(w.benchmarkText).toBe('Between the median and the upper quartile; the guidance median is 0.48')
    refused(s, saveWaste(s, marcus(), M, 'demolition', { routes: { other: 0.2 } }), CES_ERRORS.overfull)
    s = must(saveWaste(s, marcus(), M, 'construction', { tonnes: 1200, routes: { recycleOffsite: 0.97, landfill: 0.03 } })).state
    expect(sel.cesView(s, viewer(U.marcus), M)!.matrix.find((m) => m.id === 'waste_reporting')!.done).toBe(true)
  })

  it('flags pioneering aims and copied minimums, and counts them in the quality check', () => {
    let s = must(setTargetRate(fresh(), marcus(), M, 'cd_recovery', 'aiming', 0.98)).state
    s = must(setTargetRate(s, marcus(), M, 'content', 'aiming', 0.2)).state
    const v = sel.cesView(s, viewer(U.marcus), M)!
    expect(v.targets.find((t) => t.id === 'cd_recovery')).toMatchObject({ aiming: '98', pioneering: true })
    expect(v.targets.find((t) => t.id === 'content')).toMatchObject({ aiming: '20', copiesMinimum: true })
    expect(v.quality.find((q) => q.id === 'minimum_targets')).toMatchObject({ pass: true, text: '1 target aims above the minimum.' })
    refused(s, setTargetRate(s, marcus(), M, 'cd_recovery', 'aiming', 1.2), CES_ERRORS.rate)
  })
})

describe('post-construction', () => {
  it('keeps key achievements and lessons, and removes them', () => {
    const a = must(addAchievement(fresh(), marcus(), M, 'Steel frame reused', '93% of the frame from reclaimed stock.'))
    const l = must(addLesson(a.state, marcus(), M, 'Testing came late', 'Book testing at strip-out, not at delivery.'))
    let v = sel.cesView(l.state, viewer(U.marcus), M)!
    expect(v.post.achievements.map((x) => x.measure)).toEqual(['Steel frame reused'])
    expect(v.post.lessons.map((x) => x.description)).toEqual(['Testing came late'])
    const s = must(removeCesEntry(l.state, marcus(), M, 'lessons', l.value)).state
    v = sel.cesView(s, viewer(U.marcus), M)!
    expect(v.post.lessons).toEqual([])
    refused(s, addLesson(s, marcus(), M, '', 'x'), CES_ERRORS.lessonText)
  })
})

describe('the statement draws on the workspace', () => {
  it('adds the approach, the layers, the aims and the post-construction date once recorded', () => {
    let s = withTree(fresh())
    s = must(saveJustification(s, marcus(), M, 'The frame cannot take the added floors.')).state
    s = must(saveLayer(s, marcus(), M, 'structure', { approaches: ['disassembly'], response: 'Bolted connections.' })).state
    s = must(setTargetRate(s, marcus(), M, 'cd_recovery', 'aiming', 0.98)).state
    const v = sel.statementView(s, viewer(U.marcus), M)!
    // The generated text: the seed's statement carries the consultant's own wording for the approach.
    const text = (id: string) => v.sections.find((x) => x.id === id)!.generated
    expect(text('approach')).toContain('For the existing building, the approach is: disassemble and reuse. The frame cannot take the added floors.')
    expect(text('approach')).toContain('Structure: disassembly. Bolted connections.')
    expect(text('targets')).toContain('Construction and demolition waste reused, recycled or recovered: 98%, above the minimum.')
    expect(text('next_steps')).toContain('Submit the post-construction statement, with the actual figures, by 30 September 2029.')
    // The edited section is flagged, so the consultant sees there is new material to take in.
    expect(v.sections.find((x) => x.id === 'approach')).toMatchObject({ edited: true, stale: true })
    expect(v.sections.find((x) => x.id === 'approach')!.covers).toBe('Design approaches and principles by layer (LPG sections 2.3 to 2.5, 4.3 to 4.5)')
  })

  it('leaves the statement as it was while the workspace is empty', () => {
    const v = sel.statementView(fresh(), viewer(U.marcus), M)!
    expect(v.sections.find((x) => x.id === 'approach')).toMatchObject({ edited: true, stale: false })
    expect(v.sections.find((x) => x.id === 'approach')!.generated).not.toContain('existing building')
  })
})
