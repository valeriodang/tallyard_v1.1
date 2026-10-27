// Browse grouping agreed on the calls (brief/09-V1-PRODUCT.md section 5.1).
import type { FamilyId } from '../types'
import type { Typology } from '../v1types'

const TYPOLOGY: Record<FamilyId, Typology> = {
  steel_section: 'structure',
  timber_joist: 'structure',
  curtain_wall: 'envelope',
  precast_cladding: 'envelope',
  stone_cladding: 'envelope',
  clay_brick: 'envelope',
  raised_floor: 'finishes',
  natural_slate: 'envelope',
  stone_paving: 'finishes',
  carpet_tile: 'finishes',
  metal_ceiling_tile: 'finishes',
  glulam_beam: 'structure',
  hollowcore_plank: 'structure',
}

export function typologyOf(family: FamilyId): Typology {
  return TYPOLOGY[family]
}
