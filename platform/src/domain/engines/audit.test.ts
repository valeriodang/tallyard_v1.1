// The two audits' arithmetic and checks (round 3, BRIEF section 15.3).
import { describe, it, expect } from 'vitest'
import { closeTo } from '../../test/helpers'
import type { AuditRow, PreDemolitionAudit, PreRedevelopmentAudit, RetentionOption } from '../auditTypes'
import { appraiseOptions, auditTotals, checklistReady, existingTreeOutcome, existingTreeQuestions, hazardSuggestions, optionMetrics, preDemolitionChecklist, preRedevelopmentChecklist, rowMetrics, rowsFromItems } from './audit'
import { createSeed, itemByTag } from '../seed/world'

const option = (o: Partial<RetentionOption> & { id: string }): RetentionOption => ({ label: o.id, kind: 'new_build', superstructureRetainedShare: null, facadeRetainedShare: null, giaM2: 10000, upfrontKgM2: null, wlcKgM2: null, demolishedAreaM2: null, demolitionKgM2: null, note: '', ...o })

const row = (r: Partial<AuditRow> & { id: string }): AuditRow => ({ inventory: 'reuse', description: r.id, family: null, nrm: '2.1', ewcCode: '17 04 05', quantity: 1, unit: 'tonnes', massT: 1, extractability: null, quality: null, marketValue: null, reusableShare: null, cityBand: null, considerations: '', broker: { route: 'none', status: 'not_offered', outlet: '' }, itemId: null, ...r })

describe('the GLA decision tree for existing buildings', () => {
  it('leads to each design approach', () => {
    expect(existingTreeOutcome({ feasibleToRetain: 'yes', suitedInWhole: 'yes', suitedInPart: null, recoverResidualValue: null })).toBe('retain_retrofit')
    expect(existingTreeOutcome({ feasibleToRetain: 'yes', suitedInWhole: 'no', suitedInPart: 'yes', recoverResidualValue: null })).toBe('partial_retention')
    expect(existingTreeOutcome({ feasibleToRetain: 'yes', suitedInWhole: 'no', suitedInPart: 'no', recoverResidualValue: 'yes' })).toBe('disassemble_reuse')
    expect(existingTreeOutcome({ feasibleToRetain: 'no', suitedInWhole: null, suitedInPart: null, recoverResidualValue: 'no' })).toBe('demolish_recycle')
    expect(existingTreeOutcome({ feasibleToRetain: 'yes', suitedInWhole: null, suitedInPart: null, recoverResidualValue: null })).toBeNull()
  })
  it('asks only the questions that apply', () => {
    expect(existingTreeQuestions({ feasibleToRetain: 'no', suitedInWhole: null, suitedInPart: null, recoverResidualValue: null })).toEqual(['feasibleToRetain', 'recoverResidualValue'])
    expect(existingTreeQuestions({ feasibleToRetain: 'yes', suitedInWhole: 'no', suitedInPart: 'no', recoverResidualValue: null })).toEqual(['feasibleToRetain', 'suitedInWhole', 'suitedInPart', 'recoverResidualValue'])
  })
})

describe('carbon options (City of London advice note)', () => {
  it('adds demolition at the 50 kgCO2e per m2 default over the option GIA, and applies the retrofit test at half the superstructure', () => {
    const m = optionMetrics(option({ id: 'nb', upfrontKgM2: 700, wlcKgM2: 1100, demolishedAreaM2: 8000 }))
    closeTo(m.demolitionKgM2!, 40, 6)
    expect(m.demolitionIsDefault).toBe(true)
    closeTo(m.wlcWithDemolitionKgM2!, 1140, 6)
    closeTo(m.wlcT!, 11400, 6)
    expect(optionMetrics(option({ id: 'r', superstructureRetainedShare: 0.5 })).retrofit).toBe(true)
    expect(optionMetrics(option({ id: 'r', superstructureRetainedShare: 0.49 })).retrofit).toBe(false)
    expect(optionMetrics(option({ id: 'r' })).retrofit).toBeNull()
  })
  it('names the lowest-carbon option, and asks for a justification when the preferred one keeps less', () => {
    const opts = [option({ id: 'keep', kind: 'retain_refurbish', superstructureRetainedShare: 0.8, upfrontKgM2: 300, wlcKgM2: 700 }), option({ id: 'nb', kind: 'new_build', superstructureRetainedShare: 0, upfrontKgM2: 650, wlcKgM2: 1050, demolishedAreaM2: 10000 })]
    const a = appraiseOptions(opts, 'nb')
    expect(a.lowestWlcId).toBe('keep')
    expect(a.needsJustification).toBe(true)
    expect(appraiseOptions(opts, 'keep').needsJustification).toBe(false)
    // The City's office benchmarks against the preferred option: 1,100 is under 1,400 but over 970, and 700 is over 600.
    expect(a.cityChecks.map((c) => [c.id, c.within])).toEqual([['wlc_standard', true], ['wlc_aspirational', false], ['upfront_aspirational', false]])
  })
})

describe('pre-redevelopment checklist', () => {
  const base: PreRedevelopmentAudit = {
    id: 'a', kind: 'pre_redevelopment', buildingId: 'b', status: 'draft', authorOrgId: 'o', authorUserId: 'u', createdAt: '', updatedAt: '', completedAt: null, auditorName: 'x', independence: 'independent', reviewer: { name: 'Ruth Calder', organisation: 'Reviewer', reviewedOn: null, note: '' }, surveyedOn: '2026-09-01', summary: '',
    factors: { technical_capacity: { scale: 'not_prohibit', note: '' }, energy_performance: { scale: 'may_be_supported', note: '' }, occupant_comfort: { scale: 'may_be_supported', note: '' }, construction_practicalities: { scale: 'may_not_be_supported', note: '' }, social_economic_value: { scale: 'not_prohibit', note: '' }, commercial_viability: { scale: 'may_not_be_supported', note: '' } },
    tree: { feasibleToRetain: 'yes', suitedInWhole: 'no', suitedInPart: 'yes', recoverResidualValue: null },
    options: [option({ id: 'p', kind: 'partial_retention', superstructureRetainedShare: 0.6, upfrontKgM2: 420, wlcKgM2: 800 }), option({ id: 'nb', kind: 'new_build', superstructureRetainedShare: 0, upfrontKgM2: 650, wlcKgM2: 1050 })],
    preferredOptionId: 'p', justification: '', followOn: [],
  }
  it('is ready when every required item is done', () => {
    expect(checklistReady(preRedevelopmentChecklist(base, { localAuthority: 'Camden' }))).toBe(true)
  })
  it('needs a justification for a preferred option that keeps less, and a reviewer in the City', () => {
    const items = preRedevelopmentChecklist({ ...base, preferredOptionId: 'nb', reviewer: null }, { localAuthority: 'City of London' })
    expect(items.find((i) => i.id === 'justification')!.ok).toBe(false)
    expect(items.find((i) => i.id === 'reviewer')).toMatchObject({ ok: false, required: true })
    expect(preRedevelopmentChecklist({ ...base, reviewer: null }, { localAuthority: 'Camden' }).find((i) => i.id === 'reviewer')!.required).toBe(false)
  })
})

describe('pre-deconstruction audit', () => {
  it('suggests hazards from the year built', () => {
    expect(hazardSuggestions(1965)).toEqual(['asbestos', 'lead_paint', 'red_lead', 'pcb', 'cca_timber', 'tar_adhesive'])
    expect(hazardSuggestions(1995)).toEqual(['asbestos', 'cca_timber'])
    expect(hazardSuggestions(2012)).toEqual([])
  })
  it('works out a line: score over 12, reusable tonnes, and the carbon its reuse avoids against new', () => {
    const m = rowMetrics(row({ id: 's', family: 'steel_section', massT: 10, reusableShare: 0.7, extractability: 3, quality: 4, marketValue: 2 }))
    closeTo(m.score!, 0.75, 6)
    closeTo(m.reusableT!, 7, 6)
    // 7 t x (1.74 + 120 x 0.0001065 - 0.0466 - 50 x 0.0001065)
    closeTo(m.avoidedT!, 7 * (1.74 + 0.01278 - 0.0466 - 0.005325), 6)
  })
  it('totals by inventory and by waste code, with reuse by mass and recovery by weight', () => {
    const t = auditTotals([row({ id: 'a', massT: 10, reusableShare: 0.5 }), row({ id: 'b', inventory: 'recycle', ewcCode: '17 01 01', massT: 85 }), row({ id: 'c', inventory: 'waste', ewcCode: '17 06 05*', massT: 5 })])
    expect(t.totalT).toBe(100)
    closeTo(t.reuseByMass!, 0.05, 6)
    closeTo(t.recoveryByWeight!, 0.95, 6)
    expect(t.arisings[0]).toMatchObject({ code: '17 01 01', massT: 85 })
  })
  it('refuses an audit that only lists waste routes, and asks the City minimums in the City', () => {
    const audit: PreDemolitionAudit = { id: 'd', kind: 'pre_demolition', buildingId: 'b', status: 'draft', authorOrgId: 'o', authorUserId: 'u', createdAt: '', updatedAt: '', completedAt: null, auditorName: '', independence: 'not_declared', reviewer: null, surveyedOn: null, summary: '', deskStudy: { drawingsSeen: true, asbestosRegister: 'seen', history: '' }, hazards: [], rows: [row({ id: 'w', inventory: 'recycle', massT: 50 })], targets: { reuseByMass: null, recoveryByWeight: null } }
    const items = preDemolitionChecklist(audit, { localAuthority: 'City of London', yearBuilt: 1972 })
    expect(items.find((i) => i.id === 'not_waste_only')!.ok).toBe(false)
    expect(items.map((i) => i.id)).toContain('city_catalogue')
    expect(checklistReady(items)).toBe(false)
  })
  it('starts lines from the surveyed inventory', () => {
    const w = createSeed()
    const [r] = rowsFromItems([itemByTag(w, 'TH-01')], (i) => `ar_${i.tag}`)
    expect(r).toMatchObject({ inventory: 'reuse', family: 'steel_section', nrm: '2.1', ewcCode: '17 04 05', quantity: 48, unit: 'members', extractability: 3, quality: 4, reusableShare: 0.7, cityBand: 2 })
    closeTo(r.massT!, 24.156, 3)
  })
})
