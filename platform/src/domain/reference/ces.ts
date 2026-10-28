// The circular economy statement workspace (round 3, BRIEF section 15.7). Sources: the GLA guidance (2022), its
// Tables 1 to 3, Figures 4 and 5 and the template's own questions; the 2023 monitoring report's findings; the RICS
// whole life carbon standard, 2nd edition, for lifespans, site waste and end of life.
import type { CesLayer, DesignApproach, ExistingQuestion, WasteStream } from '../cesTypes'
import type { BenchmarkId } from './gla'
import { LPG_SOURCE, MONITORING_SOURCE } from './gla'
import type { Parameter } from './assumptions'

export const CES_LAYERS: { id: CesLayer; label: string; text: string; nrm: string }[] = [
  { id: 'site', label: 'Site', text: 'The location, context, external works, earthworks and landscaping.', nrm: 'NRM 8' },
  { id: 'structure', label: 'Structure', text: 'Foundations and load-bearing elements.', nrm: 'NRM 1, 2.1, 2.2, 2.4' },
  { id: 'skin', label: 'Skin', text: 'The layer keeping out water, wind, heat, cold, sunlight and noise: roof, walls and windows.', nrm: 'NRM 2.3, 2.5, 2.6' },
  { id: 'services', label: 'Services', text: 'Mechanical, electrical, plumbing, lifts and communications.', nrm: 'NRM 5' },
  { id: 'space', label: 'Space plan', text: 'Partitions, ceilings, floors, doors and finishes.', nrm: 'NRM 2.7, 2.8, 3' },
  { id: 'stuff', label: 'Stuff', text: 'Furniture, fittings and equipment.', nrm: 'NRM 4' },
]

export const DESIGN_APPROACHES: { id: DesignApproach; label: string; text: string }[] = [
  { id: 'relocation', label: 'Building relocation', text: 'The whole building can be used on another site, moved whole or as large modules.' },
  { id: 'reuse', label: 'Component or material reuse', text: 'Items reused as a whole, redeployed as modules or as a kit of parts.' },
  { id: 'adaptability', label: 'Adaptability', text: 'The building can be altered, added to or reduced to suit new uses.' },
  { id: 'flexibility', label: 'Flexibility', text: 'The fit-out can be rearranged easily to suit changing needs.' },
  { id: 'disassembly', label: 'Disassembly', text: 'Parts come apart easily for upgrade, reuse, remanufacture or recycling.' },
  { id: 'longevity', label: 'Longevity', text: 'Durable and easy to maintain, so parts last as long as the layer they sit in.' },
  { id: 'recyclability', label: 'Recyclability', text: 'Materials chosen and joined so they can be recycled at the end of life.' },
]

/** The decision tree for existing buildings, in the template's own words. */
export const EXISTING_QUESTIONS: { id: ExistingQuestion; text: string }[] = [
  { id: 'hasBuilding', text: 'Is there an existing building on the site?' },
  { id: 'retainFeasible', text: 'Is it technically feasible to retain the building, in whole or in part?' },
  { id: 'suited', text: 'Is the existing building, or parts of it, suited to the requirements for the site?' },
  { id: 'residualValue', text: "Is it technically feasible to recover the residual value of the building's elements or materials?" },
]

export type ExistingOutcome = 'incomplete' | 'new_building' | 'retain' | 'disassemble' | 'demolish'

/** The guidance's Table 2, with the outcome of having no building to keep. */
export const EXISTING_OUTCOMES: Record<Exclude<ExistingOutcome, 'incomplete'>, { label: string; text: string; rank: number }> = {
  retain: { label: 'Retain and retrofit, or partial retention and refurbishment', text: 'Keep the building, or its carbon-heavy parts such as the frame, floors and substructure, and refurbish.', rank: 1 },
  disassemble: { label: 'Disassemble and reuse', text: 'Take the building apart with care and reuse what comes out, on the site or nearby, recycling only what cannot be reused.', rank: 2 },
  demolish: { label: 'Demolish and recycle', text: 'Traditional demolition, with materials processed into new ones. The least preferred approach.', rank: 3 },
  new_building: { label: 'New building', text: 'No existing building: follow the decision tree for new buildings, layer by layer.', rank: 0 },
}

export const WASTE_STREAMS: { id: WasteStream; label: string; benchmark: BenchmarkId; targetId: string; perYear: boolean }[] = [
  { id: 'demolition', label: 'Demolition waste', benchmark: 'demolition_waste', targetId: 'cd_recovery', perYear: false },
  { id: 'excavation', label: 'Excavation waste', benchmark: 'excavation_waste', targetId: 'excavation', perYear: false },
  { id: 'construction', label: 'Construction waste', benchmark: 'construction_waste', targetId: 'cd_recovery', perYear: false },
  { id: 'municipal', label: 'Municipal waste, in use', benchmark: 'municipal_waste', targetId: 'municipal', perYear: true },
]

/**
 * A reuse share of demolition waste above this is checked: crushed concrete and hardcore used as fill are recycling,
 * not reuse. One London demolition logged 40% as reuse this way (literature review note 05). The threshold is the RICS
 * good-practice reuse share, an indicative reading.
 */
export const REUSE_GUARD_SHARE = 0.25

/** The bill of materials categories the guidance benchmarks, by NRM element number. */
export const NRM_BENCHMARK: { prefix: string; benchmark: BenchmarkId }[] = [
  { prefix: '1', benchmark: 'foundations' },
  { prefix: '2.1', benchmark: 'frame' },
  { prefix: '2.2', benchmark: 'upper_floors' },
  { prefix: '2.3', benchmark: 'roof' },
  { prefix: '2.5', benchmark: 'fabric' },
  { prefix: '2.6', benchmark: 'fabric' },
  { prefix: '2.7', benchmark: 'partitions' },
]

/**
 * The RICS material each NRM element is read as, for its end of life, waste rate and lifespan, where a line names no
 * family. Indicative: a bill line can hold several materials, and the consultant should check the reading.
 */
export const NRM_READING: { prefix: string; eolMaterial: string; wasteRate: string; lifespan: string }[] = [
  { prefix: '1', eolMaterial: 'concrete_in_situ', wasteRate: 'concrete_in_situ', lifespan: 'substructure' },
  { prefix: '2.1', eolMaterial: 'steel_sections', wasteRate: 'steel_frame', lifespan: 'superstructure' },
  { prefix: '2.2', eolMaterial: 'concrete_in_situ', wasteRate: 'concrete_in_situ', lifespan: 'superstructure' },
  { prefix: '2.3', eolMaterial: 'steel_light_gauge', wasteRate: 'roof_cladding', lifespan: 'single_ply' },
  { prefix: '2.5', eolMaterial: 'brickwork', wasteRate: 'brickwork', lifespan: 'masonry_cladding' },
  { prefix: '2.6', eolMaterial: 'glass', wasteRate: 'glass', lifespan: 'windows' },
  { prefix: '2.7', eolMaterial: 'plasterboard', wasteRate: 'plasterboard', lifespan: 'studwork' },
  { prefix: '3', eolMaterial: 'plasterboard', wasteRate: 'floor_tile', lifespan: 'raf_tile' },
  { prefix: '4', eolMaterial: 'wood_panels', wasteRate: 'timber_boards', lifespan: 'ffe' },
  { prefix: '5', eolMaterial: 'mep_ventilation', wasteRate: 'aluminium_sheet', lifespan: 'electrical' },
  { prefix: '8', eolMaterial: 'blockwork', wasteRate: 'stone_landscaping', lifespan: 'paving' },
]

/** The assumed study period of the template's repair and replacement columns. */
export const STUDY_PERIOD_YEARS = 60

export function cesRows(): Parameter[] {
  const g = 'Circular economy statement workspace'
  return [
    { id: 'ces.layers', group: g, label: 'Building layers', value: CES_LAYERS.map((l) => l.label).join(', '), unit: '', source: `Published: ${LPG_SOURCE}, Table 1`, status: 'published' },
    { id: 'ces.approaches', group: g, label: 'Design approaches for new buildings', value: DESIGN_APPROACHES.map((a) => a.label).join(', '), unit: '', source: `Published: ${LPG_SOURCE}, Table 3`, status: 'published' },
    { id: 'ces.tree', group: g, label: 'Decision tree for existing buildings', value: 'Retain; disassemble and reuse; demolish and recycle', unit: '', source: `Published: ${LPG_SOURCE}, Figure 4 and Table 2, as the template asks it`, status: 'published' },
    { id: 'ces.guard', group: g, label: 'Reuse share of demolition waste checked above', value: String(REUSE_GUARD_SHARE * 100), unit: '% by weight', source: 'Indicative: the RICS good-practice reuse share; crushed material counted as reuse was found at one London demolition', status: 'indicative' },
    { id: 'ces.reading', group: g, label: 'Material read for each bill line with no family', value: 'By NRM element: concrete, steel, masonry, glass, plasterboard and others', unit: '', source: 'Indicative: a reading of the RICS 2nd edition Tables 18, 20 and 23 by element', status: 'indicative' },
    { id: 'ces.period', group: g, label: 'Study period for replacements', value: String(STUDY_PERIOD_YEARS), unit: 'years', source: `Published: ${LPG_SOURCE}, the template's bill of materials`, status: 'published' },
    { id: 'ces.findings', group: g, label: 'Statement quality check', value: 'Template used, targets above the minimum, retention explored, audits, post-construction data', unit: '', source: `Published: ${MONITORING_SOURCE}`, status: 'published' },
  ]
}
