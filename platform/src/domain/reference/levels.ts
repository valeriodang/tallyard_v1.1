// Level(s) indicator 2.4, design for deconstruction: the circularity coefficient of each end-of-life route, as
// reproduced in an EU steel reuse research report (2024; literature review note 01 and 07, image I16).
import type { Parameter } from './assumptions'

export type CircularityRoute = 'direct_reuse' | 'prepare_reuse' | 'pure_recycling' | 'mixed_recycling' | 'material_recovery' | 'energy_recovery' | 'landfill' | 'hazardous_disposal'

export const CIRCULARITY_ROUTES: CircularityRoute[] = ['direct_reuse', 'prepare_reuse', 'pure_recycling', 'mixed_recycling', 'material_recovery', 'energy_recovery', 'landfill', 'hazardous_disposal']

export const LEVELS_COEFFICIENTS: Record<CircularityRoute, { label: string; coefficient: number }> = {
  direct_reuse: { label: 'Direct reuse', coefficient: 1.0 },
  prepare_reuse: { label: 'Preparing for reuse', coefficient: 0.9 },
  pure_recycling: { label: 'Recycling, pure stream', coefficient: 0.75 },
  mixed_recycling: { label: 'Recycling, mixed stream', coefficient: 0.5 },
  material_recovery: { label: 'Material recovery, such as backfill', coefficient: 0.25 },
  energy_recovery: { label: 'Energy recovery', coefficient: 0.15 },
  landfill: { label: 'Landfill, inert or non-hazardous', coefficient: 0.01 },
  hazardous_disposal: { label: 'Disposal of hazardous waste', coefficient: 0 },
}

export const LEVELS_SOURCE = 'EU Level(s) framework, indicator 2.4, as reproduced in an EU steel reuse research report (2024)'

export function levelsRows(): Parameter[] {
  return CIRCULARITY_ROUTES.map((r) => ({ id: `levels.${r}`, group: 'Circularity coefficients, Level(s) 2.4', label: LEVELS_COEFFICIENTS[r].label, value: LEVELS_COEFFICIENTS[r].coefficient.toFixed(2), unit: 'coefficient', source: `Published: ${LEVELS_SOURCE}`, status: 'published' }))
}
