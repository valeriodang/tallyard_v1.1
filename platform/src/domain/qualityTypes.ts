// What a surveyor or the seller records about an item's quality (round 3, BRIEF section 15.5): the grading answers
// for its family, hazards found, yield and processing, warranty, and for steel the provenance and assessment
// pathway with its group, samples and certificate. Private to the building; only fixed values reach a listing,
// through the `quality` key of the public projection.
import type { HazardId } from './auditTypes'
import type { SteelGrade } from './types'

export type ExecutionClass = 'EXC1' | 'EXC2' | 'EXC3' | 'EXC4'
export type ConsequenceClass = 'CC1' | 'CC2' | 'CC3'

/** What a project's structural engineer allows of reclaimed steel. */
export type SteelLimits = { exc: ExecutionClass; cc: ConsequenceClass; fatigue: boolean; seismic: boolean; grade: SteelGrade }

/** Provenance of reclaimed steel: P0 unknown; P1 known donor after 1970; P2 with traceable EN 10204 papers; P3 1932 to 1970. */
export type SteelProvenance = 'P0' | 'P1' | 'P2' | 'P3'
/** How far the steel has been assessed: S0 captured; S1 inspected; S2 NDT screened; S3 tested with a 3.1 certificate; S4 marked to EN 1090-2. */
export type SteelAssessment = 'S0' | 'S1' | 'S2' | 'S3' | 'S4'
/** The testing protocols of the draft CEN technical specification for reclaimed steel. */
export type SteelProtocol = 'A' | 'B' | 'C' | 'D'

export type YesNoUnknown = 'yes' | 'no' | 'unknown'

/** The SCI P427 admissibility questions, asked at capture. */
export type AdmissibilityAnswers = {
  builtAfter1970: YesNoUnknown
  fireExposure: YesNoUnknown
  plasticDeformation: YesNoUnknown
  sectionLossOver5: YesNoUnknown
  builtUpOrSpliced: YesNoUnknown
  fatigueLoading: YesNoUnknown
  withinTolerances: YesNoUnknown
}

export type SteelCertificate = { ref: string; lab: string; issuedOn: string; grade: 'S275' | 'S355' | 'unknown' }

export type SteelRecord = {
  provenance: SteelProvenance
  assessment: SteelAssessment
  /** Members of the same form, size, function and source are tested as one group. */
  groupId: string
  admissibility: AdmissibilityAnswers
  /** Members destructively tested so far in this group. */
  samplesTested: number
  certificate: SteelCertificate | null
}

export type Processing = 'as_removed' | 'cleaned' | 'refurbished' | 'recertified'
export type WarrantyKind = 'none' | 'seller' | 'manufacturer' | 'insured'

export type ItemQuality = {
  /** The family's grading checks that hold, by check ID. */
  checks: Record<string, boolean>
  /** The family's reject criteria found, by ID. Any one rules the item out of reuse. */
  rejects: string[]
  hazards: { id: HazardId; status: 'suspected' | 'confirmed' | 'cleared' }[]
  /** Share of the captured quantity expected to be usable after removal, 0 to 1. */
  yieldShare: number | null
  processing: Processing
  warranty: { kind: WarrantyKind; years: number | null; note: string }
  steel: SteelRecord | null
  updatedAt: string
}

/** What a buyer learns of an item's quality: fixed values only, never notes, names or certificate numbers. */
export type PublicQuality = {
  assurance: AssuranceTier
  processing: Processing
  warranty: WarrantyKind
  /** Steel only: the provenance and assessment codes. */
  steel: { provenance: SteelProvenance; assessment: SteelAssessment } | null
  /** Hazards confirmed on the item and not cleared, by ID. */
  hazards: HazardId[]
}

/** How well an item is assured for the building layer it goes into. */
export type AssuranceTier = 'declared' | 'inspected' | 'tested' | 'warranted'
