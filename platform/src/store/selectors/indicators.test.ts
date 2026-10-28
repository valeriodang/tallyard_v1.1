// The indicators panel and Help for round 3 (stage 6d): the figures each workspace reads, the latest changes with a
// link for each person, and the glossary's three meanings of reuse.
import { describe, expect, it } from 'vitest'
import { actor, fresh, must, NOW, U, viewer } from '../../test/fixtures'
import * as sel from '.'
import { MERROWGATE_ID, TIVERNE_ID } from '../../domain/seed/world'
import { saveCesSettings } from '../actions/ces'
import { routeAccess } from './nav'
import { latestChangesView, ROUND_3_CHANGES, ROUND_2_TITLE, whatChangedView } from './whatChanged'
import { GLOSSARY, REUSE_DEFINITIONS } from '../../domain/reference/glossary'
import { FORBIDDEN } from '../../ui/testing'

const M = MERROWGATE_ID

describe('the indicators panel', () => {
  it('reads a project for each side of it, in shares only', () => {
    const s = fresh()
    const v = sel.projectIndicators(s, viewer(U.marcus), M)!
    expect(v.content).toEqual([
      { label: 'Reused content', byMass: '0.5%', byValue: '2.4%' },
      { label: 'Recycled content', byMass: '14.4%', byValue: '17.5%' },
    ])
    expect(v.whole).toMatchObject({ shareText: '0.5%', position: 'below', bandText: 'Conventional buildings reach 1% to 10%' })
    expect(v.layers.map((l) => [l.id, l.shareText, l.bandText, l.position])).toEqual([
      ['structure', '0%', '1% to 5%', 'below'],
      ['skin', '12.3%', '5% to 15%', 'within'],
      ['space_plan', '3.9%', '10% to 25%', 'below'],
    ])
    expect(v.eol).toEqual({ scoreText: '0.49', scenarioLabel: 'Business as usual' })
    for (const who of [U.priya, U.isla, U.marcus]) expect(JSON.stringify(sel.projectIndicators(s, viewer(who), M))).not.toMatch(/£|FORBIDDEN/)
    expect(sel.projectIndicators(s, viewer(U.tom), M)).toBeNull()
    expect(JSON.stringify(v)).not.toMatch(FORBIDDEN)
  })

  it("follows the statement's end-of-life scenario: best practice scores higher", () => {
    const s = must(saveCesSettings(fresh(), actor(U.marcus), M, { eolScenario: 'best' })).state
    const best = sel.projectIndicators(s, viewer(U.marcus), M)!.eol
    expect(best.scenarioLabel).toBe('Best practice')
    expect(Number(best.scoreText)).toBeGreaterThan(0.49)
  })

  it("lists the client's projects, and scores the owner's recovery plans against business as usual", () => {
    const s = fresh()
    const c = sel.clientIndicators(s, viewer(U.isla))!
    expect(c.rows.find((r) => r.projectId === M)).toMatchObject({ reuseText: '0.5%', positionText: 'Below the band', eolText: '0.49', href: `/app/projects/${M}/sustainability` })
    const o = sel.ownerIndicators(s, viewer(U.tom))!
    expect(o.rows.find((r) => r.buildingId === TIVERNE_ID)).toMatchObject({ scoreText: '0.68', bauScoreText: '0.58', href: `/app/buildings/${TIVERNE_ID}/priorities` })
    // An architect is no client, and a client owns no building.
    expect(sel.clientIndicators(s, viewer(U.priya))).toBeNull()
    expect(sel.ownerIndicators(s, viewer(U.isla))).toBeNull()
  })
})

describe('Help, Updated on 28 October', () => {
  it('lists every round 3 change once for each sample person, theirs first, each of theirs with a link they can open', () => {
    const s = fresh()
    for (const who of Object.values(U)) {
      const v = latestChangesView(s, { userId: who, now: NOW })
      expect(v.title).toBe('Updated on 28 October')
      expect([...v.yours, ...v.others].map((c) => c.id).sort()).toEqual(ROUND_3_CHANGES.map((c) => c.id).sort())
      expect(v.yours.length).toBeGreaterThan(0)
      for (const c of v.yours) {
        expect(c.link, `${who} ${c.id}`).not.toBeNull()
        expect(routeAccess(s, { userId: who, now: NOW }, c.link!.href), `${who} ${c.id}`).toBe('ok')
      }
      for (const c of v.others) expect(c.link).toBeNull()
      for (const c of [...v.yours, ...v.others]) for (const t of [c.title, c.text, c.forText, c.link?.label ?? '']) expect(t).not.toMatch(FORBIDDEN)
    }
    expect(whatChangedView(s, { userId: U.priya, now: NOW }).title).toBe(ROUND_2_TITLE)
  })

  it('names the contractor in who a change is for', () => {
    const v = latestChangesView(fresh(), { userId: U.kofi, now: NOW })
    expect([...v.yours, ...v.others].find((c) => c.id === 'audits')!.forText).toBe('For donor building owners, surveyors and deconstruction contractors')
    expect(v.yours.find((c) => c.id === 'glossary')!.forText).toBe('For everyone')
  })
})

describe('the glossary', () => {
  it('gives three meanings of reuse and how LEED splits it, each with its source, in plain words', () => {
    expect(REUSE_DEFINITIONS.map((e) => e.term)).toEqual(['Reuse, in the GLA statement', 'Reuse, of a building component', 'Reused in situ', 'On-site and off-site reuse, in LEED'])
    expect(REUSE_DEFINITIONS[0].text).toContain('crushed concrete and hardcore used as fill are recycling')
    const ids = [...REUSE_DEFINITIONS, ...GLOSSARY].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of [...REUSE_DEFINITIONS, ...GLOSSARY]) {
      expect(e.source.length, e.id).toBeGreaterThan(0)
      for (const t of [e.term, e.text, e.source]) expect(t, e.id).not.toMatch(FORBIDDEN)
    }
    // Sorted by term, so a reader can scan it.
    expect(GLOSSARY.map((e) => e.term)).toEqual([...GLOSSARY.map((e) => e.term)].sort((a, b) => a.localeCompare(b, 'en-GB')))
  })
})
