// Certification thresholds the round 3 calculators use (BRIEF section 15.7): BREEAM Wst 01 and Home Quality Mark
// construction waste bands (as tabled in the GLA guidance, Appendix 4), BREEAM UK New Construction V6.1 numbering
// (as used in a 2026 stage 3 tracker), LEED v5 interiors materials credits and WELL v2 hazardous materials limits.
import type { Parameter } from './assumptions'

export const LPG_TABLE_SOURCE = 'GLA London Plan Guidance, Circular Economy Statements (March 2022), Appendix 4'
export const BREEAM_V61_SOURCE = 'BREEAM UK New Construction V6.1, as numbered in a 2026 stage 3 interim assessment tracker'
export const LEED_IDC_SOURCE = 'LEED v5 Reference Guide for Interior Design and Construction (November 2025)'
export const WELL_SOURCE = 'WELL Building Standard v2 (Q4 2020)'

/** Non-hazardous construction waste, t per m2 GIA (excluding demolition and excavation): the lower, the more credits. */
export const BREEAM_WST01_BANDS: { credits: string; atMost: number }[] = [
  { credits: '1 credit', atMost: 0.11 },
  { credits: '2 credits', atMost: 0.065 },
  { credits: '3 credits', atMost: 0.032 },
  { credits: 'Exemplary', atMost: 0.019 },
]

export const HQM_WASTE_BANDS: { credits: string; atMost: number }[] = [
  { credits: '2 credits', atMost: 0.085 },
  { credits: '4 credits', atMost: 0.049 },
  { credits: '6 credits', atMost: 0.029 },
  { credits: '8 credits', atMost: 0.019 },
]

/** Wst 01 diversion from landfill, by tonnage (BREEAM measures by volume too: 70% and 80%). */
export const BREEAM_WST01_DIVERSION = { construction: 0.8, demolition: 0.9, constructionByVolume: 0.7, demolitionByVolume: 0.8 }

/** BREEAM UK New Construction V6.1 issue codes. V7 is to confirm against its manual. */
export const BREEAM_V61_ISSUES: { code: string; title: string }[] = [
  { code: 'Mat 01', title: 'Environmental impacts from construction products: building life cycle assessment' },
  { code: 'Mat 02', title: 'Environmental impacts from construction products: environmental product declarations' },
  { code: 'Mat 03', title: 'Responsible sourcing of construction products' },
  { code: 'Mat 05', title: 'Designing for durability and resilience' },
  { code: 'Mat 06', title: 'Material efficiency' },
  { code: 'Wst 01', title: 'Construction waste management' },
  { code: 'Wst 02', title: 'Use of recycled and sustainably sourced aggregates' },
  { code: 'Wst 03', title: 'Operational waste' },
  { code: 'Wst 05', title: 'Adaptation to climate change' },
  { code: 'Wst 06', title: 'Design for disassembly and adaptability' },
]

/** LEED v5 ID+C MRc1, option 1, path 1: on-site reuse of furniture and interior elements, by cost (priced as new). */
export const LEED_ONSITE_REUSE_POINTS: { atLeast: number; points: number }[] = [
  { atLeast: 0.1, points: 1 },
  { atLeast: 0.2, points: 2 },
  { atLeast: 0.3, points: 3 },
  { atLeast: 0.4, points: 4 },
]

/** MRc1, option 1, path 2: on-site furniture reuse by cost. */
export const LEED_FURNITURE_REUSE_POINTS: { atLeast: number; points: number }[] = [
  { atLeast: 0.2, points: 1 },
  { atLeast: 0.4, points: 2 },
]

/** MRc1, option 2: off-site reused materials per material type. Targeted types count for more. */
export const LEED_TARGETED_TYPES = ['carpet', 'ceilings', 'furniture'] as const
export const LEED_OTHER_TYPES = ['dimensional_lumber', 'doors', 'casework', 'floor_covering', 'lighting', 'plumbing', 'mechanical', 'door_hardware', 'other'] as const

/** Each rung lists the alternatives that earn its points: shares per targeted type and per other type. */
export const LEED_OFFSITE_REUSE_RUNGS: { points: number; alternatives: { targetedAt: number; targetedCount: number; otherAt: number; otherCount: number }[] }[] = [
  { points: 1, alternatives: [{ targetedAt: 0.25, targetedCount: 1, otherAt: 0, otherCount: 0 }, { targetedAt: 0, targetedCount: 0, otherAt: 0.25, otherCount: 2 }] },
  { points: 2, alternatives: [{ targetedAt: 0.5, targetedCount: 1, otherAt: 0, otherCount: 0 }, { targetedAt: 0.25, targetedCount: 2, otherAt: 0, otherCount: 0 }, { targetedAt: 0, targetedCount: 0, otherAt: 0.25, otherCount: 4 }] },
  { points: 3, alternatives: [{ targetedAt: 0.75, targetedCount: 1, otherAt: 0, otherCount: 0 }, { targetedAt: 0.5, targetedCount: 2, otherAt: 0, otherCount: 0 }] },
]

export const LEED_MRC1_MAX = 4

/** MRc5 construction and demolition waste diversion paths. Salvage counts twice; unverified mixed recovery is capped. */
export const LEED_DIVERSION_PATHS: { points: number; divertedAtLeast: number; salvagedShareAtLeast: number }[] = [
  { points: 1, divertedAtLeast: 0.35, salvagedShareAtLeast: 0.1 },
  { points: 2, divertedAtLeast: 0.5, salvagedShareAtLeast: 0.2 },
  { points: 3, divertedAtLeast: 0.65, salvagedShareAtLeast: 0.3 },
]
export const LEED_SALVAGE_WEIGHT = 2
export const LEED_UNVERIFIED_MIXED_CAP = 0.35
/** Path 4: one more point when salvaged or separately recycled gypsum, carpet, ceilings and furniture exceed this share. */
export const LEED_TARGETED_DIVERSION_SHARE = 0.1
export const LEED_MRC5_MAX = 4

/** WELL v2 thresholds that bear on reclaimed products (X01 covers newly installed products, reclaimed ones included). */
export const WELL_LIMITS = {
  asbestosPpmNewProducts: 1000,
  asbestosConfirmShare: 0.01,
  leadPaintShareByWeight: 0.005,
  pcbBeforeYear: 1980,
  x01Categories: ['Thermal insulation and lagging', 'Acoustic treatments', 'Sheathing', 'Roofing and siding', 'Fire and smoke protection', 'Joint protection', 'Plaster and gypsum board', 'Ceilings', 'Resilient flooring'],
}

export function schemeRows(): Parameter[] {
  const rows: Parameter[] = []
  const b = 'BREEAM and Home Quality Mark'
  rows.push({ id: 'breeam.wst01.bands', group: b, label: 'Wst 01 construction waste', value: BREEAM_WST01_BANDS.map((x) => `${x.credits} at most ${x.atMost}`).join(', '), unit: 't per m2 GIA', source: `Published: ${LPG_TABLE_SOURCE}`, status: 'published' })
  rows.push({ id: 'breeam.wst01.diversion', group: b, label: 'Wst 01 diversion from landfill', value: `Construction ${BREEAM_WST01_DIVERSION.construction * 100}%, demolition ${BREEAM_WST01_DIVERSION.demolition * 100}% by tonnage (${BREEAM_WST01_DIVERSION.constructionByVolume * 100}% and ${BREEAM_WST01_DIVERSION.demolitionByVolume * 100}% by volume)`, unit: '', source: `Published: ${BREEAM_V61_SOURCE}`, status: 'published' })
  rows.push({ id: 'hqm.waste', group: b, label: 'Home Quality Mark construction waste', value: HQM_WASTE_BANDS.map((x) => `${x.credits} at most ${x.atMost}`).join(', '), unit: 't per m2 GIA', source: `Published: ${LPG_TABLE_SOURCE}`, status: 'published' })
  rows.push({ id: 'breeam.numbering', group: b, label: 'Issue numbering', value: BREEAM_V61_ISSUES.map((x) => `${x.code} ${x.title.toLowerCase()}`).join('; '), unit: '', source: `Published: ${BREEAM_V61_SOURCE}. Version 7 numbering is to confirm against its manual`, status: 'published' })
  const l = 'LEED v5 interiors'
  rows.push({ id: 'leed.mrc1.onsite', group: l, label: 'MRc1 on-site reuse of interiors, by cost', value: LEED_ONSITE_REUSE_POINTS.map((x) => `${x.atLeast * 100}% for ${x.points}`).join(', '), unit: 'points', source: `Published: ${LEED_IDC_SOURCE}, option 1, path 1`, status: 'published' })
  rows.push({ id: 'leed.mrc1.furniture', group: l, label: 'MRc1 on-site furniture reuse, by cost', value: LEED_FURNITURE_REUSE_POINTS.map((x) => `${x.atLeast * 100}% for ${x.points}`).join(', '), unit: 'points', source: `Published: ${LEED_IDC_SOURCE}, option 1, path 2`, status: 'published' })
  rows.push({ id: 'leed.mrc1.offsite', group: l, label: 'MRc1 off-site reused materials', value: 'At least 25%, 50% or 75% of a targeted type (carpet, ceilings, furniture) for 1, 2 or 3 points, or 25% of two or four other types for 1 or 2; at most 4 points in all', unit: 'points', source: `Published: ${LEED_IDC_SOURCE}, option 2`, status: 'published' })
  rows.push({ id: 'leed.mrc5', group: l, label: 'MRc5 waste diversion', value: `${LEED_DIVERSION_PATHS.map((x) => `${x.divertedAtLeast * 100}% diverted with ${x.salvagedShareAtLeast * 100}% salvaged or separated for ${x.points}`).join(', ')}; salvage counts twice; unverified mixed recovery at most ${LEED_UNVERIFIED_MIXED_CAP * 100}%`, unit: 'points', source: `Published: ${LEED_IDC_SOURCE}`, status: 'published' })
  const w = 'WELL v2 hazardous materials'
  rows.push({ id: 'well.x01', group: w, label: 'X01 asbestos in newly installed products', value: `No more than ${WELL_LIMITS.asbestosPpmNewProducts.toLocaleString('en-GB')} ppm in ${WELL_LIMITS.x01Categories.join(', ').toLowerCase()}`, unit: '', source: `Published: ${WELL_SOURCE}, feature X01. Reclaimed products are newly installed products`, status: 'published' })
  rows.push({ id: 'well.x02', group: w, label: 'X02 existing building hazards', value: `Asbestos confirmed above ${WELL_LIMITS.asbestosConfirmShare * 100}%; lead paint above ${WELL_LIMITS.leadPaintShareByWeight * 100}% by weight; PCBs in caulk, ballasts and capacitors made before ${WELL_LIMITS.pcbBeforeYear}`, unit: '', source: `Published: ${WELL_SOURCE}, feature X02`, status: 'published' })
  rows.push({ id: 'well.x03', group: w, label: 'X03 treated timber', value: 'Chromated copper arsenate in existing outdoor timber is identified and managed', unit: '', source: `Published: ${WELL_SOURCE}, feature X03`, status: 'published' })
  return rows
}
