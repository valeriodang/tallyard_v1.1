// Grading per family (round 3, BRIEF section 15.5): what condition A, B and C mean, the reject criteria, the checks a
// surveyor ticks, the expected yield after removal, the surplus to order, and how to store it. Sources: the FCRBE
// reuse toolkit's material sheets (2021) and their grading guides as summarised in the literature review; the DISRUPT
// steel toolkit (2023); a London pre-demolition audit (2023) for raised floor and carpet; ADVANCE D2.1 for steel.
// Families the toolkit has no sheet for carry placeholders, and say so.
import type { FamilyId, ReferenceStatus } from '../types'
import type { AssuranceTier, Processing, WarrantyKind } from '../qualityTypes'
import type { HazardId } from '../auditTypes'
import type { Parameter } from './assumptions'
import { FAMILIES } from './families'

export const FCRBE_SOURCE = 'FCRBE reuse toolkit, material sheets (2021)'
const AUDIT_SOURCE = 'A London pre-demolition audit (2023)'

export type GradingGuide = {
  /** What each condition grade means for the family. */
  grades: { A: string; B: string; C: string }
  /** Any one of these rules the item out of reuse. */
  rejects: { id: string; label: string }[]
  /** What the surveyor checks before the item is listed. */
  checks: { id: string; label: string }[]
  /** Share of the captured quantity expected to be usable after removal. */
  yieldShare: number
  yieldSource: string
  yieldStatus: ReferenceStatus
  /** Extra to order on top of the quantity needed, for breakage and cutting. */
  surplusShare: number
  surplusSource: string
  storage: string
}

const PLACEHOLDER = 'Placeholder: the reference folder gives no figure for this family'

export const GRADING: Record<FamilyId, GradingGuide> = {
  steel_section: {
    grades: { A: 'After 1970, grade known, straight, surface rust only', B: 'Grade unknown, fittings or old holes, coating to repaint', C: 'Before 1970 or undocumented; red lead or asbestos; distorted flanges' },
    rejects: [
      { id: 'fire', label: 'Fire, impact or fatigue history' },
      { id: 'plastic', label: 'Plastic deformation' },
      { id: 'section_loss', label: 'Section loss over 5%' },
    ],
    checks: [
      { id: 'tolerances', label: 'Within EN 1090-2 tolerances, or can be straightened' },
      { id: 'group', label: 'Grouped by form, size, function and source for testing' },
      { id: 'coating', label: 'Coating identified, with lead checked on steel before 1990' },
    ],
    yieldShare: 0.7,
    yieldSource: 'Published: DISRUPT steel toolkit, about 70% of the mass recovered, members cut about 1 m from each connection',
    yieldStatus: 'published',
    surplusShare: 0,
    surplusSource: 'None: members are matched to lengths',
    storage: 'On timber bearers, off the ground, drained; shot-blasted members kept covered',
  },
  curtain_wall: {
    grades: { A: 'Units intact, seals sound, glazing undamaged', B: 'Seals or gaskets to renew, minor frame damage', C: 'Glazing to replace, frames to refurbish' },
    rejects: [
      { id: 'broken_frame', label: 'Frames bent or broken' },
      { id: 'failed_units', label: 'Insulating glass units failed throughout' },
    ],
    checks: [
      { id: 'drawings', label: 'Original system drawings and the installation year found' },
      { id: 'seals', label: 'Seals and gaskets checked' },
    ],
    yieldShare: 0.9,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0,
    surplusSource: 'None: units are matched to openings',
    storage: 'On A-frames, upright, glazing protected with board on both faces',
  },
  precast_cladding: {
    grades: { A: 'At least 16 cm, straight, cracks no more than 1 mm, carbonation under half the cover', B: 'Carbonation at or over half the cover, handling spalls', C: 'Local corrosion; tilted out, so non-structural only' },
    rejects: [
      { id: 'through_cracks', label: 'Through cracks' },
      { id: 'corrosion', label: 'Widespread reinforcement corrosion' },
      { id: 'chemical', label: 'Chemical attack' },
    ],
    checks: [
      { id: 'thickness', label: 'Thickness within 1 cm of the stated' },
      { id: 'straightness', label: 'Straight within 5 mm per metre' },
      { id: 'carbonation', label: 'Carbonation depth measured against the cover' },
    ],
    yieldShare: 0.8,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0,
    surplusSource: 'None: panels are matched to the design',
    storage: 'On timber bearers at the lifting points, no more than two high',
  },
  stone_cladding: {
    grades: { A: 'One rock type, intact edges and lug holes, flat, the right thickness', B: 'Chips, stains, enlarged lug holes, needs re-sawing', C: 'Thin bonded slabs, mixed origins' },
    rejects: [
      { id: 'fixing_cracks', label: 'Cracks at the fixing points' },
      { id: 'bowed', label: 'Bowed marble' },
      { id: 'split', label: 'Split slabs' },
    ],
    checks: [
      { id: 'rock', label: 'One rock type and use per batch' },
      { id: 'pull_out', label: 'Anchor pull-out at least 200 N indoors, 300 N outdoors' },
    ],
    yieldShare: 0.8,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0.05,
    surplusSource: `Indicative: ${FCRBE_SOURCE}, stone flooring 5 to 10%`,
    storage: 'On edge in crates, with untreated, tannin-free spacers and no metal straps',
  },
  clay_brick: {
    grades: { A: 'One model, clean, a good face and end, lime mortar', B: 'Paint, small chips, from protected masonry (interior unless tested)', C: 'Hard cement residue, porous, part-bricks' },
    rejects: [
      { id: 'dull', label: 'A dull sound when struck: a crack' },
      { id: 'odour', label: 'Burn marks, or ammonia or fuel odours' },
      { id: 'origin', label: 'From stables, chimneys, basements or foundations' },
    ],
    checks: [
      { id: 'trial', label: 'Dismantling trial on several dozen bricks' },
      { id: 'face', label: 'At least one face and one end good' },
      { id: 'exposure', label: 'Exposed or protected masonry recorded' },
    ],
    yieldShare: 0.6,
    yieldSource: `Published: ${FCRBE_SOURCE}, recovery usually 50 to 70%`,
    yieldStatus: 'published',
    surplusShare: 0.05,
    surplusSource: `Published: ${FCRBE_SOURCE}, about 5%`,
    storage: 'Offset-stacked pallets of 500 to 1,000, no more than 1 m high, wrapped and kept dry',
  },
  raised_floor: {
    grades: { A: 'Label readable, within 25 years, residual deflection no more than 0.5 mm', B: 'Glue residue, worn finish', C: 'No label, cut edge panels, chipboard exposed to damp' },
    rejects: [
      { id: 'warped', label: 'Warped or swollen' },
      { id: 'edges', label: 'Edge damage' },
      { id: 'rust', label: 'Rust on the steel skin' },
    ],
    checks: [
      { id: 'photos', label: 'Photos sent before collection' },
      { id: 'dry', label: 'Kept dry' },
      { id: 'carpet_off', label: 'Carpet removed' },
      { id: 'label', label: 'Underside label read: reference, date, load and fire class' },
      { id: 'pallets', label: 'On pallets, 32 panels to a pallet' },
    ],
    yieldShare: 0.7,
    yieldSource: `Published: ${AUDIT_SOURCE}, 70% of the panels reusable; pedestals are not`,
    yieldStatus: 'published',
    surplusShare: 0,
    surplusSource: 'None: panels are whole units',
    storage: 'Between 15 and 25 degrees C and 40 to 65% relative humidity, flat on pallets with spacers',
  },
  timber_joist: {
    grades: { A: 'Dry, straight, sound, can be graded', B: 'Holes, surface splits, needs drying', C: 'Creep, large splits, unknown preservative' },
    rejects: [
      { id: 'rot', label: 'Active rot or insects' },
      { id: 'tar', label: 'Tar or PCP treatment, for interiors' },
    ],
    checks: [
      { id: 'moisture', label: 'Moisture 15 to 22% for structure, under 18% for roofs' },
      { id: 'grading', label: 'Strength graded to EN 14081-1' },
      { id: 'preservative', label: 'Screened for chromium, lead, copper, arsenic and PCP' },
    ],
    yieldShare: 0.7,
    yieldSource: `Indicative: ${FCRBE_SOURCE}, 20 to 40% loss on solid timber`,
    yieldStatus: 'indicative',
    surplusShare: 0.05,
    surplusSource: PLACEHOLDER,
    storage: 'On blocks, spaced, under cover',
  },
  natural_slate: {
    grades: { A: 'Sound, full size, hung on hooks', B: 'Fixed with copper nails, some holes to redrill', C: 'Old thin slate, iron nails' },
    rejects: [
      { id: 'delaminating', label: 'Flaking or delaminating' },
      { id: 'cracked', label: 'Cracked' },
    ],
    checks: [
      { id: 'origin', label: 'Origin and size recorded' },
      { id: 'sound', label: 'Rings true when tapped' },
    ],
    yieldShare: 0.75,
    yieldSource: `Indicative: ${FCRBE_SOURCE}, losses from a few per cent on hooks to 80% on old thin slate`,
    yieldStatus: 'indicative',
    surplusShare: 0.075,
    surplusSource: `Published: ${FCRBE_SOURCE}, 5 to 10%`,
    storage: 'On edge in crates or on pallets, kept dry',
  },
  stone_paving: {
    grades: { A: 'One stone, intact edges, even thickness', B: 'Chips, stains, uneven backs', C: 'Mixed sizes and stones' },
    rejects: [
      { id: 'split', label: 'Split or laminating flags' },
    ],
    checks: [
      { id: 'thickness', label: 'Thickness recorded for the use' },
    ],
    yieldShare: 0.8,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0.075,
    surplusSource: `Published: ${FCRBE_SOURCE}, stone flooring 5 to 10%`,
    storage: 'On edge on pallets, banded with soft straps',
  },
  carpet_tile: {
    grades: { A: 'Clean, little wear, backing intact', B: 'Wear in places, cleanable', C: 'Heavy wear, for back-of-house use' },
    rejects: [
      { id: 'backing', label: 'Backing failed or stained through' },
      { id: 'damp', label: 'Damp or mould' },
    ],
    checks: [
      { id: 'fire', label: 'Fire class of the original product found' },
      { id: 'clean', label: 'Cleaned and kept dry' },
    ],
    yieldShare: 0.67,
    yieldSource: `Indicative: ${AUDIT_SOURCE}, a 67% reuse target for carpet`,
    yieldStatus: 'indicative',
    surplusShare: 0.05,
    surplusSource: PLACEHOLDER,
    storage: 'Flat, stacked, dry and covered',
  },
  metal_ceiling_tile: {
    grades: { A: 'Flat, clean, finish intact', B: 'Marks, minor dents', C: 'Dents, repaint needed' },
    rejects: [
      { id: 'bent', label: 'Bent or creased' },
      { id: 'asbestos', label: 'Above an asbestos board not yet cleared' },
    ],
    checks: [
      { id: 'grid', label: 'Grid system and module recorded' },
    ],
    yieldShare: 0.75,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0.05,
    surplusSource: PLACEHOLDER,
    storage: 'Boxed, flat, dry',
  },
  glulam_beam: {
    grades: { A: 'Removed by crane, no delamination, moisture 15% or less', B: 'Holes and notches, needs planing', C: 'Removed by grapple: non-structural use only' },
    rejects: [
      { id: 'delamination', label: 'Delamination in the bond test' },
      { id: 'rot', label: 'Rot or insects' },
    ],
    checks: [
      { id: 'bond', label: 'Bond tested by delamination or shear' },
      { id: 'moisture', label: 'Moisture 15% or less' },
      { id: 'service_class', label: 'Service class recorded; it can step down, never up' },
    ],
    yieldShare: 0.8,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0,
    surplusSource: 'None: beams are matched to spans',
    storage: 'On clean spacers under a tarpaulin, opened up for long storage',
  },
  hollowcore_plank: {
    grades: { A: 'Full length, bearings sound, no cracks', B: 'End damage to cut back', C: 'Cut lengths, non-structural use' },
    rejects: [
      { id: 'cracks', label: 'Longitudinal cracks' },
      { id: 'strands', label: 'Corroded or exposed strands' },
    ],
    checks: [
      { id: 'drawings', label: 'Original design loads and strand pattern found' },
    ],
    yieldShare: 0.85,
    yieldSource: PLACEHOLDER,
    yieldStatus: 'placeholder',
    surplusShare: 0,
    surplusSource: 'None: planks are matched to spans',
    storage: 'On timber bearers at the ends, stacked level',
  },
}

/**
 * The materials each hazard is found in (Interreg reuse toolkit, WELL v2 X01 to X03, FCRBE material sheets), so an
 * item is screened only for what can be in it. Asbestos can be in almost anything of the era.
 */
export const HAZARD_FAMILIES: Record<HazardId, FamilyId[] | 'all'> = {
  asbestos: 'all',
  lead_paint: ['steel_section', 'timber_joist', 'glulam_beam', 'curtain_wall', 'metal_ceiling_tile', 'clay_brick'],
  red_lead: ['steel_section'],
  pcb: ['curtain_wall', 'precast_cladding', 'stone_cladding'],
  cca_timber: ['timber_joist', 'glulam_beam'],
  tar_adhesive: ['carpet_tile', 'raised_floor'],
}

export function hazardApplies(hazard: HazardId, family: FamilyId): boolean {
  const f = HAZARD_FAMILIES[hazard]
  return f === 'all' || f.includes(family)
}

export const PROCESSING_LABELS: Record<Processing, string> = { as_removed: 'As removed', cleaned: 'Cleaned', refurbished: 'Refurbished', recertified: 'Recertified' }
export const WARRANTY_LABELS: Record<WarrantyKind, string> = { none: 'No warranty', seller: 'Seller warranty', manufacturer: 'Manufacturer warranty after recertification', insured: 'Insured' }
export const ASSURANCE_LABELS: Record<AssuranceTier, string> = { declared: 'Declared by the seller', inspected: 'Inspected', tested: 'Tested or certified', warranted: 'Warranted' }

/**
 * What each building layer asks for (DISRUPT toolkit): structure needs test proof; the skin needs inspection and
 * quality assurance; the space plan needs a warranty; site work needs the seller's declaration.
 */
export const LAYER_NEEDS: Record<string, AssuranceTier> = { Superstructure: 'tested', 'Shell/Skin': 'inspected', Space: 'warranted', Site: 'declared' }

export function gradingRows(): Parameter[] {
  const g = 'Grading and yield'
  const rows: Parameter[] = [
    { id: 'grading.layers', group: g, label: 'Assurance each layer asks for', value: 'Structure: tested or certified. Skin: inspected. Space plan: warranted. Site: declared', unit: '', source: 'Indicative: the DISRUPT steel toolkit, structure needs test proof, skin needs product liability and quality assurance, space plan needs a warranty', status: 'indicative' },
  ]
  for (const [id, x] of Object.entries(GRADING)) {
    rows.push({ id: `grading.yield.${id}`, group: g, label: `Yield after removal, ${FAMILIES[id as FamilyId].label.toLowerCase()}`, value: `${Math.round(x.yieldShare * 100)}%`, unit: 'of the captured quantity', source: x.yieldSource, status: x.yieldStatus })
  }
  return rows
}
