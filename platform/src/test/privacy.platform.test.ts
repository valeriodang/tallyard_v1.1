// P3: privacy by construction, proved on every view model. The buyer side (architect, client, consultant) never
// receives a seller-private string; the seller never receives a buyer-private string before accepting a request.
import { describe, it, expect } from 'vitest'
import { actor, addTestUser, fresh, must, U, viewer } from './fixtures'
import { openShareLink } from '../store/actions/links'
import { inviteContractorByEmail, setContractorDates } from '../store/actions/contractor'
import { createBuilding, createOwnerProject } from '../store/actions/owner'
import { createSurveyBuilding } from '../store/actions/claims'
import { FENNICK_ID, TIVERNE_LINK_ID } from '../sandbox/seed-owner-surveyor'
import { dateFormats } from '../domain/dates'
import type { AppData, Viewer } from '../store/types'
import { auditPrivateStrings, contractorWorkPrivateStrings, lotPrivateStrings, projectPrivateStrings, INTERNAL_ID } from '../domain/privacy/privateStrings'
import { createListingsFromAudit } from '../store/actions/audits'
import { setArisingsTitle, workFor } from '../store/actions/contractorWork'
import { saveItemQuality, saveSteelRecord } from '../store/actions/quality'
import { SEEDED_AUDIT_IDS } from '../sandbox/seed-v3'
import type { PreDemolitionAudit } from '../domain/auditTypes'
import { HARROWDEN_ID, itemByTag, lotForItem, MERROWGATE_ID, ORG_IDS, SALLOW_ID, TIVERNE_ID } from '../domain/seed/world'
import { DEFAULT_DISCOVER_QUERY } from '../store/selectors/discover'
import * as sel from '../store/selectors'
import { projectsOfUser, buildingsOfUser } from '../store/access'
import { listingOf, marketplaceListings, projectCanSee, projectWishlist } from '../store/lots'
import { saveToProject, sendToClient, decideItem } from '../store/actions/shortlist'
import { createProject, decideClientLink, updateProject } from '../store/actions/projects'
import { requestReservation, decideReservation, withdrawReservation } from '../store/actions/reservations'
import { setLotPortfolio, setLotVisibility, setProjectAccess } from '../store/actions/owner'
import { captureItem } from '../store/actions/surveyor'
import { draftFromText } from '../store/capture'
import { itemsOf } from '../store/selectors/owner'
import { SCHEME_IDS } from '../domain/reference/certification'
import { addRequirementEvidence, reviewStatement, sendStatementForReview, setCreditStatus, setGoalTarget, setRequirementStatus } from '../store/actions/sustainability'
import { projectVisual, projectVisuals } from '../store/selectors/project-visuals'

const LOT_ID = /\blot_[a-z0-9]{6}\b/

/**
 * An IFC file with its GlobalIds masked. They are hashes of the public ID and a role (ifc.test.ts proves it), so
 * a short private string such as a postcode district can appear inside one by chance; everything else is scanned.
 */
function ifcScanned(file: ReturnType<typeof sel.geometryFile>): unknown {
  if (!file || file.kind !== 'file') return file
  return { ...file, text: file.text.replace(/'[0-3][0-9A-Za-z_$]{21}'/g, "'GLOBALID'") }
}

function allLotStrings(s: AppData): string[] {
  const out = new Set<string>()
  for (const lot of Object.values(s.world.lots)) {
    const item = s.world.items[lot.itemId]
    for (const x of lotPrivateStrings(lot, item, s.world.buildings[item.buildingId], s.world)) out.add(x)
  }
  return [...out]
}

function allProjectStrings(s: AppData): string[] {
  const out = new Set<string>()
  for (const p of Object.values(s.world.projects)) for (const x of projectPrivateStrings(p, s.world)) out.add(x)
  return [...out]
}

/** Every view model a buyer-side person can open, as named JSON. */
function buyerViews(s: AppData, v: Viewer): [string, unknown][] {
  const out: [string, unknown][] = []
  const add = (name: string, x: unknown) => out.push([name, x])
  add('architectHome', sel.architectHome(s, v))
  add('clientHome', sel.clientHome(s, v))
  add('consultantHome', sel.consultantHome(s, v))
  add('consultantDashboard', sel.consultantDashboard(s, v))
  add('clientIndicators', sel.clientIndicators(s, v))
  add('discover', sel.discoverView(s, v, DEFAULT_DISCOVER_QUERY))
  add('discover structure', sel.discoverView(s, v, { ...DEFAULT_DISCOVER_QUERY, typology: 'structure' }))
  add('newForProjects', sel.newForProjectsFeed(s, v, null))
  add('saved', sel.savedView(s, v))
  add('projects', sel.projectsListView(s, v))
  add('newProject', sel.newProjectOptions(s, v))
  add('inbox', sel.inboxView(s, v))
  add('bell', sel.bellView(s, v))
  add('nav', sel.navModel(s, v))
  add('search', sel.searchIndex(s, v))
  add('team', sel.teamView(s, v))
  add('profile', sel.profileView(s, v))
  add('organisation', sel.organisationView(s, v))
  add('notificationSettings', sel.notificationSettings(s, v))
  add('engagements', sel.engagementsOf(s, v).map((e) => sel.wasteView(s, v, e.id)))
  add('linkRequests', sel.clientLinkRequests(s, v))
  add('clientDashboard', sel.clientDashboard(s, v))
  add('clientProgramme', sel.clientProgramme(s, v))
  add('projectVisuals', projectVisuals(s, v))
  const publicIds = new Set(marketplaceListings(s).map((l) => l.publicId))
  for (const p of projectsOfUser(s, v.userId)) {
    add(`discover ${p.name}`, sel.discoverView(s, v, { ...DEFAULT_DISCOVER_QUERY, projectId: p.id, tab: 'shared', fitsOnly: true }))
    add(`landing ${p.name}`, sel.discoverView(s, v, { ...DEFAULT_DISCOVER_QUERY, projectId: p.id }))
    add(`newForProjects ${p.name}`, sel.newForProjectsFeed(s, v, p.id))
    add(`header ${p.name}`, sel.projectHeader(s, v, p.id))
    add(`overview ${p.name}`, sel.projectOverview(s, v, p.id))
    add(`programme ${p.name}`, [sel.programmeView(s, v, p.id, 'whole'), sel.programmeView(s, v, p.id, 'ahead')])
    add(`requirements ${p.name}`, sel.projectRequirementsView(s, v, p.id))
    add(`programme form ${p.name}`, sel.programmeForm(s, v, p.id))
    add(`change client ${p.name}`, sel.changeClientOptions(s, v, p.id))
    add(`visual ${p.name}`, projectVisual(s, v, p.id))
    add(`board ${p.name}`, sel.shortlistBoard(s, v, p.id))
    add(`spec ${p.name}`, [sel.specificationView(s, v, p.id, 'approved'), sel.specificationView(s, v, p.id, 'draft')])
    add(`carbon ${p.name}`, sel.projectCarbon(s, v, p.id))
    add(`team ${p.name}`, sel.projectTeam(s, v, p.id))
    add(`activity ${p.name}`, sel.projectActivity(s, v, p.id))
    add(`approvals ${p.name}`, sel.approvalsView(s, v, p.id))
    add(`reservations ${p.name}`, sel.reservationsView(s, v, p.id))
    add(`compliance ${p.name}`, sel.complianceView(s, v, p.id))
    add(`stock ${p.name}`, sel.stockMatchView(s, v, p.id))
    add(`procurement ${p.name}`, sel.procurementView(s, v, p.id))
    for (const [name, view] of sustainabilityViews(s, v, p.id)) add(`${name} ${p.name}`, view)
    for (const it of projectWishlist(s.world, p.id)?.items ?? []) publicIds.add(it.publicId)
    for (const g of sel.sharedGroups(s, v)) for (const c of g.cards) publicIds.add(c.publicId)
  }
  for (const id of publicIds) {
    for (const p of [null, ...projectsOfUser(s, v.userId).map((x) => x.id)]) add(`material ${id} ${p}`, sel.materialView(s, v, id, p))
    add(`geometry ${id}`, [sel.geometryFile(s, v, id, 'dxf'), sel.geometryFile(s, v, id, 'obj'), ifcScanned(sel.geometryFile(s, v, id, 'ifc'))])
  }
  return out
}

/** The round 2 sustainability view models for one project (client-consultant design, section 10). */
function sustainabilityViews(s: AppData, v: Viewer, projectId: string): [string, unknown][] {
  return [
    ['sustainability', sel.sustainabilityView(s, v, projectId)],
    ['goalRows', sel.goalRows(s, v, projectId)],
    ['goals', sel.goalsView(s, v, projectId)],
    ['requirementsTracking', sel.requirementsView(s, v, projectId)],
    ['statement', sel.statementView(s, v, projectId)],
    ['certificationSummary', sel.certificationSummary(s, v, projectId)],
    ...SCHEME_IDS.map((id): [string, unknown] => [`certification ${id}`, sel.certificationView(s, v, projectId, id)]),
    ['complianceWorkbook', sel.complianceWorkbook(s, v, projectId)],
    ['tracking', sel.sustainabilityTracking(s, v, projectId)],
    ['projectMetrics', sel.projectMetrics(s, v, projectId)],
    ['ces', sel.cesView(s, v, projectId)],
    ['cesTemplate', sel.cesTemplate(s, v, projectId)],
    ['city', sel.cityView(s, v, projectId)],
    ['indicators', sel.projectIndicators(s, v, projectId)],
  ]
}

/** Every view model an asset owner can open, as named JSON. */
function ownerViews(s: AppData, v: Viewer): [string, unknown][] {
  const out: [string, unknown][] = []
  const add = (name: string, x: unknown) => out.push([name, x])
  add('ownerHome', sel.ownerHome(s, v))
  add('ownerDashboard', sel.ownerDashboard(s, v))
  add('ownerIndicators', sel.ownerIndicators(s, v))
  add('buildings', sel.buildingsList(s, v))
  add('sharing', sel.sharingView(s, v))
  add('requests', sel.requestsView(s, v))
  add('inbox', sel.inboxView(s, v))
  add('bell', sel.bellView(s, v))
  add('nav', sel.navModel(s, v))
  add('search', sel.searchIndex(s, v))
  add('team', sel.teamView(s, v))
  add('notificationSettings', sel.notificationSettings(s, v))
  for (const b of buildingsOfUser(s, v.userId)) {
    add(`overview ${b.name}`, sel.buildingOverview(s, v, b.id))
    add(`inventory ${b.name}`, sel.inventoryView(s, v, b.id))
    add(`priorities ${b.name}`, sel.prioritiesView(s, v, b.id))
    add(`listings ${b.name}`, sel.listingsView(s, v, b.id))
    add(`capture ${b.name}`, sel.captureView(s, v, b.id))
    for (const item of itemsOf(s, b.id)) {
      add(`item ${item.tag}`, sel.itemDetail(s, v, b.id, item.id))
      const lot = lotForItem(s.world, item.id)
      add(`draft ${item.tag}`, sel.listingDraftView(s, v, lot.id, { visibility: 'published', ask: '100', reserve: '90', availableFrom: '' }))
    }
  }
  // Audit 16 October, note C5: every owner reads the marketplace, so its pages are owner views too.
  for (const [name, view] of ownerMarketplaceViews(s, v)) add(name, view)
  return out
}

/** The marketplace as a donor building owner reads it: the landing, a folder and each material page it can open. */
function ownerMarketplaceViews(s: AppData, v: Viewer): [string, unknown][] {
  const out: [string, unknown][] = [
    ['marketplace', sel.discoverView(s, v, DEFAULT_DISCOVER_QUERY)],
    ['marketplace structure', sel.discoverView(s, v, { ...DEFAULT_DISCOVER_QUERY, typology: 'structure' })],
    ['build prompt', sel.ownerBuildPrompt(s, v)],
  ]
  for (const l of marketplaceListings(s)) out.push([`material ${l.publicId}`, sel.materialView(s, v, l.publicId, null)])
  return out
}

function expectNone(views: [string, unknown][], strings: string[], who: string): void {
  for (const [name, view] of views) {
    const text = JSON.stringify(view)
    for (const x of strings) expect(text.includes(x), `${who}, ${name} leaks "${x}"`).toBe(false)
  }
}

function expectNoInternalIds(views: [string, unknown][], who: string): void {
  for (const [name, view] of views) {
    const text = JSON.stringify(view)
    expect(INTERNAL_ID.test(text), `${who}, ${name} holds an internal ID`).toBe(false)
    expect(LOT_ID.test(text), `${who}, ${name} holds a lot ID`).toBe(false)
  }
}

/** A busy sandbox: shortlists, a new request, new listings, a new share and a new capture, nothing accepted. */
function busy(): AppData {
  let s = fresh()
  s = must(saveToProject(s, actor(U.priya), 'L-9F4CQQ', MERROWGATE_ID)).state
  s = must(saveToProject(s, actor(U.priya), 'L-9F4CQQ', SALLOW_ID)).state
  s = must(saveToProject(s, actor(U.priya), 'L-MNY55K', MERROWGATE_ID)).state
  const item = projectWishlist(s.world, MERROWGATE_ID)!.items.find((x) => x.publicId === 'L-9F4CQQ')!.id
  s = must(sendToClient(s, actor(U.priya), MERROWGATE_ID, null, 'Two for the frame.')).state
  s = must(decideItem(s, actor(U.isla), MERROWGATE_ID, item, 'approved', 'Yes.')).state
  s = must(requestReservation(s, actor(U.isla), MERROWGATE_ID, item, 'For the upper floors.')).state
  s = must(setLotVisibility(s, actor(U.tom), lotForItem(s.world, itemByTag(s.world, 'TH-07').id).id, { visibility: 'published', ask: 180, reserve: 165 })).state
  s = must(setLotVisibility(s, actor(U.tom), lotForItem(s.world, itemByTag(s.world, 'TH-08').id).id, { visibility: 'shared', ask: 300, reserve: 270 })).state
  s = must(setProjectAccess(s, actor(U.tom), SALLOW_ID, true)).state
  const d = draftFromText('30 no. 203x203x46 UC, 3.2m long, bolted, roof plant room')
  s = must(captureItem(s, actor(U.dana), { buildingId: TIVERNE_ID, spec: d.spec!, quantity: d.quantity!, condition: 'A', recoverability: 'A', location: d.location, notes: '', photoIds: [], expectedAvailableFrom: null })).state
  return s
}

describe('P3 on the platform: the buyer side never receives a seller-private string', () => {
  for (const [label, make] of [['fresh sandbox', fresh], ['busy sandbox', busy]] as const) {
    it(`architect, client and consultant views, ${label}`, () => {
      const s = make()
      const strings = allLotStrings(s)
      expect(strings).toEqual(expect.arrayContaining(['Tiverne House', 'Ostlea Estates', 'Tom Ashby', 'Dana Kowalski', 'Tarnbrook Deconstruction', 'TH-01', 'OS-11']))
      for (const [who, id] of [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const) {
        const views = buyerViews(s, viewer(id))
        expect(views.length).toBeGreaterThan(30)
        expectNone(views, strings, who)
        expectNoInternalIds(views, who)
      }
    })
  }

  it('after the seller accepts, the client sees the seller; the architect and consultant still do not', () => {
    let s = busy()
    const res = Object.values(s.reservations).find((r) => r.publicId === 'L-9F4CQQ')!
    s = must(decideReservation(s, actor(U.tom), res.id, 'accepted', 'Held for you.')).state
    const client = JSON.stringify(sel.reservationsView(s, viewer(U.isla), MERROWGATE_ID))
    expect(client).toContain('Ostlea Estates')
    expect(client).toContain('Tom Ashby')
    expect(client).toContain('tom.ashby@ostlea.example')
    const strings = allLotStrings(s)
    expectNone(buyerViews(s, viewer(U.priya)), strings, 'Priya')
    expectNone(buyerViews(s, viewer(U.marcus)), strings, 'Marcus')
  })

  it('architects and consultants get no guide price and no seller details; the IFC file carries no private string', () => {
    const s = busy()
    for (const id of [U.priya, U.marcus]) {
      const m = sel.materialView(s, viewer(id), 'L-9F4CQQ', null)!
      expect(m.price).toBeNull()
      expect(m.sellerLine).toBeNull()
      expect(m.location.seller).toBeNull()
      expect(m.listing.sellerType.length).toBeGreaterThan(0)
      // Outside the public listing objects themselves, nothing carries the seller type.
      expect(JSON.stringify(m, (k, x) => (k === 'listing' ? undefined : x))).not.toContain('sellerType')
    }
    const strings = allLotStrings(s)
    for (const l of marketplaceListings(s)) {
      const file = sel.geometryFile(s, viewer(U.priya), l.publicId, 'ifc')!
      expect(file.kind).toBe(l.family === 'timber_joist' ? 'unavailable' : 'file')
      const text = JSON.stringify(ifcScanned(file))
      expect(text).not.toContain('£')
      for (const x of strings) expect(text.includes(x), `${l.publicId} IFC leaks "${x}"`).toBe(false)
    }
  })

  it('a lot shared in confidence opens for the architect and client only, and no consultant surface links to it', () => {
    const s = fresh()
    const lot = Object.values(s.world.lots).find((l) => l.publicId === 'L-WPX5A6')!
    expect(lot.visibility).toBe('matched_only')
    expect(s.world.projects[MERROWGATE_ID].termsAccepted).toBe(true)
    for (const id of [U.priya, U.isla]) {
      expect(sel.canOpenMaterial(s, viewer(id), 'L-WPX5A6')).toBe(true)
      expect(sel.materialView(s, viewer(id), 'L-WPX5A6', MERROWGATE_ID)!.listing).toEqual(listingOf(s.world, lot))
    }
    expect(sel.canOpenMaterial(s, viewer(U.marcus), 'L-WPX5A6')).toBe(false)
    for (const p of [null, MERROWGATE_ID]) expect(sel.materialView(s, viewer(U.marcus), 'L-WPX5A6', p)).toBeNull()
    // The consultant's programme chart lists the shortlisted lot without a link, and search does not offer it.
    const row = sel.programmeView(s, viewer(U.marcus), MERROWGATE_ID, 'whole')!.materials.find((m) => m.publicId === 'L-WPX5A6')!
    expect(row.href).toBeNull()
    expect(sel.programmeView(s, viewer(U.priya), MERROWGATE_ID, 'whole')!.materials.find((m) => m.publicId === 'L-WPX5A6')!.href).toBe(`/app/marketplace/L-WPX5A6?project=${MERROWGATE_ID}`)
    expect(sel.searchIndex(s, viewer(U.marcus)).some((e) => e.id === 'material:L-WPX5A6')).toBe(false)
    expect(sel.searchIndex(s, viewer(U.priya)).some((e) => e.id === 'material:L-WPX5A6')).toBe(true)
    // Shared with you says why it is empty for him.
    const d = sel.discoverView(s, viewer(U.marcus), { ...DEFAULT_DISCOVER_QUERY, tab: 'shared' })
    expect(d.sharedCount).toBe(0)
    expect(d.sharedNote).toContain('stay with the project')
    expect(sel.discoverView(s, viewer(U.priya), DEFAULT_DISCOVER_QUERY).sharedNote).toBeNull()
  })

  it('every material link on a programme chart or in search opens for the person it is shown to', () => {
    for (const s of [fresh(), busy()]) {
      let links = 0
      for (const id of [U.priya, U.isla, U.marcus]) {
        for (const p of projectsOfUser(s, id)) {
          for (const row of sel.programmeView(s, viewer(id), p.id, 'whole')?.materials ?? []) {
            if (row.href === null) continue
            const url = new URL(row.href, 'https://tallyard.example')
            const publicId = url.pathname.split('/').pop()!
            expect(sel.materialView(s, viewer(id), publicId, url.searchParams.get('project')), `${id} ${p.name} ${row.href}`).not.toBeNull()
            links++
          }
        }
        for (const e of sel.searchIndex(s, viewer(id)).filter((x) => x.kind === 'material')) {
          expect(sel.materialView(s, viewer(id), e.href.split('/').pop()!, null), `${id} search ${e.href}`).not.toBeNull()
        }
      }
      expect(links).toBeGreaterThan(0)
    }
  })

  it('a material page holds public listing fields only', () => {
    const s = fresh()
    const m = sel.materialView(s, viewer(U.priya), 'L-9F4CQQ', MERROWGATE_ID)!
    expect(m.listing).toEqual(listingOf(s.world, lotForItem(s.world, itemByTag(s.world, 'TH-01').id)))
    expect(sel.materialView(s, viewer(U.priya), 'L-DAXNV3', null)).toBeNull()
    expect(sel.materialView(s, viewer(U.priya), 'L-K3TB7D', null)).toBeNull()
    expect(sel.materialView(s, viewer(U.tom), 'L-9F4CQQ', null)).toBeNull()
  })
})

describe('P3 on the platform: the seller never receives a buyer-private string before accepting', () => {
  for (const [label, make] of [['fresh sandbox', fresh], ['busy sandbox', busy]] as const) {
    it(`owner views, ${label}`, () => {
      const s = make()
      const strings = allProjectStrings(s)
      expect(strings).toEqual(expect.arrayContaining(['Merrowgate Wharf', 'Lantern Quay Developments', 'Studio Oriel', 'Isla Brennan', 'Priya Nair', 'Newham']))
      const views = ownerViews(s, viewer(U.tom))
      expect(views.length).toBeGreaterThan(30)
      expectNone(views, strings, 'Tom')
    })
  }

  it('the surveyor sees no buyer either', () => {
    const s = busy()
    const v = viewer(U.dana)
    const views: [string, unknown][] = [['home', sel.surveyorHome(s, v)], ['dashboard', sel.surveyorDashboard(s, v)], ['nav', sel.navModel(s, v)], ['inbox', sel.inboxView(s, v)], ['search', sel.searchIndex(s, v)]]
    for (const b of buildingsOfUser(s, U.dana)) {
      views.push([`inventory ${b.name}`, sel.inventoryView(s, v, b.id)], [`capture ${b.name}`, sel.captureView(s, v, b.id)], [`overview ${b.name}`, sel.buildingOverview(s, v, b.id)])
      for (const item of itemsOf(s, b.id)) views.push([`item ${item.tag}`, sel.itemDetail(s, v, b.id, item.id)])
    }
    expectNone(views, allProjectStrings(s), 'Dana')
  })

  it('after accepting, the owner sees the buyer organisation and contact on that request only', () => {
    let s = busy()
    const res = Object.values(s.reservations).find((r) => r.publicId === 'L-9F4CQQ')!
    s = must(decideReservation(s, actor(U.tom), res.id, 'accepted', '')).state
    const rows = sel.requestsView(s, viewer(U.tom))!
    const accepted = rows.decided.find((r) => r.id === res.id)!
    expect(accepted.buyer).toEqual({ kind: 'known', org: 'Lantern Quay Developments', contact: 'Isla Brennan', email: 'isla.brennan@lanternquay.example', message: 'For the upper floors.' })
    const other = rows.pending.find((r) => r.publicId === 'L-WPX5A6')!
    expect(other.buyer.kind).toBe('blind')
    expect(JSON.stringify(other)).not.toContain('Lantern')
  })
})

describe('P3 on the platform, round 2: a project of type Other and the notes to the client stay on the buyer side', () => {
  /** Priya creates a project of type Other with a client message; Isla accepts it, approves a shared lot and asks to reserve it; Tom shares with it. */
  function withOther(): { s: AppData; id: string } {
    let s = fresh()
    // The check matches strings, so the project's own suggested dates must not fall on a day a seller keeps private
    // in this sandbox (site start 6 September 2027 would put stage 4 on 20 April 2027, a private lot date).
    const created = must(createProject(s, actor(U.priya), { name: 'Corbel Yard', client: { orgId: ORG_IDS.lantern }, projectType: 'other', projectTypeOther: 'Rooftop lido and spa', localAuthority: 'Camden', region: 'Central London', ribaStage: 2, startDate: '2027-09-20', clientMessage: 'Please accept the Corbel Yard brief.', consultantOrgId: ORG_IDS.halewick }))
    s = created.state
    const id = created.value
    s = must(setProjectAccess(s, actor(U.tom), id, true)).state
    s = must(decideClientLink(s, actor(U.isla), id, 'accepted', '')).state
    s = must(saveToProject(s, actor(U.priya), 'L-9F4CQQ', id)).state
    const item = projectWishlist(s.world, id)!.items[0].id
    s = must(sendToClient(s, actor(U.priya), id, [item], 'For the pool hall.')).state
    s = must(decideItem(s, actor(U.isla), id, item, 'approved', '')).state
    s = must(requestReservation(s, actor(U.isla), id, item, 'For the lido roof.')).state
    return { s, id }
  }

  it('the owner never receives the type description, the client message or the project', () => {
    const { s, id } = withOther()
    const strings = projectPrivateStrings(s.world.projects[id], s.world)
    expect(strings).toEqual(expect.arrayContaining(['Rooftop lido and spa', 'Please accept the Corbel Yard brief.', 'Corbel Yard']))
    const views = ownerViews(s, viewer(U.tom))
    expectNone(views, strings, 'Tom')
    const blind = JSON.stringify(sel.requestsView(s, viewer(U.tom)))
    expect(blind).toContain('other project')
  })

  it('the buyer side still receives no seller-private string', () => {
    const { s } = withOther()
    const strings = allLotStrings(s)
    for (const [who, id] of [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const) expectNone(buyerViews(s, viewer(id)), strings, who)
  })

  it('a declined request reaches the architect with no person from the client', () => {
    let s = fresh()
    const created = must(createProject(s, actor(U.priya), { name: 'Corbel Yard', client: { orgId: ORG_IDS.lantern }, projectType: 'office', localAuthority: '', region: 'Central London', ribaStage: 2, startDate: '2027-09-06', consultantOrgId: null }))
    s = must(decideClientLink(created.state, actor(U.isla), created.value, 'declined', 'Not this time.')).state
    const priya = JSON.stringify([sel.projectOverview(s, viewer(U.priya), created.value), sel.projectTeam(s, viewer(U.priya), created.value), sel.projectHeader(s, viewer(U.priya), created.value), sel.inboxView(s, viewer(U.priya)).groups[0]])
    expect(priya).toContain('Lantern Quay Developments declined Corbel Yard')
    expect(priya).not.toContain('Isla Brennan')
    expect(priya).not.toContain('isla.brennan@lanternquay.example')
  })
})

describe('P3 on the platform, round 2: share links, contractors and New projects', () => {
  const LINK_LABEL = 'Primary steel for enquiries'

  it('an architect who opened a link sees public listings only, and never the link name', () => {
    const s = must(openShareLink(fresh(), actor(U.priya), TIVERNE_LINK_ID)).state
    const views: [string, unknown][] = [...buyerViews(s, viewer(U.priya)), ['link', sel.linkView(s, viewer(U.priya), TIVERNE_LINK_ID)]]
    expect(sel.linkView(s, viewer(U.priya), TIVERNE_LINK_ID).state).toBe('open')
    expectNone(views, [...allLotStrings(s), LINK_LABEL], 'Priya')
    expectNoInternalIds(views, 'Priya')
    // Before opening, the terms page says nothing either.
    expectNone([['terms', sel.linkView(fresh(), viewer(U.isla), TIVERNE_LINK_ID)]], [...allLotStrings(s), LINK_LABEL], 'Isla')
  })

  it('the owner learns only the type of who opened a link, never the organisation or the person', () => {
    let s = must(openShareLink(fresh(), actor(U.priya), TIVERNE_LINK_ID)).state
    s = must(openShareLink(s, actor(U.isla), TIVERNE_LINK_ID)).state
    const v = viewer(U.tom)
    const views: [string, unknown][] = [...ownerViews(s, v), ['links', sel.shareLinksView(s, v, TIVERNE_ID)], ['claims', sel.claimRowsForOwner(s, v)], ['testing', sel.testingView(s, v, TIVERNE_ID)]]
    expectNone(views, [...allProjectStrings(s), 'Studio Oriel', 'Priya Nair', 'Isla Brennan', 'Lantern Quay Developments'], 'Tom')
    expect(JSON.stringify(sel.shareLinksView(s, v, TIVERNE_ID))).toContain('architecture practice')
  })

  it('a deconstruction contractor sees no buyer, no project and no price', () => {
    let s = busy()
    const lee = addTestUser(s, { orgId: FENNICK_ID, name: 'Lee Shaw', email: 'lee.shaw@fennick.example' })
    s = must(setContractorDates(lee.state, actor(lee.userId), TIVERNE_ID, [{ itemId: itemByTag(lee.state.world, 'TH-01').id, month: '2027-02' }])).state
    const v = viewer(lee.userId)
    const views: [string, unknown][] = [
      ['availability', sel.availabilityView(s, v, TIVERNE_ID)],
      ['overview', sel.buildingOverview(s, v, TIVERNE_ID)],
      ['nav', sel.navModel(s, v)],
      ['inbox', sel.inboxView(s, v)],
      ['home', sel.surveyorHome(s, v)],
      ['contractorHome', sel.contractorDashboard(s, v)],
      ['search', sel.searchIndex(s, v)],
    ]
    expect(sel.availabilityView(s, v, TIVERNE_ID)).not.toBeNull()
    // Round 3: Fennick is a deconstruction contractor, so its home is the contractor dashboard.
    expect(sel.contractorDashboard(s, v)).not.toBeNull()
    expectNone(views, allProjectStrings(s), 'Lee')
    for (const [name, view] of views) expect(JSON.stringify(view), `Lee, ${name}`).not.toMatch(/"(ask|askPerUnit|reserve|reservePerUnit|price|guide)"/)
  })

  it("an owner's New project gives the buying side none of the owner's lot strings, and the surveyor none of the project", () => {
    const s0 = fresh()
    const input = { name: 'Wexcombe House', projectType: 'office' as const, localAuthority: 'Camden', region: 'Central London', ribaStage: 2, startDate: '2027-09-20' }
    // With no architect yet, nobody else sees the project at all.
    const alone = must(createOwnerProject(s0, actor(U.tom), { ...input, architectOrgId: null }))
    for (const [who, id] of [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const) expectNone(buyerViews(alone.state, viewer(id)), allLotStrings(alone.state), who)
    // With Studio Oriel appointed, Priya knows her client by name; nothing else of the owner's buildings reaches her.
    const r = must(createOwnerProject(s0, actor(U.tom), { ...input, architectOrgId: ORG_IDS.oriel }))
    const s = r.state
    const client = ['Ostlea Estates', 'Tom Ashby']
    expectNone(buyerViews(s, viewer(U.priya)), allLotStrings(s).filter((x) => !client.includes(x)), 'Priya')
    expect(JSON.stringify(sel.projectHeader(s, viewer(U.priya), r.value))).toContain('Ostlea Estates')
    for (const [who, id] of [['Isla', U.isla], ['Marcus', U.marcus]] as const) expectNone(buyerViews(s, viewer(id)), allLotStrings(s), who)
    const v = viewer(U.dana)
    const dana: [string, unknown][] = [['home', sel.surveyorHome(s, v)], ['nav', sel.navModel(s, v)], ['inbox', sel.inboxView(s, v)], ['search', sel.searchIndex(s, v)], ['capture', sel.captureTargets(s, v)]]
    for (const b of buildingsOfUser(s, U.dana)) dana.push([`overview ${b.name}`, sel.buildingOverview(s, v, b.id)], [`inventory ${b.name}`, sel.inventoryView(s, v, b.id)], [`testing ${b.name}`, sel.testingView(s, v, b.id)])
    expectNone(dana, ['Wexcombe House', ...dateFormats(s.world.projects[r.value].startDate)], 'Dana')
  })
})

describe('P3, audit 16 October: a donor building owner browsing the marketplace', () => {
  it("sees other sellers' lots as public listings only, never its own lots, and no buyer", () => {
    const s = busy()
    const v = viewer(U.tom)
    const views = ownerMarketplaceViews(s, v)
    const own = new Set(Object.values(s.world.lots).filter((l) => s.world.buildings[s.world.items[l.itemId].buildingId]?.ownerOrgId === ORG_IDS.ostlea).map((l) => l.publicId))
    const others = new Set<string>()
    for (const lot of Object.values(s.world.lots)) {
      const item = s.world.items[lot.itemId]
      if (own.has(lot.publicId)) continue
      for (const x of lotPrivateStrings(lot, item, s.world.buildings[item.buildingId], s.world)) others.add(x)
    }
    expectNone(views, [...others], 'Tom in the marketplace')
    expectNone(views, allProjectStrings(s), 'Tom in the marketplace')
    expectNoInternalIds(views, 'Tom in the marketplace')
    const grid = sel.discoverView(s, v, DEFAULT_DISCOVER_QUERY)
    expect(grid.cards.length).toBeGreaterThan(0)
    for (const c of grid.cards) expect(own.has(c.publicId), c.publicId).toBe(false)
    for (const id of own) expect(sel.materialView(s, v, id, null), id).toBeNull()
    // The client view: prices kept, nothing to save to without a project.
    expect(grid.canSave).toBe(false)
    expect(grid.sortOptions).toContain('price')
  })
})

describe('Privacy, review of 16 October: who is on Tallyard, and the owner\'s own buildings', () => {
  it('inviting a contractor by email tells nobody whether an address is registered, or what kind of organisation it is at', () => {
    const s = fresh()
    const registered = must(inviteContractorByEmail(s, actor(U.tom), TIVERNE_ID, 'priya.nair@studiooriel.example'))
    const owner = must(inviteContractorByEmail(s, actor(U.dana), HARROWDEN_ID, 'tom.ashby@ostlea.example'))
    const unknown = must(inviteContractorByEmail(s, actor(U.tom), TIVERNE_ID, 'nobody@unknown.example'))
    const unknownAtHarrowden = must(inviteContractorByEmail(s, actor(U.dana), HARROWDEN_ID, 'nobody@unknown.example'))
    expect(registered.value).toEqual(unknown.value)
    expect(owner.value).toEqual(unknownAtHarrowden.value)
    expect(JSON.stringify(sel.buildingOverview(registered.state, viewer(U.tom), TIVERNE_ID))).not.toContain('Studio Oriel')
  })

  it("a surveyor never learns that the owner already had the building it asked about", () => {
    let s = fresh()
    const corbel = { name: 'Corbel Yard', address: '9 Lantry Street, London E1', postcodeDistrict: 'E1', localAuthority: 'Tower Hamlets', region: 'Inner London East', yearBuilt: null, storeys: null, giaM2: null, structureType: '', structure: [], stripOutStart: null, dismantlingStart: null, clearBy: null }
    s = must(createSurveyBuilding(s, actor(U.dana), { ...corbel, owner: { email: 'tom.ashby@ostlea.example', name: '', message: '' } })).state
    const toms = must(createBuilding(s, actor(U.tom), { ...corbel, address: 'Corbel Yard, Lantry Street', surveyorOrgId: null }))
    s = toms.state
    const claimId = Object.values(s.buildingClaims).find((c) => c.status === 'pending' && c.id !== 'clm_ambrey')!.id
    // Not surveyed by Tarnbrook, so not offered as the same building to Tom either.
    expect(sel.claimDuplicateOf(s, viewer(U.tom), claimId)).toBeNull()
    const v = viewer(U.dana)
    const dana: [string, unknown][] = [['home', sel.surveyorHome(s, v)], ['nav', sel.navModel(s, v)], ['inbox', sel.inboxView(s, v)], ['candidates', sel.mergeCandidates(s, v)], ['duplicate', sel.claimDuplicateOf(s, v, claimId)]]
    for (const b of buildingsOfUser(s, U.dana)) dana.push([`overview ${b.name}`, sel.buildingOverview(s, v, b.id)])
    expectNone(dana, ['Corbel Yard, Lantry Street', toms.value], 'Dana')
  })
})

describe('P3 and money, round 2: the sustainability records', () => {
  /** The busy sandbox, with the sustainability records changed by both sides. */
  function withRecords(): AppData {
    let s = busy()
    s = must(setGoalTarget(s, actor(U.marcus), MERROWGATE_ID, 'content_by_value', 0.3, 'Raised with the client.')).state
    s = must(setRequirementStatus(s, actor(U.isla), MERROWGATE_ID, 'gla-ces', 'at_risk')).state
    s = must(addRequirementEvidence(s, actor(U.isla), MERROWGATE_ID, 'gla-ces', { text: 'Board approved the approach.', output: 'specification' })).state
    s = must(setCreditStatus(s, actor(U.marcus), MERROWGATE_ID, 'breeam-mat03', 'at_risk')).state
    s = must(reviewStatement(s, actor(U.isla), MERROWGATE_ID, 'Happy with the approach.')).state
    s = must(sendStatementForReview(s, actor(U.marcus), MERROWGATE_ID)).state
    return s
  }

  it('the architect and the consultant never see a money figure in these views', () => {
    for (const s of [fresh(), withRecords()])
      for (const [who, id] of [['Priya', U.priya], ['Marcus', U.marcus]] as const) {
        const v = viewer(id)
        for (const p of projectsOfUser(s, id)) {
          for (const [name, view] of sustainabilityViews(s, v, p.id)) {
            if (name === 'complianceWorkbook') continue
            expect(JSON.stringify(view).includes('£'), `${who}, ${name} ${p.name} holds money`).toBe(false)
          }
        }
      }
  })

  it('the client sees money, from the package engine', () => {
    expect(JSON.stringify(sel.approvalsView(fresh(), viewer(U.isla), MERROWGATE_ID))).toContain('£')
    expect(JSON.stringify(sel.clientDashboard(fresh(), viewer(U.isla)))).toContain('£')
  })

  it('the buyer side still receives no seller-private string with the records in place', () => {
    const s = withRecords()
    const strings = allLotStrings(s)
    for (const [who, id] of [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const) {
      const views = buyerViews(s, viewer(id))
      expectNone(views, strings, who)
      expectNoInternalIds(views, who)
    }
  })

  it("the owner's inbox and activity hold nothing of the records, and the views return nothing", () => {
    const s = withRecords()
    const v = viewer(U.tom)
    const inbox = sel.inboxView(s, v)
    expect(inbox.groups.flatMap((g) => g.items).some((n) => n.kind === 'sustainability')).toBe(false)
    const text = JSON.stringify([inbox, sel.activityFor(s, v, {}, 500), sel.bellView(s, v)])
    for (const x of ['circular economy statement', 'Circular economy statement', 'Board approved the approach.', 'Happy with the approach.', 'Raised with the client.', 'Lantern Quay has asked']) expect(text).not.toContain(x)
    for (const fn of [sel.sustainabilityView, sel.goalRows, sel.requirementsView, sel.statementView, sel.certificationSummary, sel.sustainabilityTracking, sel.complianceWorkbook]) expect(fn(s, v, MERROWGATE_ID)).toBeNull()
    expect(sel.clientDashboard(s, v)).toBeNull()
    expectNone(ownerViews(s, v), allProjectStrings(s), 'Tom')
  })
})

describe('P3, round 3: the audits of a donor building stay with the building', () => {
  const buyers = [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const

  it('no buyer view holds an audit string, and no buyer can open an audit or the Audits tab', () => {
    const s = fresh()
    const audits = Object.values(s.audits)
    expect(audits.length).toBeGreaterThanOrEqual(3)
    const strings = audits.flatMap(auditPrivateStrings)
    expect(strings.length).toBeGreaterThan(20)
    for (const [who, id] of buyers) {
      expectNone(buyerViews(s, viewer(id)), strings, who)
      for (const a of audits) {
        expect(sel.auditsView(s, viewer(id), a.buildingId), who).toBeNull()
        expect(sel.auditDetailView(s, viewer(id), a.buildingId, a.id), who).toBeNull()
        expect(sel.routeAccess(s, viewer(id), `/app/buildings/${a.buildingId}/audits/${a.id}`), who).toBe('forbidden')
      }
    }
  })

  it('a lot listed early from the audit carries none of the audit once it is published', () => {
    let s = fresh()
    s = must(createListingsFromAudit(s, actor(U.tom), SEEDED_AUDIT_IDS.tiverneDeconstruction)).state
    const audit = s.audits[SEEDED_AUDIT_IDS.tiverneDeconstruction] as PreDemolitionAudit
    const made = audit.rows.filter((r) => r.itemId && !itemsOf(fresh(), TIVERNE_ID).some((i) => i.id === r.itemId))
    expect(made.length).toBeGreaterThan(0)
    for (const r of made) s = must(setLotVisibility(s, actor(U.tom), lotForItem(s.world, r.itemId!).id, { visibility: 'published', ask: 4, reserve: 3 })).state
    const strings = Object.values(s.audits).flatMap(auditPrivateStrings)
    for (const [who, id] of buyers) expectNone(buyerViews(s, viewer(id)), strings, who)
    for (const r of made) expect(JSON.stringify(listingOf(s.world, lotForItem(s.world, r.itemId!)))).not.toContain('pre-deconstruction audit')
  })

  it('the deconstruction contractor reads the pre-deconstruction audit only, with no link into the inventory', () => {
    const s = fresh()
    const v = viewer(U.kofi)
    expect(sel.auditsView(s, v, TIVERNE_ID)!.audits.map((a) => a.id)).toEqual([SEEDED_AUDIT_IDS.tiverneDeconstruction])
    const pda = sel.auditDetailView(s, v, TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneDeconstruction)!
    expect(pda.editable).toBe(false)
    expect(pda.kind === 'pre_demolition' && pda.rows.every((r) => r.itemHref === null)).toBe(true)
    expect(sel.auditDetailView(s, v, TIVERNE_ID, SEEDED_AUDIT_IDS.tiverneRetention)).toBeNull()
    expect(sel.routeAccess(s, v, `/app/buildings/${TIVERNE_ID}/audits/${SEEDED_AUDIT_IDS.tiverneRetention}`)).toBe('forbidden')
    expect(sel.routeAccess(s, v, `/app/buildings/${TIVERNE_ID}/audits/${SEEDED_AUDIT_IDS.tiverneDeconstruction}`)).toBe('ok')
    // An audit of another building never opens under this one.
    expect(sel.routeAccess(s, viewer(U.tom), `/app/buildings/${TIVERNE_ID}/audits/${SEEDED_AUDIT_IDS.harrowdenDeconstruction}`)).toBe('forbidden')
  })
})

describe('P3, round 3: the contractor workspace and title to the arisings', () => {
  const buyers = [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const

  function titled(): AppData {
    let s = fresh()
    const waiting = Object.values(s.reservations).find((r) => r.status === 'pending')!
    s = must(decideReservation(s, actor(U.tom), waiting.id, 'declined', '')).state
    return must(setArisingsTitle(s, actor(U.tom), TIVERNE_ID, 'contractor')).state
  }

  it("no buyer view holds the contractor's methods, papers or carrier registrations", () => {
    const s = fresh()
    const work = workFor(s, TIVERNE_ID)!
    const strings = contractorWorkPrivateStrings(work, s.contractorWork.carriers[FENNICK_ID])
    expect(strings.length).toBeGreaterThan(10)
    for (const [who, id] of buyers) {
      expectNone(buyerViews(s, viewer(id)), strings, who)
      expect(sel.destinationsView(s, viewer(id), TIVERNE_ID), who).toBeNull()
      expect(sel.methodView(s, viewer(id), TIVERNE_ID), who).toBeNull()
    }
  })

  it('a contractor selling under title sees the buyer as a blind line until it accepts', () => {
    let s = titled()
    const lot = lotForItem(s.world, itemByTag(s.world, 'TH-02').id)
    const wished = projectWishlist(s.world, MERROWGATE_ID)!.items.find((x) => x.publicId === lot.publicId)!
    s = must(requestReservation(s, actor(U.isla), MERROWGATE_ID, wished.id, 'For the upper floors.')).state
    const v = viewer(U.kofi)
    const views: [string, unknown][] = [
      ['requests', sel.requestsView(s, v)],
      ['listings', sel.listingsView(s, v, TIVERNE_ID)],
      ['sharing', sel.sharingView(s, v)],
      ['nav', sel.navModel(s, v)],
      ['inbox', sel.inboxView(s, v)],
      ['activity', sel.activityFor(s, v, {}, 500)],
      ['home', sel.contractorDashboard(s, v)],
      ['method', sel.methodView(s, v, TIVERNE_ID)],
      ['destinations', sel.destinationsView(s, v, TIVERNE_ID)],
      ['carriers', sel.carriersView(s, v)],
    ]
    expect(sel.requestsView(s, v)!.pending).toHaveLength(1)
    expectNone(views, allProjectStrings(s), 'Kofi')
    expect(JSON.stringify(sel.requestsView(s, v))).not.toContain('For the upper floors.')
    // The buying side still never sees the seller: the listing says only what kind of firm sells it.
    const listing = listingOf(s.world, lot)
    expect(listing.sellerType).toBe('Deconstruction contractor')
    for (const [who, id] of buyers) expectNone(buyerViews(s, viewer(id)), allLotStrings(s), who)
  })

  it('the owner reads no request the contractor answers, and the contractor none the owner decided', () => {
    const s = titled()
    const decided = Object.values(s.reservations).find((r) => r.status === 'declined')!
    expect(sel.requestsView(s, viewer(U.kofi))!.decided.map((r) => r.id)).not.toContain(decided.id)
    expect(sel.requestsView(s, viewer(U.tom))!.decided.map((r) => r.id)).toContain(decided.id)
  })
})

describe('P3, round 3: quality on the listing and the provenance pack', () => {
  const buyers = [['Priya', U.priya], ['Isla', U.isla], ['Marcus', U.marcus]] as const

  function withPrivateQuality(): AppData {
    let s = fresh()
    const th01 = itemByTag(s.world, 'TH-01')
    s = must(saveSteelRecord(s, actor(U.tom), th01.id, { ...th01.quality!.steel!, groupId: 'Secondary beams north', assessment: 'S3', samplesTested: 1, certificate: { ref: 'CERT-77310', lab: 'Brindmoor Testing', issuedOn: '2026-10-01', grade: 'S355' } })).state
    s = must(saveItemQuality(s, actor(U.tom), th01.id, { warranty: { kind: 'seller', years: 2, note: 'Warranty held by Ostlea under the deed of 2024' }, hazards: [{ id: 'red_lead', status: 'confirmed' }] })).state
    return s
  }

  it('the public quality key holds fixed values only', () => {
    const s = withPrivateQuality()
    for (const l of Object.values(s.world.lots)) {
      const q = listingOf(s.world, l).quality
      expect(Object.keys(q).sort()).toEqual(['assurance', 'hazards', 'processing', 'steel', 'warranty'])
      expect(['declared', 'inspected', 'tested', 'warranted']).toContain(q.assurance)
      expect(['as_removed', 'cleaned', 'refurbished', 'recertified']).toContain(q.processing)
      expect(['none', 'seller', 'manufacturer', 'insured']).toContain(q.warranty)
      if (q.steel) expect(Object.keys(q.steel).sort()).toEqual(['assessment', 'provenance'])
    }
    const th01 = listingOf(s.world, lotForItem(s.world, itemByTag(s.world, 'TH-01').id)).quality
    expect(th01).toEqual({ assurance: 'warranted', processing: 'as_removed', warranty: 'seller', steel: { provenance: 'P1', assessment: 'S3' }, hazards: ['red_lead'] })
  })

  it("no buyer view holds the steel group, the certificate number or the warranty's note", () => {
    const s = withPrivateQuality()
    for (const [who, id] of buyers) expectNone(buyerViews(s, viewer(id)), ['Secondary beams north', 'CERT-77310', 'Warranty held by Ostlea'], who)
  })

  it('the provenance pack reaches the client only, after acceptance', () => {
    let s = fresh()
    const waiting = Object.values(s.reservations).find((r) => r.status === 'pending')!
    for (const [who, id] of buyers) expect(sel.provenancePackView(s, viewer(id), MERROWGATE_ID, waiting.id), who).toBeNull()
    s = must(decideReservation(s, actor(U.tom), waiting.id, 'accepted', '')).state
    expect(sel.provenancePackView(s, viewer(U.isla), MERROWGATE_ID, waiting.id)).not.toBeNull()
    for (const [who, id] of [['Priya', U.priya], ['Marcus', U.marcus]] as const) expect(sel.provenancePackView(s, viewer(id), MERROWGATE_ID, waiting.id), who).toBeNull()
    // The architect's and the consultant's views still name no seller-private string.
    for (const [who, id] of [['Priya', U.priya], ['Marcus', U.marcus]] as const) expectNone(buyerViews(s, viewer(id)), allLotStrings(s), who)
  })
})

describe('Round 3, stage 5: deal terms and design from stock', () => {
  it("the seller reads a request's terms banded, with no cost base, until accepting", () => {
    let s = fresh()
    const waiting = Object.values(s.reservations).find((r) => r.status === 'pending')!
    s = must(withdrawReservation(s, actor(U.isla), waiting.id)).state
    const d = sel.termsDraftView(s, viewer(U.isla), MERROWGATE_ID, waiting.wishItemId, null)!
    const r = must(requestReservation(s, actor(U.isla), MERROWGATE_ID, waiting.wishItemId, '', { ...d.terms, bridgeMonths: 11 }))
    const views = ownerViews(r.state, viewer(U.tom))
    expectNone(views, ['11 months', 'fitMonths', 'storagePerMonth', 'bridgeMonths'], 'Tom before accepting')
    expect(JSON.stringify(sel.requestsView(r.state, viewer(U.tom)))).toContain('7 to 12 months')
    expectNone(views, allProjectStrings(r.state), 'Tom before accepting')
  })

  it("a lot held for the owner's own projects reaches no other project, and not the marketplace", () => {
    const created = must(createOwnerProject(fresh(), actor(U.tom), { name: 'Wexcombe House', projectType: 'office', localAuthority: 'Camden', region: 'Central London', ribaStage: 2, startDate: '2027-09-20', architectOrgId: ORG_IDS.oriel }))
    const lot = lotForItem(created.state.world, itemByTag(created.state.world, 'TH-07').id)
    const s = must(setLotPortfolio(created.state, actor(U.tom), lot.id, true)).state
    for (const [who, id] of [['Isla', U.isla], ['Marcus', U.marcus]] as const) expectNone(buyerViews(s, viewer(id)), [lot.publicId], who)
    expect(marketplaceListings(s).map((l) => l.publicId)).not.toContain(lot.publicId)
    // The architect reaches it through the owner's own project, and checks it against no other.
    expect(sel.materialView(s, viewer(U.priya), lot.publicId, created.value)).not.toBeNull()
    for (const p of projectsOfUser(s, U.priya).filter((x) => x.id !== created.value)) expect(projectCanSee(s.world, p, s.world.lots[lot.id]), p.name).toBe(false)
  })

  it("the stock match reads public listings only, and is the architect's alone", () => {
    const s = fresh()
    expectNone([['stock', sel.stockMatchView(s, viewer(U.priya), MERROWGATE_ID)]], allLotStrings(s), 'Priya')
    for (const [who, id] of [['Isla', U.isla], ['Marcus', U.marcus], ['Tom', U.tom]] as const) expect(sel.stockMatchView(s, viewer(id), MERROWGATE_ID), who).toBeNull()
  })
})

describe('Round 3, stage 6c: the City of London module and the calculators', () => {
  it("a project moved into the City shows its consultant no seller's string but the borough it shares", () => {
    const s = must(updateProject(fresh(), actor(U.priya), MERROWGATE_ID, { region: 'Central London', localAuthority: 'City of London' })).state
    const v = viewer(U.marcus)
    const views: [string, unknown][] = [['city', sel.cityView(s, v, MERROWGATE_ID)], ...SCHEME_IDS.map((id): [string, unknown] => [`certification ${id}`, sel.certificationView(s, v, MERROWGATE_ID, id)])]
    expect(views[0][1]).not.toBeNull()
    // The project's own local authority is the consultant's to read; a seller's building in the City says nothing more.
    expectNone(views, allLotStrings(s).filter((x) => x !== 'City of London'), 'Marcus')
    expectNoInternalIds(views, 'Marcus')
    for (const [name, view] of views) expect(JSON.stringify(view).includes('£'), `${name} holds money`).toBe(false)
  })
})

