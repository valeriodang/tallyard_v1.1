// The assessment pathway of reclaimed structural steel (round 3, BRIEF section 15.5): the P427 admissibility screen,
// the protocol a group needs, its sampling, the status buyers see, the grade a designer may use, and what a project's
// limits ask of the steel. Pure: the store and the screens call these and never compute (P2).
import type { SteelGrade, TestStatus } from '../types'
import type { AdmissibilityAnswers, SteelAssessment, SteelLimits, SteelProtocol, SteelProvenance, SteelRecord } from '../qualityTypes'
export type { SteelLimits }
import { ADMISSIBILITY_RULES, LEAD_WEEKS, PROTOCOLS, STATUS_FROM_ASSESSMENT, type ExecutionClass } from '../reference/steelAssessment'

export type Admissibility = {
  verdict: 'admissible' | 'conditional' | 'p440' | 'not_admissible' | 'incomplete'
  /** What rules the member out. */
  fails: string[]
  /** What allows it only on a condition. */
  conditions: string[]
  /** Questions not yet answered. */
  unknown: string[]
}

/** The answer each rule needs to pass: some questions ask after a good thing, some after a defect. */
const PASS_ANSWER: Record<keyof AdmissibilityAnswers, 'yes' | 'no'> = { builtAfter1970: 'yes', fireExposure: 'no', plasticDeformation: 'no', sectionLossOver5: 'no', builtUpOrSpliced: 'no', fatigueLoading: 'no', withinTolerances: 'yes' }
const CONDITIONAL: (keyof AdmissibilityAnswers)[] = ['builtUpOrSpliced', 'fatigueLoading']

export function admissibility(a: AdmissibilityAnswers): Admissibility {
  const fails: string[] = []
  const conditions: string[] = []
  const unknown: string[] = []
  let p440 = false
  for (const rule of ADMISSIBILITY_RULES) {
    const id = rule.id as keyof AdmissibilityAnswers
    const answer = a[id]
    if (answer === 'unknown') unknown.push(rule.label)
    else if (answer !== PASS_ANSWER[id]) {
      if (id === 'builtAfter1970') p440 = true
      else if (CONDITIONAL.includes(id)) conditions.push(rule.fail)
      else fails.push(rule.fail)
    }
  }
  const verdict = fails.length > 0 ? 'not_admissible' : unknown.length > 0 ? 'incomplete' : p440 ? 'p440' : conditions.length > 0 ? 'conditional' : 'admissible'
  return { verdict, fails, conditions, unknown }
}

/**
 * The protocol a group needs, from the flowchart: traceable inspection documents need no destructive test (A); a
 * known modern donor needs one member tested (B), or three where a project wants S355 at EXC2 or above (C); steel
 * before 1970 with no certificates, or of unknown origin, has every member tested (D).
 */
export function protocolFor(provenance: SteelProvenance, wants: { grade: SteelGrade; exc: ExecutionClass } = { grade: 'S275', exc: 'EXC2' }): SteelProtocol {
  if (provenance === 'P2') return 'A'
  if (provenance === 'P1') return wants.grade === 'S355' && wants.exc !== 'EXC1' ? 'C' : 'B'
  return 'D'
}

/** Members to test destructively in a group of n. */
export function samplesNeeded(protocol: SteelProtocol, membersInGroup: number): number {
  const n = Math.max(0, Math.floor(membersInGroup))
  const s = PROTOCOLS[protocol].samples
  return s === 'none' ? 0 : s === 'one' ? Math.min(1, n) : s === 'three' ? Math.min(3, n) : n
}

/** The summary status buyers see. Traceable EN 10204 papers with NDT confirming the groups count as tested. */
export function statusFrom(r: Pick<SteelRecord, 'provenance' | 'assessment'>): TestStatus {
  if (r.provenance === 'P2' && r.assessment === 'S2') return 'tested'
  return STATUS_FROM_ASSESSMENT[r.assessment]
}

/** The grade a designer may use: from the test or the certificate once tested; S275 at most on NDT; unknown before. */
export function usableGrade(r: Pick<SteelRecord, 'provenance' | 'assessment' | 'certificate'>): SteelGrade {
  if (r.assessment === 'S3' || r.assessment === 'S4' || statusFrom(r) === 'tested') return r.certificate?.grade ?? 'unknown'
  if (r.assessment === 'S2') return 'S275'
  return 'unknown'
}

const ORDER: SteelAssessment[] = ['S0', 'S1', 'S2', 'S3', 'S4']

export type SteelCheck = {
  /** The least assessment the project's limits ask for. */
  required: SteelAssessment
  meets: boolean
  /** Weeks until the steel is ready for fabrication at its current status. */
  leadWeeks: number
  notes: string[]
}

/**
 * What a project's limits ask of a member: NDT alone is enough for EXC1 at any grade and for EXC2 below S355;
 * S355 at EXC2, anything at EXC3 or EXC4, fatigue and seismic uses need destructive tests. Consequence class 3 asks
 * for more testing, which the engineer sets.
 */
export function checkAgainst(r: SteelRecord, limits: SteelLimits): SteelCheck {
  const notes: string[] = []
  let required: SteelAssessment = 'S2'
  if (limits.exc === 'EXC3' || limits.exc === 'EXC4' || (limits.exc === 'EXC2' && limits.grade === 'S355')) required = 'S3'
  if (limits.fatigue) {
    required = 'S3'
    if (r.admissibility.fatigueLoading === 'yes') notes.push('Fatigue loaded in its first life: not for a fatigue-sensitive use')
  }
  if (limits.seismic) {
    required = 'S3'
    notes.push('Seismic use: ductility to EN 1993-1-1 clause 5.2.2 from the tests')
  }
  if (limits.cc === 'CC3') notes.push('Consequence class 3: the engineer sets extra testing beyond the protocol')
  const meets = ORDER.indexOf(r.assessment) >= ORDER.indexOf(required) && !(limits.fatigue && r.admissibility.fatigueLoading === 'yes')
  return { required, meets, leadWeeks: LEAD_WEEKS[r.assessment], notes }
}

/** The assessment a listing stands at, from its steel record when it has one, else from its summary status. */
export function assessmentOf(steel: { assessment: SteelAssessment } | null, testStatus: TestStatus): SteelAssessment {
  if (steel) return steel.assessment
  return testStatus === 'certified' ? 'S4' : testStatus === 'tested' ? 'S3' : testStatus === 'inspected' ? 'S1' : 'S0'
}

/** A project's limits against a listing, from public facts only: the assessment it stands at. */
export function checkPublic(assessment: SteelAssessment, limits: SteelLimits): SteelCheck {
  const blank: AdmissibilityAnswers = { builtAfter1970: 'unknown', fireExposure: 'unknown', plasticDeformation: 'unknown', sectionLossOver5: 'unknown', builtUpOrSpliced: 'unknown', fatigueLoading: 'unknown', withinTolerances: 'unknown' }
  return checkAgainst({ provenance: 'P0', assessment, groupId: '', admissibility: blank, samplesTested: 0, certificate: null }, limits)
}

/** A fresh record for a member of a building built in the given year: provenance from the year, nothing answered yet. */
export function freshSteelRecord(yearBuilt: number | null, groupId: string): SteelRecord {
  const provenance: SteelProvenance = yearBuilt === null ? 'P0' : yearBuilt >= 1970 ? 'P1' : yearBuilt >= 1932 ? 'P3' : 'P0'
  const unknown = 'unknown' as const
  return { provenance, assessment: 'S0', groupId, admissibility: { builtAfter1970: yearBuilt === null ? unknown : yearBuilt >= 1970 ? 'yes' : 'no', fireExposure: unknown, plasticDeformation: unknown, sectionLossOver5: unknown, builtUpOrSpliced: unknown, fatigueLoading: unknown, withinTolerances: unknown }, samplesTested: 0, certificate: null }
}
