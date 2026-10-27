import { describe, expect, it } from 'vitest'
import { actor, fresh, must, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { SEEDED_AUDIT_IDS } from '../../sandbox/seed-v3'
import { HARROWDEN_ID, TIVERNE_ID } from '../../domain/seed/world'
import { createListingsFromAudit, saveAudit } from '../actions/audits'
import { auditTotals } from '../../domain/engines/audit'
import type { PreDemolitionAudit } from '../../domain/auditTypes'
import { optionDraft, optionInput, rowDraft, rowDraftForFamily, rowInput, shareFromText, shareText } from './audits-ui'
import { FORBIDDEN } from '../../ui/testing'
import type { PreDemolitionView, PreRedevelopmentView } from './audits'

describe('the Audits tab', () => {
  it('shows the owner both audits of Tiverne House with their checks, and nothing to start', () => {
    const v = sel.auditsView(fresh(), viewer(U.tom), TIVERNE_ID)!
    expect(v.isCity).toBe(true)
    expect(v.canWrite).toBe(true)
    expect(v.audits.map((a) => [a.kindLabel, a.statusLabel])).toEqual([
      ['Pre-redevelopment audit', 'Complete'],
      ['Pre-deconstruction audit', 'Draft'],
    ])
    const pra = v.audits[0]
    expect(pra.checksDone).toBe(pra.checksTotal)
    expect(v.audits[1].checksDone).toBeLessThan(v.audits[1].checksTotal)
    expect(v.kinds.every((k) => !k.canStart && k.existingHref)).toBe(true)
  })

  it('offers the surveyor of Harrowden Court the pre-redevelopment audit to start', () => {
    const v = sel.auditsView(fresh(), viewer(U.dana), HARROWDEN_ID)!
    expect(v.isCity).toBe(false)
    expect(v.kinds.map((k) => [k.kind, k.canStart])).toEqual([
      ['pre_redevelopment', true],
      ['pre_demolition', false],
    ])
  })

  it('shows the contractor only the pre-deconstruction audit, and nothing to start', () => {
    const v = sel.auditsView(fresh(), viewer(U.kofi), TIVERNE_ID)!
    expect(v.canWrite).toBe(false)
    expect(v.kinds.map((k) => k.kind)).toEqual(['pre_demolition'])
    expect(v.kinds[0].canStart).toBe(false)
  })
})

describe('the pre-redevelopment audit of Tiverne House', () => {
  const v = sel.auditDetailView(fresh(), viewer(U.tom), TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneRetention) as PreRedevelopmentView

  it('reaches disassemble and reuse on the GLA tree', () => {
    expect(v.outcomeLabel).toBe('Disassemble and reuse')
    expect(v.tree.map((q) => q.answer)).toEqual(['yes', 'no', 'no', 'yes'])
    expect(v.outcomes.filter((o) => o.reached).map((o) => o.id)).toEqual(['disassemble_reuse'])
  })

  it('adds the City demolition default to each option, and flags the lowest whole life carbon', () => {
    const [keep, extend, rebuild] = v.options
    // 400 m2 at 50 kgCO2e per m2 over 8,600 m2 is 2.3 kgCO2e per m2.
    expect(keep.demolitionText).toBe('2.3 kgCO2e per m2')
    expect(keep.demolitionIsDefault).toBe(true)
    expect(keep.wlcWithDemolitionText).toBe('692 kgCO2e per m2')
    expect(keep.isLowestWlc).toBe(true)
    expect(keep.retrofitText).toBe('Counts as retrofit')
    expect(extend.retrofitText).toBe('Counts as retrofit')
    // 9,400 m2 over 12,900 m2 at 50 is 36.4; 1,010 plus 36.4 is 1,046.
    expect(rebuild.demolitionText).toBe('36.4 kgCO2e per m2')
    expect(rebuild.wlcWithDemolitionText).toBe('1,046 kgCO2e per m2')
    expect(rebuild.retrofitText).toBe('Does not count as retrofit')
    expect(rebuild.isPreferred).toBe(true)
  })

  it('asks for the justification and checks the preferred option against the City office benchmarks', () => {
    expect(v.needsJustification).toBe(true)
    expect(v.cityChecks.map((c) => [c.id, c.within])).toEqual([
      ['wlc_standard', true],
      ['wlc_aspirational', false],
      ['upfront_aspirational', false],
    ])
    expect(v.ready).toBe(true)
    expect(v.editable).toBe(false)
  })

  it('reads the reviewer back', () => {
    expect(v.reviewerText).toMatch(/^Nadia Orrin, Ellery Carbon Review, /)
  })

  it('carries no forbidden character', () => {
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })
})

describe('the pre-deconstruction audit of Tiverne House', () => {
  const s = fresh()
  const v = sel.auditDetailView(s, viewer(U.dana), TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneDeconstruction) as PreDemolitionView
  const audit = s.audits[SEEDED_AUDIT_IDS.tiverneDeconstruction] as PreDemolitionAudit

  it('screens every hazard the building age suggests, with the one not yet screened', () => {
    expect(v.yearBuiltText).toBe('Built in 1984')
    expect(v.hazards.map((h) => h.id)).toEqual(['asbestos', 'lead_paint', 'red_lead', 'cca_timber', 'tar_adhesive'])
    expect(v.hazards.find((h) => h.id === 'tar_adhesive')!.statusLabel).toBe('Not screened')
  })

  it('totals the inventories from the engine', () => {
    const t = auditTotals(audit.rows)
    expect(v.totalsRaw).toEqual(t)
    expect(v.inventories.map((i) => i.rows.length)).toEqual([audit.rows.filter((r) => r.inventory === 'reuse').length, audit.rows.filter((r) => r.inventory === 'recycle').length, 2])
    expect(t.recoveryByWeight).toBeGreaterThan(0.95)
    expect(v.totals.recoveryMeetsTarget).toBe(true)
    expect(v.totals.recoveryStateText).toBe('Meets the 95% target')
    expect(v.arisings[0].code).toBe('17 01 01')
  })

  it('links the surveyor to the items, and counts what can be listed early', () => {
    expect(v.rows.filter((r) => r.itemHref).length).toBe(audit.rows.filter((r) => r.itemId).length)
    expect(v.importable).toBe(0)
    expect(v.listable).toBeGreaterThan(0)
    const after = must(createListingsFromAudit(s, actor(U.dana), audit.id)).state
    expect((sel.auditDetailView(after, viewer(U.dana), TIVERNE_ID, audit.id) as PreDemolitionView).listable).toBe(0)
  })

  it('reads as editable for the surveyor and the owner, and read-only once complete', () => {
    expect(v.editable).toBe(true)
    expect(sel.auditDetailView(s, viewer(U.tom), TIVERNE_ID, audit.id)!.editable).toBe(true)
  })

  it('names the file after the building and the day', () => {
    expect(v.fileName).toBe('tiverne-house-pre-deconstruction-audit-2026-10-08.xlsx')
  })

  it('carries no forbidden character', () => {
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })
})

describe('audit form drafts', () => {
  it('reads percentages as ratios and back', () => {
    expect(shareFromText('85')).toBe(0.85)
    expect(shareFromText('85%')).toBe(0.85)
    expect(shareFromText(' ')).toBeNull()
    expect(shareFromText('lots')).toBeNaN()
    expect(shareText(0.85)).toBe('85')
    expect(shareText(0.125)).toBe('12.5')
    expect(shareText(null)).toBe('')
  })

  it('round-trips an option and a line', () => {
    const s = fresh()
    const pra = s.audits[SEEDED_AUDIT_IDS.tiverneRetention]
    const pda = s.audits[SEEDED_AUDIT_IDS.tiverneDeconstruction] as PreDemolitionAudit
    if (pra.kind !== 'pre_redevelopment') throw new Error('kind')
    const o = pra.options[0]
    expect(optionInput(optionDraft(o))).toEqual(o)
    const r = pda.rows.find((x) => x.itemId === null && x.inventory === 'reuse')!
    const { itemId: _, ...rest } = r
    expect(rowInput(rowDraft(r))).toEqual(rest)
  })

  it('fills the element, waste code and unit from the family unless they were typed', () => {
    const d = rowDraft(null)
    const defaults = sel.auditDetailView(fresh(), viewer(U.dana), TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneDeconstruction) as PreDemolitionView
    const slate = rowDraftForFamily(d, 'natural_slate', defaults.familyDefaults, '')
    expect([slate.nrm, slate.ewcCode, slate.unit]).toEqual(['2.3', '17 09 04', 'slates'])
    const typed = rowDraftForFamily({ ...slate, unit: 'pallets' }, 'stone_paving', defaults.familyDefaults, 'natural_slate')
    expect([typed.nrm, typed.unit]).toEqual(['8', 'pallets'])
  })

  it('refuses through the action what does not read as a number', () => {
    const s = fresh()
    const r = saveAudit(s, actor(U.dana), SEEDED_AUDIT_IDS.tiverneDeconstruction, { targets: { reuseByMass: shareFromText('lots') } })
    expect(r.error).not.toBeNull()
  })
})
