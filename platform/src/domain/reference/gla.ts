// GLA circular economy reference for London (round 3, BRIEF section 15.2): what triggers a circular economy statement,
// what each stage must contain (the guidance's Table 5), the targets with their exact basis, the benchmark quartiles
// in the guidance's Appendix 4 and the 2023 monitoring report, and what that report found missing. Sources are the
// documents added on 27 October 2026; line references are in the round 3 design notes.
import type { Parameter } from './assumptions'

export const LPG_SOURCE = 'GLA London Plan Guidance, Circular Economy Statements (March 2022)'
export const LONDON_PLAN_SOURCE = 'London Plan 2021'
export const MONITORING_SOURCE = 'GLA Circular Economy Monitoring 2023 (November 2024)'
export const LPG_DRAFT_SOURCE = 'GLA Circular Economy Statement Guidance, pre-consultation draft (March 2020)'

/**
 * Referral to the Mayor, from the Town and Country Planning (Mayor of London) Order 2008 as listed in the 2020 draft.
 * "The City" is the City of London, as the guidance writes it; the full name is kept for a building's own location.
 */
export const REFERRAL_CRITERIA: { id: string; label: string }[] = [
  { id: 'homes_150', label: '150 homes or more' },
  { id: 'area_city', label: 'More than 100,000 m2 of floorspace in the City' },
  { id: 'area_central', label: 'More than 20,000 m2 of floorspace elsewhere in central London' },
  { id: 'area_outer', label: 'More than 15,000 m2 of floorspace outside central London' },
  { id: 'height_thames', label: 'Taller than 25 m in the Thames Policy Area' },
  { id: 'height_city', label: 'Taller than 150 m in the City' },
  { id: 'height_elsewhere', label: 'Taller than 30 m elsewhere' },
  { id: 'height_increase', label: 'Raises an existing building by more than 15 m' },
  { id: 'green_belt', label: 'Inappropriate development on Green Belt or Metropolitan Open Land' },
]

export type CesStage = 'pre_app' | 'outline' | 'full' | 'post_construction'
export const CES_STAGES: CesStage[] = ['pre_app', 'outline', 'full', 'post_construction']
export const CES_STAGE_LABELS: Record<CesStage, string> = { pre_app: 'Pre-application', outline: 'Outline application', full: 'Full or reserved matters application', post_construction: 'Post-construction' }

export type StageNeed = 'required' | 'encouraged' | 'not_needed'

/** The guidance's Table 5, minimum submission requirements, with whether the template spreadsheet holds the item. */
export const STAGE_MATRIX: { id: string; label: string; needs: Record<CesStage, StageNeed>; inTemplate: boolean }[] = [
  { id: 'targets', label: 'Circular economy targets', needs: { pre_app: 'encouraged', outline: 'required', full: 'required', post_construction: 'required' }, inTemplate: true },
  { id: 'approaches', label: 'Circular economy design approaches', needs: { pre_app: 'required', outline: 'required', full: 'required', post_construction: 'not_needed' }, inTemplate: true },
  { id: 'principles', label: 'Circular economy design principles', needs: { pre_app: 'required', outline: 'not_needed', full: 'not_needed', post_construction: 'not_needed' }, inTemplate: true },
  { id: 'layers', label: 'Design principles by building layer', needs: { pre_app: 'not_needed', outline: 'required', full: 'required', post_construction: 'not_needed' }, inTemplate: true },
  { id: 'pre_redevelopment', label: 'Pre-redevelopment audit', needs: { pre_app: 'encouraged', outline: 'required', full: 'required', post_construction: 'not_needed' }, inTemplate: false },
  { id: 'pre_demolition', label: 'Pre-demolition audit', needs: { pre_app: 'encouraged', outline: 'required', full: 'required', post_construction: 'not_needed' }, inTemplate: false },
  { id: 'bill_of_materials', label: 'Bill of materials (estimated, then actual)', needs: { pre_app: 'not_needed', outline: 'required', full: 'required', post_construction: 'required' }, inTemplate: true },
  { id: 'end_of_life', label: 'End-of-life strategy', needs: { pre_app: 'not_needed', outline: 'not_needed', full: 'required', post_construction: 'encouraged' }, inTemplate: false },
  { id: 'operational_waste', label: 'Operational waste management plan', needs: { pre_app: 'not_needed', outline: 'not_needed', full: 'required', post_construction: 'encouraged' }, inTemplate: false },
  { id: 'waste_reporting', label: 'Recycling and waste reporting (estimated, then actual)', needs: { pre_app: 'not_needed', outline: 'required', full: 'required', post_construction: 'required' }, inTemplate: true },
  { id: 'lessons', label: 'Key achievements and lessons learnt', needs: { pre_app: 'not_needed', outline: 'not_needed', full: 'not_needed', post_construction: 'required' }, inTemplate: true },
]

/** The post-construction statement is due no more than this many months after construction. */
export const POST_CONSTRUCTION_MONTHS = 3

export type TargetBasis = 'policy' | 'guidance_aim'

export type GlaTarget = { id: string; label: string; value: number; unit: string; basis: TargetBasis; by: string | null; source: string }

/** The targets with their exact wording and basis. All waste targets are by weight (the guidance, paragraph on targets). */
export const GLA_TARGETS: GlaTarget[] = [
  { id: 'cd_recovery', label: 'Construction and demolition waste reused, recycled or recovered', value: 0.95, unit: 'by weight', basis: 'policy', by: null, source: `${LONDON_PLAN_SOURCE}, Policy SI 7 A` },
  { id: 'excavation', label: 'Excavation waste put to beneficial use', value: 0.95, unit: 'by weight', basis: 'policy', by: null, source: `${LONDON_PLAN_SOURCE}, Policy SI 7 A` },
  { id: 'municipal', label: 'Municipal waste recycled', value: 0.65, unit: 'by weight', basis: 'policy', by: '2030', source: `${LONDON_PLAN_SOURCE}, Policy SI 7 A` },
  { id: 'business', label: 'Business waste recycled', value: 0.75, unit: 'by weight', basis: 'guidance_aim', by: '2030', source: `${LPG_SOURCE}, citing the London Environment Strategy, policy 7.2.2` },
  { id: 'landfill_zero', label: 'Biodegradable or recyclable waste sent to landfill', value: 0, unit: 'by weight', basis: 'policy', by: '2026', source: `${LONDON_PLAN_SOURCE}, Policy SI 7 A` },
  { id: 'content', label: 'Recycled or reused content of the whole building', value: 0.2, unit: 'by value', basis: 'guidance_aim', by: null, source: `${LPG_SOURCE}: an aim of at least 20%, with at least 80% of material cost covered. Not in policy` },
]

/** Where not every material can be costed, the content figure must still cover this share of material cost. */
export const CONTENT_COVERAGE_MIN = 0.8

/** A benchmark quartile set: upper quartile is the high (worse) end; applicants should tend to the median and below. */
export type Quartiles = { upper: number; median: number; lower: number; sample: number | null }

export type BenchmarkId = 'demolition_waste' | 'excavation_waste' | 'construction_waste' | 'municipal_waste' | 'foundations' | 'frame' | 'upper_floors' | 'roof' | 'fabric' | 'partitions'

export const BENCHMARK_LABELS: Record<BenchmarkId, { label: string; unit: string }> = {
  demolition_waste: { label: 'Demolition waste', unit: 't per m2 GIA' },
  excavation_waste: { label: 'Excavation waste', unit: 't per m2 GIA' },
  construction_waste: { label: 'Construction waste', unit: 't per m2 GIA' },
  municipal_waste: { label: 'Municipal waste', unit: 't per m2 GIA per year' },
  foundations: { label: 'Foundations', unit: 'kg per m2 GIA' },
  frame: { label: 'Frame', unit: 'kg per m2 GIA' },
  upper_floors: { label: 'Upper floors', unit: 'kg per m2 GIA' },
  roof: { label: 'Roof', unit: 'kg per m2 GIA' },
  fabric: { label: 'Fabric', unit: 'kg per m2 GIA' },
  partitions: { label: 'Partitions', unit: 'kg per m2 GIA' },
}

export const BENCHMARK_IDS = Object.keys(BENCHMARK_LABELS) as BenchmarkId[]

/** The guidance's Appendix 4 (statements up to January 2022), and the 2023 monitoring report's 2022 and 2023 sets. */
export const BENCHMARKS: Record<'lpg' | 'monitoring2022' | 'monitoring2023', { label: string; source: string; values: Record<BenchmarkId, Quartiles> }> = {
  lpg: {
    label: 'Guidance benchmarks',
    source: `${LPG_SOURCE}, Appendix 4`,
    values: {
      demolition_waste: { upper: 0.958, median: 0.48, lower: 0.138, sample: 48 },
      excavation_waste: { upper: 0.77, median: 0.41, lower: 0.15, sample: 47 },
      construction_waste: { upper: 0.113, median: 0.093, lower: 0.065, sample: 56 },
      municipal_waste: { upper: 0.08, median: 0.031, lower: 0.014, sample: 31 },
      foundations: { upper: 907.73, median: 572.5, lower: 222.51, sample: 77 },
      frame: { upper: 368.89, median: 208.04, lower: 92.38, sample: 70 },
      upper_floors: { upper: 702.27, median: 542.33, lower: 294.75, sample: 72 },
      roof: { upper: 77.09, median: 42.37, lower: 17.52, sample: 63 },
      fabric: { upper: 192.48, median: 102.0, lower: 42.29, sample: 78 },
      partitions: { upper: 118.37, median: 60.22, lower: 18.05, sample: 75 },
    },
  },
  monitoring2022: {
    label: 'Statements determined in 2022',
    source: `${MONITORING_SOURCE}, Tables 2 and 3`,
    values: {
      demolition_waste: { upper: 0.71, median: 0.385, lower: 0.125, sample: null },
      excavation_waste: { upper: 0.73, median: 0.47, lower: 0.215, sample: null },
      construction_waste: { upper: 0.112, median: 0.085, lower: 0.065, sample: null },
      municipal_waste: { upper: 0.038, median: 0.018, lower: 0.012, sample: null },
      foundations: { upper: 659.21, median: 391.23, lower: 241.78, sample: null },
      frame: { upper: 279.42, median: 159.9, lower: 96.99, sample: null },
      upper_floors: { upper: 719.9, median: 573.59, lower: 282.0, sample: null },
      roof: { upper: 94.54, median: 49.04, lower: 19.0, sample: null },
      fabric: { upper: 248.23, median: 118.3, lower: 44.08, sample: null },
      partitions: { upper: 124.63, median: 56.5, lower: 20.15, sample: null },
    },
  },
  monitoring2023: {
    label: 'Statements determined in 2023',
    source: `${MONITORING_SOURCE}, Tables 2 and 3`,
    values: {
      demolition_waste: { upper: 0.493, median: 0.253, lower: 0.137, sample: null },
      excavation_waste: { upper: 0.485, median: 0.256, lower: 0.107, sample: null },
      construction_waste: { upper: 0.112, median: 0.078, lower: 0.065, sample: null },
      municipal_waste: { upper: 0.046, median: 0.023, lower: 0.01, sample: null },
      foundations: { upper: 753.5, median: 488.0, lower: 237.53, sample: null },
      frame: { upper: 344.55, median: 174.0, lower: 60.5, sample: null },
      upper_floors: { upper: 649.0, median: 522.5, lower: 220.9, sample: null },
      roof: { upper: 82.0, median: 41.5, lower: 18.0, sample: null },
      fabric: { upper: 217.2, median: 125.89, lower: 74.2, sample: null },
      partitions: { upper: 76.0, median: 48.0, lower: 25.8, sample: null },
    },
  },
}

/** What the GLA's 2023 monitoring found, used by the statement quality check (stage 6). */
export const MONITORING_FINDINGS: { id: string; finding: string; value: string }[] = [
  { id: 'template', finding: 'Statements submitted without the GLA template', value: '45%' },
  { id: 'minimum_targets', finding: 'Average committed targets sit at the policy minimum (demolition 96%, construction 95%, content 21%)', value: 'Typical' },
  { id: 'retention', finding: 'Schemes with an existing building that proposed keeping any of it', value: '13%' },
  { id: 'audits', finding: 'Pre-redevelopment audits received for sites with buildings', value: 'About 19%' },
  { id: 'post_construction', finding: 'Post-construction results analysed', value: 'None' },
]

export function glaRows(): Parameter[] {
  const rows: Parameter[] = []
  const g = 'London circular economy targets'
  for (const t of GLA_TARGETS) {
    const v = t.id === 'landfill_zero' ? 'None' : `${(t.value * 100).toFixed(0)}%`
    rows.push({ id: `gla.target.${t.id}`, group: g, label: t.label, value: t.by ? `${v} by ${t.by}` : v, unit: t.unit, source: `Published: ${t.source}${t.basis === 'guidance_aim' ? '. A guidance aim, not a policy target' : ''}`, status: 'published' })
  }
  rows.push({ id: 'gla.post', group: g, label: 'Post-construction statement', value: `Within ${POST_CONSTRUCTION_MONTHS} months of construction ending`, unit: '', source: `Published: ${LPG_SOURCE}, at the start of RIBA stage 6 and before each phase is occupied`, status: 'published' })
  for (const set of ['lpg', 'monitoring2023'] as const) {
    const b = BENCHMARKS[set]
    for (const id of BENCHMARK_IDS) {
      const q = b.values[id]
      rows.push({ id: `gla.bench.${set}.${id}`, group: `Benchmarks: ${b.label.toLowerCase()}`, label: BENCHMARK_LABELS[id].label, value: `Upper quartile ${q.upper}, median ${q.median}, lower quartile ${q.lower}`, unit: BENCHMARK_LABELS[id].unit, source: `Published: ${b.source}`, status: 'published' })
    }
  }
  return rows
}
