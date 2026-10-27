// Round 3 additions to the first run (BRIEF section 15). They are applied after every earlier record, so the IDs
// minted before them never move; later stages add their records here, in order.
import type { AppData } from '../store/types'
import { notify } from '../store/notifications'
import { TIVERNE_ID, ORG_IDS } from '../domain/seed/world'
import { FENNICK_ID } from './sampleIds'

type At = (daysAgo: number, hour: number, minute?: number) => string

export function withRound3Records(state: AppData, h: { at: At }): AppData {
  let s = state
  // Fennick Dismantling, now a deconstruction contractor with its own workspace, hears of the invitation Tom sent.
  const tiverne = s.world.buildings[TIVERNE_ID]
  if (tiverne && tiverne.contractorOrgId === FENNICK_ID) {
    const owner = s.world.orgs[ORG_IDS.ostlea]?.name ?? 'The owner'
    s = notify(s, { orgIds: [FENNICK_ID], kind: 'appointed', title: `${owner} invited you to set availability dates at ${tiverne.name}`, body: 'Say when each item is expected to come out. The owner decides what buyers see.', href: `/app/buildings/${TIVERNE_ID}/availability`, at: h.at(9, 10), actorUserId: null })
  }
  return s
}
