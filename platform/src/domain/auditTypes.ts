// Audits of a donor building (round 3, BRIEF section 15.3): the pre-redevelopment audit, which asks whether the
// building can be kept, and the pre-deconstruction audit, the inventory of what comes out and where it goes. They
// follow the GLA guidance on circular economy statements (2022), the City of London Carbon Options advice note and
// sustainability planning document, and two London audits in the reference folder. Owner-private records: only the
// building's owner, its surveyor and its contractor read them, never a buyer.
import type { FamilyId } from './types'

export type AuditKind = 'pre_redevelopment' | 'pre_demolition'
export type AuditStatus = 'draft' | 'complete'

/** How the auditor stands to the scheme. The guidance asks for a third-party, independent reclamation specialist. */
export type AuditIndependence = 'independent' | 'design_team' | 'contractor' | 'owner' | 'not_declared'

export type AuditReviewer = { name: string; organisation: string; reviewedOn: string | null; note: string }

type AuditBase = {
  id: string
  kind: AuditKind
  buildingId: string
  status: AuditStatus
  authorOrgId: string
  authorUserId: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
  /** The auditor's firm as it describes itself on the report, free text. */
  auditorName: string
  independence: AuditIndependence
  reviewer: AuditReviewer | null
  surveyedOn: string | null
  summary: string
}

export type RetentionFactorId = 'technical_capacity' | 'energy_performance' | 'occupant_comfort' | 'construction_practicalities' | 'social_economic_value' | 'commercial_viability'
/** The three-point scale of a London pre-redevelopment audit (2023). */
export type RetentionScale = 'not_prohibit' | 'may_be_supported' | 'may_not_be_supported'

/** Answers to the GLA decision tree for existing buildings: yes, no or not answered. */
export type TreeAnswer = 'yes' | 'no' | null
export type ExistingTreeAnswers = { feasibleToRetain: TreeAnswer; suitedInWhole: TreeAnswer; suitedInPart: TreeAnswer; recoverResidualValue: TreeAnswer }

export type RetentionOptionKind = 'retain_refurbish' | 'retain_extend' | 'partial_retention' | 'substructure_only' | 'new_build'

/** One option of a carbon options appraisal (City of London advice note, Table A). Carbon per m2 of the option's GIA. */
export type RetentionOption = {
  id: string
  label: string
  kind: RetentionOptionKind
  /** Share of the existing substructure and superstructure kept, by mass. */
  superstructureRetainedShare: number | null
  /** Share of the existing facade kept, by area. */
  facadeRetainedShare: number | null
  giaM2: number | null
  /** Upfront carbon, modules A1 to A5, kgCO2e per m2 GIA. */
  upfrontKgM2: number | null
  /** Whole life carbon, modules A to C excluding B6 and B7, kgCO2e per m2 GIA. */
  wlcKgM2: number | null
  /** Floor area demolished, m2; its carbon uses the 50 kgCO2e per m2 default unless the option gives one. */
  demolishedAreaM2: number | null
  demolitionKgM2: number | null
  note: string
}

export type PreRedevelopmentAudit = AuditBase & {
  kind: 'pre_redevelopment'
  factors: Record<RetentionFactorId, { scale: RetentionScale | null; note: string }>
  tree: ExistingTreeAnswers
  options: RetentionOption[]
  preferredOptionId: string | null
  /** Why the preferred option was chosen, needed whenever it keeps less than the alternatives explored. */
  justification: string
  followOn: string[]
}

export type HazardId = 'asbestos' | 'lead_paint' | 'red_lead' | 'pcb' | 'cca_timber' | 'tar_adhesive'
export type HazardStatus = 'not_suspected' | 'suspected' | 'confirmed' | 'removed'
export type HazardEntry = { id: HazardId; status: HazardStatus | null; basis: 'era' | 'survey' | 'test' | null; note: string }

export type AuditInventory = 'reuse' | 'recycle' | 'waste'
export type BrokerRoute = 'marketplace' | 'reuse_on_site' | 'other_outlet' | 'none'
export type BrokerStatus = 'not_offered' | 'offered' | 'agreed'

/** One line of the pre-deconstruction audit's inventories. Scores run 0 to 4 (a European audit template, 2022). */
export type AuditRow = {
  id: string
  inventory: AuditInventory
  description: string
  family: FamilyId | null
  /** The NRM element category code, for example '2.1' (frame). */
  nrm: string
  ewcCode: string
  quantity: number | null
  unit: string
  massT: number | null
  extractability: number | null
  quality: number | null
  marketValue: number | null
  /** Share of the line that can be reused. */
  reusableShare: number | null
  /** City of London condition band, 1 (as new) to 6. */
  cityBand: number | null
  considerations: string
  broker: { route: BrokerRoute; status: BrokerStatus; outlet: string }
  /** The inventory item this line came from, or the draft listing made from it. */
  itemId: string | null
}

export type PreDemolitionAudit = AuditBase & {
  kind: 'pre_demolition'
  deskStudy: { drawingsSeen: boolean; asbestosRegister: 'none' | 'seen' | 'refurbishment_survey'; history: string }
  hazards: HazardEntry[]
  rows: AuditRow[]
  targets: { reuseByMass: number | null; recoveryByWeight: number | null }
}

export type BuildingAudit = PreRedevelopmentAudit | PreDemolitionAudit
