// End of life against the business-as-usual case (round 3, BRIEF section 15.2 and 15.6). The RICS 2nd edition gives
// the UK's business-as-usual routes per material (Table 23) and two asset-level scenarios (Table 24). A scenario
// never makes a material worse than its business-as-usual case: where its disposal share is higher, the material's
// own rate is kept and recycling takes up the rest (the standard's own rule).
import type { FamilyId } from '../types'
import { BAU_END_OF_LIFE, EOL_SCENARIOS, type EndOfLifeSplit, type EolScenarioId } from '../reference/rics'
import { LEVELS_COEFFICIENTS } from '../reference/levels'

/** The Table 23 material each family is read as. Where the table has no row, the closest one is named in the note. */
export const FAMILY_EOL_MATERIAL: Record<FamilyId, { material: string; note: string }> = {
  steel_section: { material: 'steel_sections', note: '' },
  curtain_wall: { material: 'aluminium_profile', note: 'Read as aluminium framing; the glass alone recycles less (61%)' },
  precast_cladding: { material: 'concrete_precast', note: '' },
  stone_cladding: { material: 'brickwork', note: 'No stone row: read as masonry, which the standard notes can be reclaimed' },
  clay_brick: { material: 'brickwork', note: '' },
  raised_floor: { material: 'steel_light_gauge', note: 'No raised floor row: read as light gauge steel, the panel skin and pedestals' },
  timber_joist: { material: 'timber_solid', note: '' },
}

export function bauSplit(materialId: string): EndOfLifeSplit {
  const r = BAU_END_OF_LIFE.find((x) => x.id === materialId)
  if (!r) throw new Error(`No business-as-usual row ${materialId}`)
  return r.split
}

export function familyBauSplit(family: FamilyId): EndOfLifeSplit {
  return bauSplit(FAMILY_EOL_MATERIAL[family].material)
}

/** A material's split under a scenario, never worse than its own business-as-usual case. */
export function scenarioSplit(scenario: EolScenarioId, bau: EndOfLifeSplit): EndOfLifeSplit {
  const sc = EOL_SCENARIOS[scenario].split
  if (!sc) return bau
  const reuse = Math.max(sc.reuse, bau.reuse)
  const disposal = Math.min(sc.disposal, bau.disposal)
  const energy = Math.min(bau.energy, Math.max(0, 1 - reuse - disposal))
  const recycle = Math.max(0, 1 - reuse - disposal - energy)
  return { reuse, recycle, energy, disposal }
}

/** Metals recycle as a pure stream; everything else is counted as mixed-stream recycling. */
const PURE_STREAM_MATERIALS = new Set(['steel_sections', 'steel_light_gauge', 'steel_piles', 'rebar', 'aluminium_sheet', 'aluminium_profile'])

/** The Level(s) 2.4 circularity of a split: each route's share times its coefficient. */
export function splitCircularity(split: EndOfLifeSplit, materialId: string): number {
  const recycling = PURE_STREAM_MATERIALS.has(materialId) ? LEVELS_COEFFICIENTS.pure_recycling.coefficient : LEVELS_COEFFICIENTS.mixed_recycling.coefficient
  return split.reuse * LEVELS_COEFFICIENTS.direct_reuse.coefficient + split.recycle * recycling + split.energy * LEVELS_COEFFICIENTS.energy_recovery.coefficient + split.disposal * LEVELS_COEFFICIENTS.landfill.coefficient
}

export type ReuseGain = { massT: number; bauReuseShare: number; bauReusedT: number; reusedT: number; gainT: number }

/** How much more is reused than the business-as-usual case would give, for a quantity that is reused in full. */
export function reuseGainOverBau(family: FamilyId, massT: number, reusedShare = 1): ReuseGain {
  const bau = familyBauSplit(family)
  const bauReusedT = massT * bau.reuse
  const reusedT = massT * reusedShare
  return { massT, bauReuseShare: bau.reuse, bauReusedT, reusedT, gainT: reusedT - bauReusedT }
}
