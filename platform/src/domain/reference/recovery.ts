// The recovery plan's routes (round 3, BRIEF section 15.6): nine routes from keeping an element in place to landfill,
// each mapped to its Level(s) 2.4 circularity route; the route a London owner's guidance recommends for each family;
// and each family's cascade of uses, best first. Sources: the literature review notes 01, 03, 05 and 06 (a landowner's
// circular guidance, the CIRCuIT programme's four strategies for metals, the ADVANCE glossary).
import type { FamilyId } from '../types'
import type { CircularityRoute } from './levels'
import type { Parameter } from './assumptions'

export type RecoveryRoute = 'retain' | 'relocate' | 'reuse_on_site' | 'reuse_off_site' | 'upcycle' | 'recycle' | 'downcycle' | 'energy_recovery' | 'landfill'

/** Best first. Upcycling and downcycling are both forms of recycling in the ADVANCE glossary; upcycling keeps more value. */
export const RECOVERY_ROUTES: { id: RecoveryRoute; label: string; text: string; levels: CircularityRoute; reuse: boolean }[] = [
  { id: 'retain', label: 'Retain', text: 'Kept in place in the new building', levels: 'direct_reuse', reuse: true },
  { id: 'relocate', label: 'Relocate', text: 'Moved whole to a new position in the new building', levels: 'direct_reuse', reuse: true },
  { id: 'reuse_on_site', label: 'Reuse on site', text: 'Taken out and reused in the new building', levels: 'direct_reuse', reuse: true },
  { id: 'reuse_off_site', label: 'Reuse elsewhere', text: 'Taken out and reused on another project, through Tallyard', levels: 'prepare_reuse', reuse: true },
  { id: 'upcycle', label: 'Upcycle', text: 'Made into a product of higher value', levels: 'prepare_reuse', reuse: false },
  { id: 'recycle', label: 'Recycle', text: 'Reprocessed into the same material', levels: 'pure_recycling', reuse: false },
  { id: 'downcycle', label: 'Downcycle', text: 'Crushed, chipped or broken for a lower use', levels: 'mixed_recycling', reuse: false },
  { id: 'energy_recovery', label: 'Energy recovery', text: 'Burnt for energy. Not a form of cycling', levels: 'energy_recovery', reuse: false },
  { id: 'landfill', label: 'Landfill', text: 'Disposed of', levels: 'landfill', reuse: false },
]

export const ROUTE_LABELS: Record<RecoveryRoute, string> = Object.fromEntries(RECOVERY_ROUTES.map((r) => [r.id, r.label])) as Record<RecoveryRoute, string>

/** Where each family goes when it is not reused, from the landowner's recommended routes by material. */
export const FALLBACK_ROUTE: Record<FamilyId, RecoveryRoute> = {
  steel_section: 'recycle',
  curtain_wall: 'recycle',
  precast_cladding: 'downcycle',
  stone_cladding: 'upcycle',
  clay_brick: 'recycle',
  raised_floor: 'downcycle',
  timber_joist: 'upcycle',
  natural_slate: 'downcycle',
  stone_paving: 'upcycle',
  carpet_tile: 'energy_recovery',
  metal_ceiling_tile: 'recycle',
  glulam_beam: 'upcycle',
  hollowcore_plank: 'downcycle',
}

/**
 * Each family's uses in order of the value they keep. For metals the CIRCuIT programme names four strategies, relocate,
 * cascade, reshape and remanufacture, of which relocate and remanufacture keep the most.
 */
export const CASCADES: Record<FamilyId, string[]> = {
  steel_section: ['Relocated whole, as the same member', 'Reshaped: cut to shorter members for a lighter span', 'Cascaded to secondary steel, trimmers and stair stringers', 'Remelted in an electric arc furnace'],
  curtain_wall: ['Reused as units on a similar elevation', 'Units split: glazing and frames reused separately', 'Aluminium recycled, glass to float glass where clean'],
  precast_cladding: ['Reused as cladding panels', 'Reused as infill walls, no more than three in a row', 'Crushed to recycled aggregate'],
  stone_cladding: ['Reused as cladding', 'Re-sawn to thinner slabs, sills or copings', 'Cut to setts and landscape stone', 'Crushed to aggregate'],
  clay_brick: ['Reused as facing brick', 'Reused as common brick, behind a finish', 'Broken brick for landscape and drainage', 'Crushed to aggregate'],
  raised_floor: ['Reused as floor panels, recertified', 'Reused in plant rooms and lower load classes', 'Steel skins recycled; cores to recovery'],
  timber_joist: ['Reused as joists', 'Re-sawn to studwork, battens and furniture', 'Chipped for board', 'Burnt for energy'],
  natural_slate: ['Reused as roofing slate', 'Reused as cladding or paving', 'Crushed for landscape'],
  stone_paving: ['Reused as paving', 'Cut to setts and edging', 'Crushed to aggregate'],
  carpet_tile: ['Reused as carpet tiles, cleaned', 'Reused in back-of-house areas', 'Fibre recovered by the manufacturer', 'Burnt for energy'],
  metal_ceiling_tile: ['Reused as ceiling tiles', 'Repainted and reused', 'Recycled as steel'],
  glulam_beam: ['Reused as beams', 'Re-sawn to smaller members or lamellae', 'Chipped for board', 'Burnt for energy'],
  hollowcore_plank: ['Reused as floor planks', 'Cut to shorter spans', 'Crushed to recycled aggregate'],
}

export const RECOVERY_SOURCE = 'Literature review notes 01, 03, 05 and 06: a London landowner circular guidance, the CIRCuIT programme and the ADVANCE glossary'

export function recoveryRows(): Parameter[] {
  const g = 'Recovery plan routes'
  return [
    { id: 'recovery.routes', group: g, label: 'Routes, best first', value: RECOVERY_ROUTES.map((r) => r.label).join(', '), unit: '', source: `Published: ${RECOVERY_SOURCE}`, status: 'published' },
    { id: 'recovery.levels', group: g, label: 'Level(s) route of each', value: 'Retain, relocate and reuse on site: direct reuse. Reuse elsewhere and upcycle: preparing for reuse. Recycle: pure stream. Downcycle: mixed stream', unit: '', source: 'Indicative: the mapping of the nine routes onto the Level(s) 2.4 routes is a reading, not a figure from the folder', status: 'indicative' },
    { id: 'recovery.fallback', group: g, label: 'Where a family goes when not reused', value: 'Steel, curtain wall, brick and ceiling tiles recycled; stone, timber, glulam and paving upcycled; precast, hollowcore, raised floor and slate downcycled; carpet to energy recovery', unit: '', source: 'Published: a London landowner circular guidance, recommended end-of-life route by material', status: 'published' },
  ]
}
