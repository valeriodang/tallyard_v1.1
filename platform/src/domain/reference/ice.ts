// ICE database V3 factors for common materials, as tabled in a London pre-demolition audit (2024) that used them to
// estimate the carbon its reuse table avoids (literature review note 08, D56). Round 3 reference (BRIEF section 15.2).
import type { Parameter } from './assumptions'

export const ICE_SOURCE = 'ICE database V3, as tabled in a London pre-demolition audit (2024)'

/** kgCO2e per kg, modules A1 to A3. */
export const ICE_FACTORS: { id: string; material: string; factor: number }[] = [
  { id: 'steel_section', material: 'Steel section', factor: 1.55 },
  { id: 'rebar', material: 'Steel reinforcement bar', factor: 1.99 },
  { id: 'brick', material: 'Clay brick', factor: 0.21 },
  { id: 'stone', material: 'Stone', factor: 0.08 },
  { id: 'glass', material: 'Glass', factor: 1.6 },
  { id: 'aluminium', material: 'Aluminium', factor: 6.58 },
  { id: 'chipboard', material: 'Chipboard', factor: 0.7 },
  { id: 'concrete', material: 'Concrete, general', factor: 0.1 },
  { id: 'carpet_tiles', material: 'Carpet tiles', factor: 13.0 },
  { id: 'softwood', material: 'Softwood', factor: 0.3 },
  { id: 'plasterboard', material: 'Plasterboard', factor: 0.4 },
]

export function iceFactor(id: string): number {
  const f = ICE_FACTORS.find((x) => x.id === id)
  if (!f) throw new Error(`No ICE factor ${id}`)
  return f.factor
}

export function iceRows(): Parameter[] {
  return ICE_FACTORS.map((f) => ({ id: `ice.${f.id}`, group: 'Carbon factors, ICE V3', label: f.material, value: String(f.factor), unit: 'kgCO2e per kg, modules A1 to A3', source: `Published: ${ICE_SOURCE}`, status: 'published' }))
}
