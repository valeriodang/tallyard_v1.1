// Round 3 additions to the first run (BRIEF section 15). They are applied after every earlier record, so the IDs
// minted before them never move; later stages add their records here, in order.
import type { AppData } from '../store/types'
import type { AuditRow, PreDemolitionAudit, PreRedevelopmentAudit } from '../domain/auditTypes'
import { notify } from '../store/notifications'
import { HARROWDEN_ID, ORG_IDS, PERSONA_IDS, TIVERNE_ID } from '../domain/seed/world'
import { rowsFromItems } from '../domain/engines/audit'
import { FENNICK_ID } from './sampleIds'
import { SAMPLE_ACCOUNTS } from './accounts'

type At = (daysAgo: number, hour: number, minute?: number) => string

export function withRound3Records(state: AppData, h: { at: At }): AppData {
  let s = state
  // Fennick Dismantling, now a deconstruction contractor with its own workspace, hears of the invitation Tom sent.
  const tiverne = s.world.buildings[TIVERNE_ID]
  if (tiverne && tiverne.contractorOrgId === FENNICK_ID) {
    const owner = s.world.orgs[ORG_IDS.ostlea]?.name ?? 'The owner'
    s = notify(s, { orgIds: [FENNICK_ID], kind: 'appointed', title: `${owner} invited you to set availability dates at ${tiverne.name}`, body: 'Say when each item is expected to come out. The owner decides what buyers see.', href: `/app/buildings/${TIVERNE_ID}/availability`, at: h.at(9, 10), actorUserId: null })
  }
  // Round 3, stage 2: the audits of Tiverne House (one complete, one in progress) and a first draft for Harrowden Court.
  s = withSeededAudits(s, h)
  return s
}

/** Audit IDs are fixed, so they never take a minted ID from later records. */
export const SEEDED_AUDIT_IDS = { tiverneRetention: 'aud_tiv_pra', tiverneDeconstruction: 'aud_tiv_pda', harrowdenDeconstruction: 'aud_har_pda' } as const

function withSeededAudits(state: AppData, h: { at: At }): AppData {
  const tiverne = state.world.buildings[TIVERNE_ID]
  const harrowden = state.world.buildings[HARROWDEN_ID]
  if (!tiverne || !harrowden || tiverne.surveyorOrgId !== ORG_IDS.tarnbrook) return state
  const dana = SAMPLE_ACCOUNTS.find((a) => a.personaId === PERSONA_IDS.dana)!.userId
  const auditor = state.world.orgs[ORG_IDS.tarnbrook].name
  const day = (k: number) => h.at(k, 9).slice(0, 10)
  const audits = { ...state.audits }

  const pra: PreRedevelopmentAudit = {
    id: SEEDED_AUDIT_IDS.tiverneRetention,
    kind: 'pre_redevelopment',
    buildingId: TIVERNE_ID,
    status: 'complete',
    authorOrgId: ORG_IDS.tarnbrook,
    authorUserId: dana,
    createdAt: h.at(48, 10),
    updatedAt: h.at(30, 16, 20),
    completedAt: h.at(30, 16, 20),
    auditorName: auditor,
    independence: 'independent',
    reviewer: { name: 'Nadia Orrin', organisation: 'Ellery Carbon Review', reviewedOn: day(31), note: 'Read the three options and the structural report. The demolition figures use the City default.' },
    surveyedOn: day(45),
    summary:
      'A 1984 steel-framed office of seven storeys. The frame cannot take the brief without strengthening every floor, and floor-to-floor heights of 3.1 m rule out the services the new scheme needs. The frame, the stone facade and the raised floors are taken down for reuse, here and on sites nearby.',
    factors: {
      technical_capacity: { scale: 'may_not_be_supported', note: 'Composite floors designed for 2.5 kN per m2; the brief needs 4.0 with partitions. Every bay would need strengthening.' },
      energy_performance: { scale: 'may_be_supported', note: 'The facade can be overclad, but the cores leave no room for the plant the energy strategy needs.' },
      occupant_comfort: { scale: 'may_not_be_supported', note: 'Floor to floor 3.1 m. Daylight to the deep plan is poor beyond 9 m.' },
      construction_practicalities: { scale: 'may_be_supported', note: 'Access from two streets; the cores could stay through the works.' },
      social_economic_value: { scale: 'not_prohibit', note: 'Not listed and not in a conservation area.' },
      commercial_viability: { scale: 'may_not_be_supported', note: 'A kept building would lose about a fifth of its lettable area to new risers.' },
    },
    tree: { feasibleToRetain: 'yes', suitedInWhole: 'no', suitedInPart: 'no', recoverResidualValue: 'yes' },
    options: [
      { id: 'aud_tiv_pra_o1', label: 'Retain and refurbish', kind: 'retain_refurbish', superstructureRetainedShare: 0.92, facadeRetainedShare: 0.85, giaM2: 8600, upfrontKgM2: 310, wlcKgM2: 690, demolishedAreaM2: 400, demolitionKgM2: null, note: 'Strengthens every floor. Short of the brief by about 1,700 m2.' },
      { id: 'aud_tiv_pra_o2', label: 'Keep the frame, new facade and two storeys', kind: 'retain_extend', superstructureRetainedShare: 0.71, facadeRetainedShare: 0, giaM2: 10400, upfrontKgM2: 470, wlcKgM2: 880, demolishedAreaM2: 1200, demolitionKgM2: null, note: 'The foundations would need underpinning to carry two more storeys.' },
      { id: 'aud_tiv_pra_o3', label: 'New build, reclaiming the frame and facade', kind: 'new_build', superstructureRetainedShare: 0, facadeRetainedShare: 0, giaM2: 12900, upfrontKgM2: 640, wlcKgM2: 1010, demolishedAreaM2: 9400, demolitionKgM2: null, note: 'Steel, stone and raised floors taken down for reuse; the basement is kept.' },
    ],
    preferredOptionId: 'aud_tiv_pra_o3',
    justification:
      'Neither kept option meets the loads or the floor heights the brief needs, and both would need the frame strengthened at every level. The new build reuses the frame steel, the Portland stone and the raised floors through Tallyard, so most of the embodied carbon of the old building is carried into other projects.',
    followOn: ['Structural assessment', 'Whole life carbon assessment', 'Financial appraisal'],
  }

  const items = Object.values(state.world.items).filter((i) => i.buildingId === TIVERNE_ID)
  let n = 0
  const surveyed = rowsFromItems(items, () => `${SEEDED_AUDIT_IDS.tiverneDeconstruction}_r${++n}`).map((r): AuditRow => {
    const lot = Object.values(state.world.lots).find((l) => l.itemId === r.itemId)
    const offered = !!lot && lot.visibility !== 'private'
    return r.inventory === 'reuse' ? { ...r, marketValue: r.family === 'steel_section' ? 4 : 3, broker: offered ? { route: 'marketplace', status: 'offered', outlet: '' } : r.broker } : r
  })
  const line = (x: Omit<AuditRow, 'id' | 'itemId' | 'broker'> & { broker?: AuditRow['broker'] }): AuditRow => ({ ...x, id: `${SEEDED_AUDIT_IDS.tiverneDeconstruction}_r${++n}`, itemId: null, broker: x.broker ?? { route: 'none', status: 'not_offered', outlet: '' } })
  const added: AuditRow[] = [
    line({ inventory: 'reuse', description: 'Carpet tiles, levels 1 to 6', family: 'carpet_tile', nrm: '3', ewcCode: '17 09 04', quantity: 9600, unit: 'tiles', massT: 10.18, extractability: 4, quality: 2, marketValue: 2, reusableShare: 0.6, cityBand: 3, considerations: 'Lift by hand; reject tiles with stained backing. Cleaned and resold as a batch.' }),
    line({ inventory: 'reuse', description: 'Metal ceiling tiles, levels 2 to 5', family: 'metal_ceiling_tile', nrm: '3', ewcCode: '17 04 05', quantity: 4200, unit: 'tiles', massT: 7.14, extractability: 3, quality: 3, marketValue: 2, reusableShare: 0.75, cityBand: 2, considerations: 'Removed after the asbestos board above them is cleared.' }),
    line({ inventory: 'recycle', description: 'Plasterboard partitions', family: null, nrm: '2.7', ewcCode: '17 08 02', quantity: 6200, unit: 'm2', massT: 38, extractability: 2, quality: 1, marketValue: 1, reusableShare: null, cityBand: null, considerations: 'Segregated for a gypsum recycler.' }),
    line({ inventory: 'recycle', description: 'Concrete cores and ground slab', family: null, nrm: '1', ewcCode: '17 01 01', quantity: 1020, unit: 'm3', massT: 2450, extractability: 0, quality: 1, marketValue: 1, reusableShare: null, cityBand: null, considerations: 'Crushed on site where the programme allows, else to an aggregate recycler.' }),
    line({ inventory: 'waste', description: 'Sealants, insulation and mixed fit-out waste', family: null, nrm: '3', ewcCode: '17 09 04', quantity: null, unit: '', massT: 46, extractability: 1, quality: 0, marketValue: 0, reusableShare: null, cityBand: null, considerations: 'Mixed waste; sort on site to raise the recycled share.' }),
    line({ inventory: 'waste', description: 'Asbestos insulating board, ceiling voids', family: null, nrm: '0.1', ewcCode: '17 06 05', quantity: 140, unit: 'm2', massT: 1.8, extractability: 0, quality: 0, marketValue: 0, reusableShare: null, cityBand: null, considerations: 'Licensed removal before the strip-out.' }),
  ]
  const pda: PreDemolitionAudit = {
    id: SEEDED_AUDIT_IDS.tiverneDeconstruction,
    kind: 'pre_demolition',
    buildingId: TIVERNE_ID,
    status: 'draft',
    authorOrgId: ORG_IDS.tarnbrook,
    authorUserId: dana,
    createdAt: h.at(20, 11),
    updatedAt: h.at(3, 15, 40),
    completedAt: null,
    auditorName: auditor,
    independence: 'independent',
    reviewer: null,
    surveyedOn: day(12),
    summary: 'Most of the frame, the stone and the raised floors can be reused. The concrete is recycled; the asbestos board comes out first.',
    deskStudy: { drawingsSeen: true, asbestosRegister: 'refurbishment_survey', history: 'Built 1984. Fitted out again in 2003, when the south curtain wall was installed. No change of use.' },
    hazards: [
      { id: 'asbestos', status: 'confirmed', basis: 'survey', note: 'Insulating board in the ceiling voids, levels 2 and 3.' },
      { id: 'lead_paint', status: 'suspected', basis: 'era', note: 'Original radiators and stair balustrades.' },
      { id: 'red_lead', status: 'suspected', basis: 'era', note: 'Test the primer on two beams before the steel is listed.' },
      { id: 'cca_timber', status: 'not_suspected', basis: 'survey', note: 'No treated timber found.' },
    ],
    rows: [...surveyed, ...added],
    targets: { reuseByMass: 0.2, recoveryByWeight: 0.97 },
  }

  const hItems = Object.values(state.world.items).filter((i) => i.buildingId === HARROWDEN_ID)
  let m = 0
  const har: PreDemolitionAudit = {
    id: SEEDED_AUDIT_IDS.harrowdenDeconstruction,
    kind: 'pre_demolition',
    buildingId: HARROWDEN_ID,
    status: 'draft',
    authorOrgId: ORG_IDS.tarnbrook,
    authorUserId: dana,
    createdAt: h.at(6, 14),
    updatedAt: h.at(6, 14, 30),
    completedAt: null,
    auditorName: auditor,
    independence: 'not_declared',
    reviewer: null,
    surveyedOn: null,
    summary: '',
    deskStudy: { drawingsSeen: false, asbestosRegister: 'none', history: '' },
    hazards: [],
    rows: rowsFromItems(hItems, () => `${SEEDED_AUDIT_IDS.harrowdenDeconstruction}_r${++m}`),
    targets: { reuseByMass: null, recoveryByWeight: null },
  }
  audits[pra.id] = pra
  audits[pda.id] = pda
  audits[har.id] = har
  return { ...state, audits }
}
