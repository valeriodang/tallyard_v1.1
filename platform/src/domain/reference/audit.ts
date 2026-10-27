// The words and rules of the two audits (round 3, BRIEF section 15.3). Sources: the GLA guidance on circular
// economy statements (2022) and its template; a London pre-redevelopment audit (2023) for the six factors and their
// scale; a European audit template (2022) for the three inventories and the 0 to 4 scores; the Interreg reuse toolkit
// and WELL v2 for the hazard dates; the City of London SPD (2025) for the condition bands.
import type { FamilyId } from '../types'
import type { AuditIndependence, BrokerRoute, BrokerStatus, HazardId, HazardStatus, RetentionFactorId, RetentionOptionKind, RetentionScale } from '../auditTypes'
import type { Parameter } from './assumptions'

export const RETENTION_FACTORS: { id: RetentionFactorId; label: string; question: string }[] = [
  { id: 'technical_capacity', label: 'Technical capacity', question: 'Can the structure carry the new use, loads and fire strategy?' },
  { id: 'energy_performance', label: 'Energy performance', question: 'Can the fabric and services reach the energy standard the scheme needs?' },
  { id: 'occupant_comfort', label: 'Occupant comfort', question: 'Can daylight, heights, ventilation and acoustics meet current expectations?' },
  { id: 'construction_practicalities', label: 'Construction practicalities', question: 'Can the works be built around what is kept: access, cores, sequencing?' },
  { id: 'social_economic_value', label: 'Social and economic value', question: 'Does keeping it hold heritage, community or local value?' },
  { id: 'commercial_viability', label: 'Commercial viability', question: 'Can a kept building meet the brief and let?' },
]

export const RETENTION_SCALE_LABELS: Record<RetentionScale, string> = {
  not_prohibit: 'Not likely to prohibit retention',
  may_be_supported: 'Retention may be supported',
  may_not_be_supported: 'Retention may not be supported',
}

export type ExistingOutcome = 'retain_retrofit' | 'partial_retention' | 'disassemble_reuse' | 'demolish_recycle'

/** The GLA design approaches for existing buildings, best first (guidance Table 2). */
export const EXISTING_OUTCOMES: { id: ExistingOutcome; label: string; text: string }[] = [
  { id: 'retain_retrofit', label: 'Retain and retrofit', text: 'Keep the building whole and bring it up to the brief.' },
  { id: 'partial_retention', label: 'Partial retention and refurbishment', text: 'Keep the parts that suit the site, rebuild the rest.' },
  { id: 'disassemble_reuse', label: 'Disassemble and reuse', text: 'Take it apart for reuse: on this site first, then on sites nearby, then further afield.' },
  { id: 'demolish_recycle', label: 'Demolish and recycle', text: 'The least preferable approach: it needs the most compelling justification.' },
]

export const TREE_QUESTIONS: { id: 'feasibleToRetain' | 'suitedInWhole' | 'suitedInPart' | 'recoverResidualValue'; text: string }[] = [
  { id: 'feasibleToRetain', text: 'Is it technically feasible to retain the building, in whole or in part?' },
  { id: 'suitedInWhole', text: 'Is the whole building suited to the requirements for the site?' },
  { id: 'suitedInPart', text: 'Is part of the building suited to the requirements for the site?' },
  { id: 'recoverResidualValue', text: 'Is it technically feasible to recover the residual value of its elements and materials?' },
]

export const OPTION_KIND_LABELS: Record<RetentionOptionKind, string> = {
  retain_refurbish: 'Retain and refurbish',
  retain_extend: 'Retain and extend',
  partial_retention: 'Partial retention',
  substructure_only: 'Keep the substructure only',
  new_build: 'New build',
}

/** How much each kind keeps, for ordering options from most to least retained when none gives its share. */
export const OPTION_KIND_ORDER: RetentionOptionKind[] = ['retain_refurbish', 'retain_extend', 'partial_retention', 'substructure_only', 'new_build']

export const FOLLOW_ON_ASSESSMENTS = ['Structural assessment', 'Condition survey', 'Building services survey', 'Energy assessment', 'Whole life carbon assessment', 'Financial appraisal', 'Market demand study', 'Social value assessment'] as const

export const INDEPENDENCE_LABELS: Record<AuditIndependence, string> = {
  independent: 'Independent of the design team and the contractor',
  design_team: 'Part of the design team',
  contractor: 'The deconstruction contractor, or appointed by it',
  owner: 'The owner',
  not_declared: 'Not declared',
}

/** Hazards to screen for, suspected when the building was built or last refurbished before the year given. */
export const HAZARDS: { id: HazardId; label: string; before: number; source: string; status: 'published' | 'indicative' }[] = [
  { id: 'asbestos', label: 'Asbestos, in boards, ceilings, adhesives, lagging and fire doors', before: 2000, source: 'Indicative: the UK ban took effect in 1999 (to confirm); WELL v2 X02 asks for an asbestos survey of buildings built before the ban', status: 'indicative' },
  { id: 'lead_paint', label: 'Lead paint, on joinery, radiators and metalwork', before: 1990, source: 'Published: the Interreg reuse toolkit flags lead paint before about 1990; WELL v2 X02 treats paint over 0.5% lead by weight as a hazard', status: 'published' },
  { id: 'red_lead', label: 'Red lead primer on structural steel', before: 1990, source: 'Published: the Interreg reuse toolkit flags red lead primer on steel before about 1990', status: 'published' },
  { id: 'pcb', label: 'PCBs, in caulk, fluorescent ballasts and capacitors', before: 1980, source: 'Published: WELL v2 X02, materials made before 1980', status: 'published' },
  { id: 'cca_timber', label: 'Chromated copper arsenate in treated timber', before: 2006, source: 'Indicative: WELL v2 X03 covers timber treated before the restriction (the year is to confirm)', status: 'indicative' },
  { id: 'tar_adhesive', label: 'Tar adhesives under wood floors and tiles', before: 1990, source: 'Published: the Interreg reuse toolkit flags tar glue and asbestos in tile adhesives before about 1990', status: 'published' },
]

export const HAZARD_STATUS_LABELS: Record<HazardStatus, string> = { not_suspected: 'Not suspected', suspected: 'Suspected', confirmed: 'Confirmed', removed: 'Removed' }

/** The 19 element categories of the GLA template's bill of materials (NRM). */
export const NRM_CATEGORIES: { code: string; label: string }[] = [
  { code: '0.1', label: 'Toxic or hazardous material removal' },
  { code: '0.2', label: 'Major demolition works' },
  { code: '0.3', label: 'Temporary support to adjacent structures' },
  { code: '0.4', label: 'Specialist groundworks' },
  { code: '1', label: 'Substructure' },
  { code: '2.1', label: 'Frame' },
  { code: '2.2', label: 'Upper floors' },
  { code: '2.3', label: 'Roof' },
  { code: '2.4', label: 'Stairs and ramps' },
  { code: '2.5', label: 'External walls' },
  { code: '2.6', label: 'Windows and external doors' },
  { code: '2.7', label: 'Internal walls and partitions' },
  { code: '2.8', label: 'Internal doors' },
  { code: '3', label: 'Finishes' },
  { code: '4', label: 'Fittings, furnishings and equipment' },
  { code: '5', label: 'Services' },
  { code: '6', label: 'Prefabricated buildings and building units' },
  { code: '7', label: 'Work to existing building' },
  { code: '8', label: 'External works' },
]

export function nrmLabel(code: string): string {
  return NRM_CATEGORIES.find((c) => c.code === code)?.label ?? 'Not set'
}

/** The element category and the waste code a family is filed under when an audit line comes from it. */
export const FAMILY_AUDIT_DEFAULTS: Record<FamilyId, { nrm: string; ewc: string }> = {
  steel_section: { nrm: '2.1', ewc: '17 04 05' },
  curtain_wall: { nrm: '2.5', ewc: '17 04 02' },
  precast_cladding: { nrm: '2.5', ewc: '17 01 01' },
  stone_cladding: { nrm: '2.5', ewc: '17 09 04' },
  clay_brick: { nrm: '2.5', ewc: '17 01 02' },
  raised_floor: { nrm: '3', ewc: '17 04 07' },
  timber_joist: { nrm: '2.2', ewc: '17 02 01' },
  natural_slate: { nrm: '2.3', ewc: '17 09 04' },
  stone_paving: { nrm: '8', ewc: '17 09 04' },
  carpet_tile: { nrm: '3', ewc: '17 09 04' },
  metal_ceiling_tile: { nrm: '3', ewc: '17 04 05' },
  glulam_beam: { nrm: '2.1', ewc: '17 02 01' },
  hollowcore_plank: { nrm: '2.2', ewc: '17 01 01' },
}

export const BROKER_ROUTE_LABELS: Record<BrokerRoute, string> = { marketplace: 'Listed on Tallyard', reuse_on_site: 'Reused on this site', other_outlet: 'Another outlet', none: 'No route yet' }
export const BROKER_STATUS_LABELS: Record<BrokerStatus, string> = { not_offered: 'Not offered', offered: 'Offered', agreed: 'Agreed' }

/** Where an inventory item's suggested reusable share comes from its recoverability, as a starting point to check. */
export const REUSABLE_SHARE_FROM_RECOVERABILITY: Record<'A' | 'B' | 'C', number> = { A: 0.9, B: 0.7, C: 0.1 }

export function auditRows(): Parameter[] {
  const g = 'Audits'
  const rows: Parameter[] = [
    { id: 'audit.scores', group: g, label: 'Line scores', value: 'Extractability, quality and market value, each 0 to 4; the line score is their sum over 12', unit: '', source: 'Published: a European pre-demolition audit template (2022)', status: 'published' },
    { id: 'audit.reusable', group: g, label: 'Suggested reusable share', value: 'Recoverability A 90%, B 70%, C 10%, from the surveyed item, to check', unit: 'of the line', source: 'Placeholder: a starting point for the auditor, not a figure from the folder', status: 'placeholder' },
    { id: 'audit.not_suitable', group: g, label: 'An audit that lists only waste routes', value: 'Not suitable', unit: '', source: 'Published: GLA guidance on circular economy statements (2022)', status: 'published' },
  ]
  for (const h of HAZARDS) rows.push({ id: `audit.hazard.${h.id}`, group: g, label: `Hazard screen: ${h.label.split(',')[0].toLowerCase()}`, value: `Suspected when built or refurbished before ${h.before}`, unit: '', source: h.source, status: h.status })
  return rows
}
