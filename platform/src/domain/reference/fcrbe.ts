// Indicative reuse targets by building layer and by mass, from the ex-post analysis of 32 reuse projects by the
// Interreg reuse toolkit (FCRBE, 2023; literature review note 04). Used by the indicators panel (stage 6).
import type { Parameter } from './assumptions'

export const FCRBE_SOURCE = 'Interreg reuse toolkit (FCRBE), ex-post analysis of 32 projects (2023)'

export type LayerBand = { id: string; layer: string; low: number; high: number }

export const LAYER_TARGET_BANDS: LayerBand[] = [
  { id: 'structure', layer: 'Structure', low: 0.01, high: 0.05 },
  { id: 'skin', layer: 'Skin', low: 0.05, high: 0.15 },
  { id: 'space_plan', layer: 'Space plan', low: 0.1, high: 0.25 },
  { id: 'outdoor', layer: 'Outdoor works', low: 0.3, high: 0.5 },
]

/** Conventional buildings in the sample reached this range of reuse by mass overall. */
export const CONVENTIONAL_REUSE_BY_MASS = { low: 0.01, high: 0.1 }

export function fcrbeRows(): Parameter[] {
  const g = 'Reuse targets by layer'
  const rows: Parameter[] = LAYER_TARGET_BANDS.map((b) => ({ id: `fcrbe.${b.id}`, group: g, label: b.layer, value: `${b.low * 100}% to ${b.high * 100}%`, unit: 'reuse by mass', source: `Indicative: ${FCRBE_SOURCE}`, status: 'indicative' }))
  rows.push({ id: 'fcrbe.conventional', group: g, label: 'Conventional buildings, whole building', value: `${CONVENTIONAL_REUSE_BY_MASS.low * 100}% to ${CONVENTIONAL_REUSE_BY_MASS.high * 100}%`, unit: 'reuse by mass', source: `Indicative: ${FCRBE_SOURCE}`, status: 'indicative' })
  return rows
}
