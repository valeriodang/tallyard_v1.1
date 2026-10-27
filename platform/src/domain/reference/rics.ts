// RICS professional standard, Whole life carbon assessment for the built environment, 2nd edition (September 2023),
// as read in round 3 (BRIEF section 15.2). Each table keeps the standard's own figures; where the standard gives a
// range or a footnote, the note says so. Methodology lists every row through `ricsRows()`.
import type { Parameter } from './assumptions'

export const RICS_SOURCE = 'RICS whole life carbon assessment standard, 2nd edition (2023)'

/** Table 17: default transport scenarios for UK projects, road and sea kilometres. */
export type TransportCategory = 'local' | 'regional' | 'national' | 'european' | 'global'

export const TRANSPORT_CATEGORIES: TransportCategory[] = ['local', 'regional', 'national', 'european', 'global']

export const TRANSPORT_DEFAULTS: Record<TransportCategory, { roadKm: number; seaKm: number; label: string; example: string }> = {
  local: { roadKm: 50, seaKm: 0, label: 'Locally manufactured', example: 'aggregate, earth, asphalt (ready-mixed concrete 20 km)' },
  regional: { roadKm: 80, seaKm: 0, label: 'Regionally manufactured', example: 'plasterboard, blockwork, insulation, carpet, glass' },
  national: { roadKm: 120, seaKm: 0, label: 'Nationally manufactured', example: 'structural timber, structural steelwork, reinforcement, precast concrete' },
  european: { roadKm: 1500, seaKm: 100, label: 'European manufactured', example: 'cross-laminated timber, facade modules' },
  global: { roadKm: 500, seaKm: 10000, label: 'Globally manufactured', example: 'specialist stone cladding' },
}

/** Table 18: recommended site waste rates (share of the material delivered that is wasted on site). */
export const WASTE_RATES: { id: string; material: string; rate: number }[] = [
  { id: 'concrete_in_situ', material: 'Concrete in situ', rate: 0.05 },
  { id: 'concrete_precast', material: 'Concrete precast (floor, beams and frames)', rate: 0.01 },
  { id: 'concrete_sprayed', material: 'Concrete (sprayed)', rate: 0.1 },
  { id: 'rebar', material: 'Steel reinforcement', rate: 0.05 },
  { id: 'steel_frame', material: 'Steel frame (beams, columns, braces)', rate: 0.01 },
  { id: 'blocks_aac', material: 'Concrete blocks (lightweight aerated)', rate: 0.1 },
  { id: 'blocks_dense', material: 'Concrete blocks (dense or medium density)', rate: 0.05 },
  { id: 'brickwork', material: 'Brickwork (clay)', rate: 0.06 },
  { id: 'stone_cladding', material: 'Stone (cladding)', rate: 0.05 },
  { id: 'stone_landscaping', material: 'Stone (landscaping)', rate: 0.1 },
  { id: 'mortar_render', material: 'Mortar and render', rate: 0.04 },
  { id: 'screed', material: 'Screed', rate: 0.08 },
  { id: 'floor_tile', material: 'Floor finish (tile)', rate: 0.06 },
  { id: 'floor_carpet', material: 'Floor finish (carpet)', rate: 0.06 },
  { id: 'timber_frame', material: 'Timber frames (beams, columns, joists, braces)', rate: 0.02 },
  { id: 'timber_boards', material: 'Timber floors (boards)', rate: 0.1 },
  { id: 'aluminium_sheet', material: 'Aluminium sheet', rate: 0.01 },
  { id: 'aluminium_profiles', material: 'Aluminium extruded profiles and frames', rate: 0.01 },
  { id: 'plasterboard', material: 'Plasterboard', rate: 0.04 },
  { id: 'insulation', material: 'Insulation', rate: 0.07 },
  { id: 'aggregate', material: 'Aggregate', rate: 0.1 },
  { id: 'glass', material: 'Glass', rate: 0.01 },
  { id: 'coatings', material: 'Coatings (paint, intumescent coatings)', rate: 0.06 },
  { id: 'fire_protection', material: 'Sprayed cementitious fire protection to steel', rate: 0.1 },
  { id: 'asphalt', material: 'Asphalt', rate: 0.06 },
  { id: 'bitumen', material: 'Bitumen', rate: 0.06 },
  { id: 'roof_cladding', material: 'Roof cladding', rate: 0.05 },
]

/** Table 20: indicative component lifespans in years, used where no project-specific figure exists. */
export const LIFESPANS: { id: string; part: string; component: string; years: number }[] = [
  { id: 'substructure', part: 'Substructure', component: 'Piling and foundations, lowest ground floor', years: 60 },
  { id: 'superstructure', part: 'Superstructure', component: 'Frame, upper floors and roof structure', years: 60 },
  { id: 'rainscreen', part: 'Facade', component: 'Rain screens, timber panels', years: 30 },
  { id: 'masonry_cladding', part: 'Facade', component: 'Brick, stone, block and precast concrete panels', years: 60 },
  { id: 'curtain_walling', part: 'Facade', component: 'Glazed cladding and curtain walling', years: 35 },
  { id: 'windows', part: 'Facade', component: 'Hardwood, steel and aluminium windows', years: 30 },
  { id: 'doors', part: 'Facade', component: 'Doors', years: 20 },
  { id: 'single_ply', part: 'Roof', component: 'Single-ply membrane', years: 30 },
  { id: 'standing_seam', part: 'Roof', component: 'Standing seam metal', years: 30 },
  { id: 'roof_tiles', part: 'Roof', component: 'Tiles, clay and concrete', years: 60 },
  { id: 'studwork', part: 'Internal partitions', component: 'Studwork', years: 30 },
  { id: 'blockwork', part: 'Internal partitions', component: 'Blockwork', years: 60 },
  { id: 'render', part: 'Wall finishes', component: 'Render', years: 30 },
  { id: 'paint', part: 'Wall finishes', component: 'Paint', years: 5 },
  { id: 'carpet', part: 'Floor finishes', component: 'Carpet and vinyl', years: 7 },
  { id: 'stone_tiles', part: 'Floor finishes', component: 'Stone tiles', years: 25 },
  { id: 'raf_pedestal', part: 'Floor finishes', component: 'Raised access floor pedestals', years: 50 },
  { id: 'raf_tile', part: 'Floor finishes', component: 'Raised access floor tiles', years: 30 },
  { id: 'ceiling_substrate', part: 'Ceiling finishes', component: 'Substrate and paint', years: 10 },
  { id: 'ceiling_grid', part: 'Ceiling finishes', component: 'Suspended grid (ceiling system)', years: 25 },
  { id: 'ffe', part: 'Furniture', component: 'Loose furniture and fittings', years: 10 },
  { id: 'lighting', part: 'Services', component: 'Lighting fittings', years: 15 },
  { id: 'electrical', part: 'Services', component: 'Electrical installations', years: 30 },
  { id: 'sanitaryware', part: 'Services', component: 'Sanitaryware', years: 20 },
  { id: 'lifts', part: 'Services', component: 'Lift and conveyor installations', years: 20 },
  { id: 'asphalt_paving', part: 'Hard landscaping', component: 'Asphalt', years: 35 },
  { id: 'paving', part: 'Hard landscaping', component: 'Concrete and stone paving', years: 60 },
  { id: 'decking', part: 'Hard landscaping', component: 'Timber decking', years: 15 },
]

/** End-of-life shares by mass. Reuse, recycling, energy recovery (incineration) and disposal sum to 1. */
export type EndOfLifeSplit = { reuse: number; recycle: number; energy: number; disposal: number }

/**
 * Table 23: default business-as-usual end-of-life routes for the UK, by percentage mass. Where the standard prints
 * "under 1%" the share is held as 0.005 and the note says so; disposal includes landfill and losses.
 */
export const BAU_END_OF_LIFE: { id: string; material: string; split: EndOfLifeSplit; note: string }[] = [
  { id: 'concrete_in_situ', material: 'Concrete, cast in situ', split: { reuse: 0, recycle: 0.975, energy: 0, disposal: 0.025 }, note: '' },
  { id: 'concrete_precast', material: 'Concrete, precast', split: { reuse: 0.01, recycle: 0.965, energy: 0, disposal: 0.025 }, note: 'Reuse printed as under 1%, held at the 1% remainder so the shares sum to 100%' },
  { id: 'steel_sections', material: 'Steel, hot-rolled sections, plate and tubes', split: { reuse: 0.07, recycle: 0.93, energy: 0, disposal: 0 }, note: '' },
  { id: 'steel_light_gauge', material: 'Steel, light gauge galvanised', split: { reuse: 0.05, recycle: 0.93, energy: 0, disposal: 0.02 }, note: '' },
  { id: 'steel_piles', material: 'Steel piles', split: { reuse: 0.15, recycle: 0.71, energy: 0, disposal: 0.14 }, note: '' },
  { id: 'rebar', material: 'Rebar', split: { reuse: 0, recycle: 0.98, energy: 0, disposal: 0.02 }, note: '' },
  { id: 'blockwork', material: 'Masonry, blockwork', split: { reuse: 0, recycle: 0.975, energy: 0, disposal: 0.025 }, note: '' },
  { id: 'brickwork', material: 'Masonry, brickwork', split: { reuse: 0, recycle: 0.975, energy: 0, disposal: 0.025 }, note: 'Reuse printed as under 1%, held at 0 because the other shares sum to 100%; brickwork and stonework laid in lime mortar can be reclaimed' },
  { id: 'timber_solid', material: 'Timber, solid (untreated, uncoated)', split: { reuse: 0.01, recycle: 0.78, energy: 0.2, disposal: 0.01 }, note: 'Reuse printed as under 1%, held at the 1% remainder so the shares sum to 100%' },
  { id: 'timber_treated', material: 'Timber, treated or coated', split: { reuse: 0, recycle: 0.3, energy: 0.69, disposal: 0.01 }, note: '' },
  { id: 'timber_engineered', material: 'Timber, engineered (CLT, glulam)', split: { reuse: 0.05, recycle: 0.35, energy: 0.59, disposal: 0.01 }, note: '' },
  { id: 'wood_panels', material: 'Wood-panel products', split: { reuse: 0, recycle: 0, energy: 0.99, disposal: 0.01 }, note: '' },
  { id: 'aluminium_sheet', material: 'Aluminium sheet', split: { reuse: 0, recycle: 0.96, energy: 0, disposal: 0.04 }, note: '' },
  { id: 'aluminium_profile', material: 'Aluminium profile', split: { reuse: 0, recycle: 0.96, energy: 0, disposal: 0.04 }, note: 'Reuse printed as under 1%, held at 0 because the other shares sum to 100%' },
  { id: 'plasterboard', material: 'Plasterboard', split: { reuse: 0, recycle: 0.17, energy: 0, disposal: 0.83 }, note: 'Reuse printed as under 1%, held at 0 because the other shares sum to 100%' },
  { id: 'glass', material: 'Glass, all types', split: { reuse: 0, recycle: 0.61, energy: 0, disposal: 0.39 }, note: '' },
  { id: 'coatings', material: 'Coatings', split: { reuse: 0, recycle: 0, energy: 0, disposal: 1 }, note: '' },
  { id: 'mep_lights', material: 'Lights', split: { reuse: 0, recycle: 0.45, energy: 0, disposal: 0.55 }, note: '' },
  { id: 'mep_ventilation', material: 'Ventilation system', split: { reuse: 0, recycle: 0.4, energy: 0, disposal: 0.6 }, note: '' },
  { id: 'mep_radiators', material: 'Radiators', split: { reuse: 0, recycle: 0.8, energy: 0, disposal: 0.2 }, note: '' },
]

/** Table 24: example end-of-life scenarios at asset level, by percentage mass. */
export type EolScenarioId = 'bau' | 'good' | 'best'

export const EOL_SCENARIOS: Record<EolScenarioId, { label: string; split: EndOfLifeSplit | null; description: string }> = {
  bau: { label: 'Business as usual', split: null, description: 'No effort made to improve deconstruction or recovery: the default rates by material.' },
  good: { label: 'Good practice', split: { reuse: 0.25, recycle: 0.7, energy: 0, disposal: 0.05 }, description: 'Deconstruction and recovery actively considered and captured in design information kept by the client.' },
  best: { label: 'Best practice', split: { reuse: 0.5, recycle: 0.495, energy: 0, disposal: 0.005 }, description: 'Deconstruction and recovery are key drivers of design. Disposal printed as under 1%.' },
}

/** Recipients count reused material from zero: the rule behind the reuse factors (BRIEF section 15.2). */
export const REUSE_CUT_OFF_RULE = 'Reused and recycled material enters the new building with no impact from its previous use; only its reprocessing and transport count, and the benefit beyond the system boundary (module D) belongs to the donor and is reported separately.'

export function ricsRows(): Parameter[] {
  const rows: Parameter[] = []
  const t = 'Transport, RICS defaults'
  for (const id of TRANSPORT_CATEGORIES) {
    const c = TRANSPORT_DEFAULTS[id]
    rows.push({ id: `rics.transport.${id}`, group: t, label: c.label, value: c.seaKm ? `${c.roadKm} by road and ${c.seaKm} by sea` : `${c.roadKm} by road`, unit: 'km', source: `Published: ${RICS_SOURCE}, Table 17, for example ${c.example}`, status: 'published' })
  }
  const w = 'Site waste rates, RICS defaults'
  for (const r of WASTE_RATES) rows.push({ id: `rics.waste.${r.id}`, group: w, label: r.material, value: `${(r.rate * 100).toFixed(0)}%`, unit: 'of material delivered', source: `Published: ${RICS_SOURCE}, Table 18`, status: 'published' })
  const l = 'Component lifespans, RICS defaults'
  for (const r of LIFESPANS) rows.push({ id: `rics.life.${r.id}`, group: l, label: `${r.part}: ${r.component}`, value: String(r.years), unit: 'years', source: `Published: ${RICS_SOURCE}, Table 20`, status: 'published' })
  const e = 'End of life, RICS business as usual'
  for (const r of BAU_END_OF_LIFE) {
    const s = r.split
    rows.push({ id: `rics.eol.${r.id}`, group: e, label: r.material, value: `Reuse ${pct(s.reuse)}, recycling ${pct(s.recycle)}, energy recovery ${pct(s.energy)}, disposal ${pct(s.disposal)}`, unit: 'by mass', source: `Published: ${RICS_SOURCE}, Table 23${r.note ? `. ${r.note}` : ''}`, status: 'published' })
  }
  for (const id of ['good', 'best'] as const) {
    const sc = EOL_SCENARIOS[id]
    const s = sc.split!
    rows.push({ id: `rics.scenario.${id}`, group: e, label: sc.label, value: `Reuse ${pct(s.reuse)}, recycling ${pct(s.recycle)}, disposal ${pct(s.disposal)}`, unit: 'by mass, whole asset', source: `Published: ${RICS_SOURCE}, Table 24. ${sc.description}`, status: 'published' })
  }
  return rows
}

function pct(x: number): string {
  const v = x * 100
  return `${Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1)}%`
}
