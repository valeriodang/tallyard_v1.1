// Turns a capture assist result into the fields of a new item (adapted from the demo's src/store/capture.ts).
import type { AssistResult } from '../domain/engines/assist'
import { captureAssist } from '../domain/engines/assist'
import type { FamilyId, Quantity, Recoverability, Spec } from '../domain/types'

export function specFromAssist(r: AssistResult): Spec | null {
  switch (r.family) {
    case 'steel_section':
      return r.section && r.lengthM !== null ? { family: 'steel_section', designation: r.section, lengthM: r.lengthM } : null
    case 'curtain_wall':
      return r.panelWidthM !== null && r.panelHeightM !== null ? { family: 'curtain_wall', system: 'Unitised', panelWidthM: r.panelWidthM, panelHeightM: r.panelHeightM } : null
    case 'precast_cladding':
      return { family: 'precast_cladding', thicknessMm: r.thicknessMm ?? 0 }
    case 'stone_cladding':
      return { family: 'stone_cladding', stone: 'Portland', thicknessMm: r.thicknessMm ?? 0 }
    case 'clay_brick':
      return { family: 'clay_brick', brickType: 'facing', mortar: r.recoverability === 'A' ? 'lime mortar' : 'cement mortar' }
    case 'raised_floor':
      return { family: 'raised_floor', panelSize: r.panelWidthM && r.panelHeightM ? `${Math.round(r.panelWidthM * 1000)} by ${Math.round(r.panelHeightM * 1000)}` : '600 by 600' }
    case 'timber_joist':
      return { family: 'timber_joist', species: 'softwood' }
    case 'natural_slate':
      return { family: 'natural_slate', origin: 'Welsh', sizeMm: '500 by 250' }
    case 'stone_paving':
      return { family: 'stone_paving', stone: 'York', thicknessMm: r.thicknessMm ?? 50 }
    case 'carpet_tile':
      return { family: 'carpet_tile', sizeMm: '500 by 500', backing: 'bitumen backing' }
    case 'metal_ceiling_tile':
      return { family: 'metal_ceiling_tile', sizeMm: '600 by 600', finish: 'white, perforated' }
    case 'glulam_beam':
      return { family: 'glulam_beam', strengthClass: 'GL24h', sectionMm: '400 by 140' }
    case 'hollowcore_plank':
      return { family: 'hollowcore_plank', depthMm: r.thicknessMm ?? 200 }
    default:
      return null
  }
}

export function quantityFromAssist(r: AssistResult): Quantity | null {
  switch (r.family) {
    case 'steel_section':
    case 'curtain_wall':
    case 'clay_brick':
    case 'raised_floor':
    case 'natural_slate':
    case 'carpet_tile':
    case 'metal_ceiling_tile':
      return r.pieces !== null ? { kind: 'pieces', pieces: r.pieces } : null
    case 'precast_cladding':
    case 'stone_cladding':
    case 'stone_paving':
    case 'hollowcore_plank':
      return r.areaM2 !== null ? { kind: 'area', areaM2: r.areaM2 } : null
    case 'timber_joist':
    case 'glulam_beam':
      return r.volumeM3 !== null ? { kind: 'volume', volumeM3: r.volumeM3 } : null
    default:
      return null
  }
}

/** The quantity kind each family is captured in. */
export const QUANTITY_KIND: Record<FamilyId, Quantity['kind']> = {
  steel_section: 'pieces',
  curtain_wall: 'pieces',
  precast_cladding: 'area',
  stone_cladding: 'area',
  clay_brick: 'pieces',
  raised_floor: 'pieces',
  timber_joist: 'volume',
  natural_slate: 'pieces',
  stone_paving: 'area',
  carpet_tile: 'pieces',
  metal_ceiling_tile: 'pieces',
  glulam_beam: 'volume',
  hollowcore_plank: 'area',
}

export type CaptureDraft = {
  assist: AssistResult
  family: FamilyId | null
  spec: Spec | null
  quantity: Quantity | null
  recoverability: Recoverability | null
  location: string
  /** Fields the description did not give, by the assist engine's names. */
  missing: string[]
  /** True when the description is enough to save. */
  complete: boolean
}

/** The fields a description fills, ready for the capture form. */
export function draftFromText(text: string): CaptureDraft {
  const assist = captureAssist(text)
  const spec = specFromAssist(assist)
  const quantity = quantityFromAssist(assist)
  return { assist, family: assist.family, spec, quantity, recoverability: assist.recoverability, location: assist.location ?? '', missing: assist.missing, complete: !!spec && !!quantity && assist.missing.length === 0 }
}

/** Whether a quantity suits the family and is positive. */
export function validQuantity(family: FamilyId, q: Quantity): boolean {
  if (q.kind !== QUANTITY_KIND[family]) return false
  if (q.kind === 'pieces') return Number.isInteger(q.pieces) && q.pieces > 0
  if (q.kind === 'area') return Number.isFinite(q.areaM2) && q.areaM2 > 0
  return Number.isFinite(q.volumeM3) && q.volumeM3 > 0
}
