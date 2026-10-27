import { describe, expect, it } from 'vitest'
import { actor, fresh as seeded, must, NOW, refused, U } from '../../test/fixtures'
import { AUDIT_ERRORS, completeAudit, createAudit, createListingsFromAudit, importSurveyedItems, removeAuditRow, removeRetentionOption, reopenAudit, saveAudit, saveAuditRow, saveRetentionOption, type AuditRowInput, type RetentionOptionInput } from './audits'
import { ERRORS } from '../access'
import { listingOf } from '../lots'
import { ORG_IDS, TIVERNE_ID } from '../../domain/seed/world'
import { FENNICK_ID } from '../../sandbox/sampleIds'
import { HAZARDS, RETENTION_FACTORS } from '../../domain/reference/audit'
import { checklistReady, hazardSuggestions, preDemolitionChecklist, preRedevelopmentChecklist } from '../../domain/engines/audit'
import { SEEDED_AUDIT_IDS } from '../../sandbox/seed-v3'
import type { PreDemolitionAudit, PreRedevelopmentAudit } from '../../domain/auditTypes'
import type { AppData } from '../types'

function line(over: Partial<AuditRowInput> = {}): AuditRowInput {
  return {
    inventory: 'reuse',
    description: 'Welsh slates from the rear roof',
    family: 'natural_slate',
    nrm: '2.3',
    ewcCode: '17 09 04',
    quantity: 1200,
    unit: 'slates',
    massT: 4.2,
    extractability: 3,
    quality: 3,
    marketValue: 3,
    reusableShare: 0.8,
    cityBand: 2,
    considerations: 'Copper nails, lift by hand',
    broker: { route: 'none', status: 'not_offered', outlet: '' },
    ...over,
  }
}

function option(over: Partial<RetentionOptionInput> = {}): RetentionOptionInput {
  return { label: 'Retain and refurbish', kind: 'retain_refurbish', superstructureRetainedShare: 0.85, facadeRetainedShare: 0.6, giaM2: 9800, upfrontKgM2: 420, wlcKgM2: 760, demolishedAreaM2: 600, demolitionKgM2: null, note: '', ...over }
}

function preDemolition(s0: AppData = fresh(), who = U.tom): { s: AppData; id: string } {
  const r = must(createAudit(s0, actor(who), { buildingId: TIVERNE_ID, kind: 'pre_demolition' }))
  return { s: r.state, id: r.value }
}

/** The seeded sandbox without its sample audits, so each test starts the audit it needs. */
const fresh = (): AppData => ({ ...seeded(), audits: {} })

const pda = (s: AppData, id: string) => s.audits[id] as PreDemolitionAudit
const pra = (s: AppData, id: string) => s.audits[id] as PreRedevelopmentAudit

describe('the seeded audits', () => {
  it('holds a complete pre-redevelopment audit and a draft pre-deconstruction audit for Tiverne House, and a first draft for Harrowden Court', () => {
    const s = seeded()
    const pra = s.audits[SEEDED_AUDIT_IDS.tiverneRetention] as PreRedevelopmentAudit
    const tiv = s.audits[SEEDED_AUDIT_IDS.tiverneDeconstruction] as PreDemolitionAudit
    const har = s.audits[SEEDED_AUDIT_IDS.harrowdenDeconstruction] as PreDemolitionAudit
    expect([pra.status, tiv.status, har.status]).toEqual(['complete', 'draft', 'draft'])
    const b = s.world.buildings[TIVERNE_ID]
    expect(checklistReady(preRedevelopmentChecklist(pra, b))).toBe(true)
    // The Tiverne House draft still has a hazard to screen and lines with no route, so it cannot be completed yet.
    const open = preDemolitionChecklist(tiv, b).filter((c) => c.required && !c.ok).map((c) => c.id)
    expect(open).toEqual(['hazards', 'brokers'])
    expect(tiv.rows.filter((r) => r.itemId).length).toBe(Object.values(s.world.items).filter((i) => i.buildingId === TIVERNE_ID).length)
  })

  it('refuses a second audit of the same kind on a building', () => {
    const s = seeded()
    refused(s, createAudit(s, actor(U.tom), { buildingId: TIVERNE_ID, kind: 'pre_demolition' }), AUDIT_ERRORS.exists)
  })
})

describe('who writes an audit', () => {
  it('lets the owner and the surveyor start one, and logs it', () => {
    for (const who of [U.tom, U.dana]) {
      const { s, id } = preDemolition(fresh(), who)
      const a = pda(s, id)
      expect(a).toMatchObject({ kind: 'pre_demolition', status: 'draft', buildingId: TIVERNE_ID, authorUserId: who, createdAt: NOW, independence: 'not_declared', rows: [], hazards: [] })
      expect(id).toMatch(/^aud_/)
      expect(s.activity.some((x) => x.text === 'started a pre-deconstruction audit' && x.href === `/app/buildings/${TIVERNE_ID}/audits/${id}`)).toBe(true)
    }
  })

  it('refuses the contractor, an architect and a client', () => {
    const s0 = fresh()
    for (const who of [U.kofi, U.priya, U.isla]) refused(s0, createAudit(s0, actor(who), { buildingId: TIVERNE_ID, kind: 'pre_demolition' }), ERRORS.noAccess)
  })

  it('refuses the contractor on every edit of an audit the owner started', () => {
    const { s, id } = preDemolition()
    refused(s, saveAudit(s, actor(U.kofi), id, { summary: 'x' }), ERRORS.noAccess)
    refused(s, saveAuditRow(s, actor(U.kofi), id, line()), ERRORS.noAccess)
    refused(s, importSurveyedItems(s, actor(U.kofi), id), ERRORS.noAccess)
    refused(s, completeAudit(s, actor(U.kofi), id), ERRORS.noAccess)
    refused(s, createListingsFromAudit(s, actor(U.kofi), id), ERRORS.noAccess)
  })

  it('starts a pre-redevelopment audit with every factor unrated and the tree unanswered', () => {
    const r = must(createAudit(fresh(), actor(U.tom), { buildingId: TIVERNE_ID, kind: 'pre_redevelopment' }))
    const a = pra(r.state, r.value)
    expect(Object.keys(a.factors)).toEqual(RETENTION_FACTORS.map((f) => f.id))
    expect(Object.values(a.factors).every((f) => f.scale === null)).toBe(true)
    expect(a.tree).toEqual({ feasibleToRetain: null, suitedInWhole: null, suitedInPart: null, recoverResidualValue: null })
    expect(a.options).toEqual([])
  })
})

describe('saving an audit', () => {
  it('changes only the fields given, trimmed', () => {
    const { s, id } = preDemolition()
    const r = must(saveAudit(s, actor(U.tom), id, { summary: '  A 1984 office.  ', independence: 'independent', surveyedOn: '2026-10-02' }))
    expect(pda(r.state, id)).toMatchObject({ summary: 'A 1984 office.', independence: 'independent', surveyedOn: '2026-10-02', auditorName: 'Ostlea Estates' })
  })

  it('refuses a date that is not real and a target over 100%', () => {
    const { s, id } = preDemolition()
    refused(s, saveAudit(s, actor(U.tom), id, { surveyedOn: '2026-02-30' }), AUDIT_ERRORS.date)
    refused(s, saveAudit(s, actor(U.tom), id, { targets: { recoveryByWeight: 1.2 } }), AUDIT_ERRORS.share)
    refused(s, saveAudit(s, actor(U.tom), id, { hazard: { id: 'asbestos', status: 'maybe' as never, basis: null, note: '' } }), ERRORS.role)
  })

  it('keeps one entry per hazard', () => {
    const { s, id } = preDemolition()
    let t = must(saveAudit(s, actor(U.tom), id, { hazard: { id: 'asbestos', status: 'suspected', basis: 'era', note: '' } })).state
    t = must(saveAudit(t, actor(U.tom), id, { hazard: { id: 'asbestos', status: 'confirmed', basis: 'survey', note: 'Ceiling void boards' } })).state
    expect(pda(t, id).hazards).toEqual([{ id: 'asbestos', status: 'confirmed', basis: 'survey', note: 'Ceiling void boards' }])
  })

  it('drops follow-on assessments that are not on the list', () => {
    const r = must(createAudit(fresh(), actor(U.tom), { buildingId: TIVERNE_ID, kind: 'pre_redevelopment' }))
    const t = must(saveAudit(r.state, actor(U.tom), r.value, { followOn: ['Structural assessment', 'Horoscope'] })).state
    expect(pra(t, r.value).followOn).toEqual(['Structural assessment'])
  })
})

describe('audit lines', () => {
  it('adds a line with a local ID, then replaces it in place', () => {
    const { s, id } = preDemolition()
    const a = must(saveAuditRow(s, actor(U.dana), id, line()))
    expect(a.value).toBe(`${id}_r1`)
    const b = must(saveAuditRow(a.state, actor(U.dana), id, line({ id: a.value, quantity: 1100 })))
    expect(b.value).toBe(a.value)
    expect(pda(b.state, id).rows).toHaveLength(1)
    expect(pda(b.state, id).rows[0]).toMatchObject({ quantity: 1100, itemId: null, reusableShare: 0.8 })
  })

  it('refuses scores over 4, a band outside 1 to 6, an unknown family or element, and a nameless line', () => {
    const { s, id } = preDemolition()
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ quality: 5 })), AUDIT_ERRORS.score)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ extractability: 2.5 })), AUDIT_ERRORS.score)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ cityBand: 7 })), AUDIT_ERRORS.band)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ cityBand: 0 })), AUDIT_ERRORS.band)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ family: 'marble' as never })), AUDIT_ERRORS.family)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ nrm: '9.9' })), AUDIT_ERRORS.nrm)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ massT: -1 })), AUDIT_ERRORS.number)
    refused(s, saveAuditRow(s, actor(U.tom), id, line({ description: '   ' })), AUDIT_ERRORS.label)
  })

  it('keeps no reusable share on a line that is not for reuse', () => {
    const { s, id } = preDemolition()
    const r = must(saveAuditRow(s, actor(U.tom), id, line({ inventory: 'recycle' })))
    expect(pda(r.state, id).rows[0].reusableShare).toBeNull()
  })

  it('removes a line', () => {
    const { s, id } = preDemolition()
    const a = must(saveAuditRow(s, actor(U.tom), id, line()))
    const b = must(removeAuditRow(a.state, actor(U.tom), id, a.value))
    expect(pda(b.state, id).rows).toEqual([])
  })

  it('brings in every surveyed item once', () => {
    const { s, id } = preDemolition()
    const items = Object.values(s.world.items).filter((i) => i.buildingId === TIVERNE_ID)
    const a = must(importSurveyedItems(s, actor(U.dana), id))
    expect(a.value).toBe(items.length)
    expect(new Set(pda(a.state, id).rows.map((r) => r.itemId))).toEqual(new Set(items.map((i) => i.id)))
    const b = importSurveyedItems(a.state, actor(U.dana), id)
    expect(b.value).toBe(0)
    expect(b.state).toBe(a.state)
  })
})

describe('retention options', () => {
  function started() {
    const r = must(createAudit(fresh(), actor(U.tom), { buildingId: TIVERNE_ID, kind: 'pre_redevelopment' }))
    return { s: r.state, id: r.value }
  }

  it('adds options, and clears the preferred one when it is removed', () => {
    const { s, id } = started()
    const a = must(saveRetentionOption(s, actor(U.tom), id, option()))
    const b = must(saveRetentionOption(a.state, actor(U.tom), id, option({ label: 'New build', kind: 'new_build', superstructureRetainedShare: 0 })))
    expect([a.value, b.value]).toEqual([`${id}_o1`, `${id}_o2`])
    const c = must(saveAudit(b.state, actor(U.tom), id, { preferredOptionId: b.value }))
    expect(pra(c.state, id).preferredOptionId).toBe(b.value)
    const d = must(removeRetentionOption(c.state, actor(U.tom), id, b.value))
    expect(pra(d.state, id).options.map((o) => o.id)).toEqual([a.value])
    expect(pra(d.state, id).preferredOptionId).toBeNull()
  })

  it('refuses a preferred option that is not in the audit, and shares over 100%', () => {
    const { s, id } = started()
    refused(s, saveAudit(s, actor(U.tom), id, { preferredOptionId: 'aud_x_o9' }), ERRORS.role)
    refused(s, saveRetentionOption(s, actor(U.tom), id, option({ facadeRetainedShare: 1.5 })), AUDIT_ERRORS.share)
    refused(s, saveRetentionOption(s, actor(U.tom), id, option({ label: '' })), AUDIT_ERRORS.label)
  })
})

/** A Tiverne House pre-deconstruction audit filled in enough to complete. */
function readyPreDemolition(): { s: AppData; id: string } {
  const { s: s0, id } = preDemolition()
  let s = must(importSurveyedItems(s0, actor(U.dana), id)).state
  s = must(createListingsFromAudit(s, actor(U.tom), id)).state
  for (const h of hazardSuggestions(1984)) s = must(saveAudit(s, actor(U.tom), id, { hazard: { id: h, status: 'suspected', basis: 'era', note: '' } })).state
  s = must(saveAudit(s, actor(U.tom), id, { independence: 'independent', targets: { reuseByMass: 0.3, recoveryByWeight: 0.95 } })).state
  return { s, id }
}

describe('completing and reopening', () => {
  it('refuses to complete an audit whose checklist is not done', () => {
    const { s, id } = preDemolition()
    refused(s, completeAudit(s, actor(U.tom), id), AUDIT_ERRORS.notReady)
  })

  it('completes a ready pre-deconstruction audit and tells the surveyor and the contractor, not the owner', () => {
    const { s, id } = readyPreDemolition()
    expect(hazardSuggestions(1984)).toHaveLength(HAZARDS.length - 1)
    const r = must(completeAudit(s, actor(U.tom), id))
    expect(pda(r.state, id)).toMatchObject({ status: 'complete', completedAt: NOW })
    const told = r.state.notifications.filter((n) => n.kind === 'audit').map((n) => n.orgId)
    expect(new Set(told)).toEqual(new Set([ORG_IDS.tarnbrook, FENNICK_ID]))
    expect(r.state.notifications.find((n) => n.kind === 'audit')!.title).toBe('Ostlea Estates completed the pre-deconstruction audit of Tiverne House')
  })

  it('locks a complete audit until it is reopened', () => {
    const { s, id } = readyPreDemolition()
    const done = must(completeAudit(s, actor(U.tom), id)).state
    refused(done, saveAudit(done, actor(U.tom), id, { summary: 'x' }), AUDIT_ERRORS.complete)
    refused(done, saveAuditRow(done, actor(U.tom), id, line()), AUDIT_ERRORS.complete)
    const open = must(reopenAudit(done, actor(U.dana), id)).state
    expect(pda(open, id)).toMatchObject({ status: 'draft', completedAt: null })
    expect(must(saveAudit(open, actor(U.tom), id, { summary: 'Updated' })).state.audits[id].summary).toBe('Updated')
  })

  it('needs a peer reviewer and carbon for every option on a City of London pre-redevelopment audit, and does not tell the contractor', () => {
    const r = must(createAudit(fresh(), actor(U.tom), { buildingId: TIVERNE_ID, kind: 'pre_redevelopment' }))
    const id = r.value
    let s = r.state
    for (const f of RETENTION_FACTORS) s = must(saveAudit(s, actor(U.tom), id, { factor: { id: f.id, scale: 'not_prohibit', note: '' } })).state
    s = must(saveAudit(s, actor(U.tom), id, { tree: { feasibleToRetain: 'yes', suitedInWhole: 'yes' }, independence: 'independent' })).state
    const keep = must(saveRetentionOption(s, actor(U.tom), id, option()))
    const nb = must(saveRetentionOption(keep.state, actor(U.tom), id, option({ label: 'New build', kind: 'new_build', superstructureRetainedShare: 0, upfrontKgM2: null })))
    s = must(saveAudit(nb.state, actor(U.tom), id, { preferredOptionId: keep.value })).state
    refused(s, completeAudit(s, actor(U.tom), id), AUDIT_ERRORS.notReady)
    s = must(saveRetentionOption(s, actor(U.tom), id, option({ id: nb.value, label: 'New build', kind: 'new_build', superstructureRetainedShare: 0, upfrontKgM2: 980, wlcKgM2: 1450 }))).state
    refused(s, completeAudit(s, actor(U.tom), id), AUDIT_ERRORS.notReady)
    s = must(saveAudit(s, actor(U.tom), id, { reviewer: { name: 'Nadia Orrin', organisation: 'Ellery Carbon Review', reviewedOn: '2026-10-05', note: '' } })).state
    const done = must(completeAudit(s, actor(U.tom), id)).state
    expect(done.audits[id].status).toBe('complete')
    const told = done.notifications.filter((n) => n.kind === 'audit').map((n) => n.orgId)
    expect(told).toEqual([ORG_IDS.tarnbrook])
  })
})

describe('listing early from the audit', () => {
  it('marks surveyed lines as offered on Tallyard and makes private lots for new lines', () => {
    const { s: s0, id } = preDemolition()
    let s = must(importSurveyedItems(s0, actor(U.dana), id)).state
    const surveyed = pda(s, id).rows.filter((r) => r.inventory === 'reuse').length
    const slate = must(saveAuditRow(s, actor(U.dana), id, line()))
    const steel = must(saveAuditRow(slate.state, actor(U.dana), id, line({ description: 'Loose steel angles', family: 'steel_section', nrm: '2.1', quantity: 40, unit: 'pieces', massT: 0.8 })))
    s = steel.state
    const lotsBefore = Object.keys(s.world.lots).length
    const r = must(createListingsFromAudit(s, actor(U.dana), id))
    expect(r.value).toEqual({ created: 1, marked: surveyed, skipped: 1 })
    const rows = pda(r.state, id).rows
    const made = rows.find((x) => x.id === slate.value)!
    expect(made.broker).toEqual({ route: 'marketplace', status: 'offered', outlet: '' })
    expect(made.itemId).not.toBeNull()
    const item = r.state.world.items[made.itemId!]
    expect(item).toMatchObject({ family: 'natural_slate', buildingId: TIVERNE_ID, quantity: { kind: 'pieces', pieces: 1200 }, condition: 'B', recoverability: 'B' })
    expect(Object.keys(r.state.world.lots)).toHaveLength(lotsBefore + 1)
    const lot = Object.values(r.state.world.lots).find((l) => l.itemId === made.itemId)!
    expect(lot.visibility).toBe('private')
    expect(JSON.stringify(listingOf(r.state.world, lot))).not.toContain('pre-deconstruction audit')
    expect(rows.find((x) => x.id === steel.value)!.itemId).toBeNull()
  })

  it('leaves lines reused on site or sent to another outlet alone', () => {
    const { s: s0, id } = preDemolition()
    const a = must(saveAuditRow(s0, actor(U.tom), id, line({ broker: { route: 'reuse_on_site', status: 'agreed', outlet: '' } })))
    refused(a.state, createListingsFromAudit(a.state, actor(U.tom), id), AUDIT_ERRORS.noLines)
  })
})
