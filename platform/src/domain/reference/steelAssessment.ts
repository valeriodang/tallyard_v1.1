// Reclaimed structural steel: provenance and assessment codes, the testing protocols of the draft CEN technical
// specification and their sampling, the SCI P427 admissibility rules, project limits and the time each status takes
// (round 3, BRIEF section 15.5). Sources: the ADVANCE project report D2.1 (2024) with the protocol flowchart; the
// DISRUPT reuse toolkit (2023), which restates P427; the literature review's note on structural steel.
import type { ConsequenceClass, ExecutionClass, SteelAssessment, SteelProtocol, SteelProvenance } from '../qualityTypes'
import type { TestStatus } from '../types'
import type { Parameter } from './assumptions'

export const ADVANCE_SOURCE = 'ADVANCE project report D2.1 (2024), protocols for reclaimed structural steel after the draft CEN technical specification'
export const P427_SOURCE = 'SCI P427, as restated in the DISRUPT steel reuse toolkit (2023)'

export const PROVENANCE_LABELS: Record<SteelProvenance, string> = {
  P0: 'Unknown origin',
  P1: 'Known donor building, after 1970, no certificates',
  P2: 'Known donor with EN 10204 documents traceable to the members',
  P3: 'Known donor built 1932 to 1970',
}

export const ASSESSMENT_LABELS: Record<SteelAssessment, string> = {
  S0: 'Captured only',
  S1: 'Visual and dimensional inspection to P427',
  S2: 'Non-destructive screening, hardness or spark spectrometry',
  S3: 'Destructive tests to the sampling rule, with a 3.1 certificate',
  S4: 'CE or UKCA marked under EN 1090-2 by the fabricator',
}

/** Members destructively tested per group: none, one (the softest), three, or every member. */
export const PROTOCOLS: Record<SteelProtocol, { label: string; text: string; samples: 'none' | 'one' | 'three' | 'all' }> = {
  A: { label: 'Protocol A', text: 'Yield estimated from the documents; no destructive test', samples: 'none' },
  B: { label: 'Protocol B', text: 'The member with the lowest hardness in the group is tested', samples: 'one' },
  C: { label: 'Protocol C', text: 'Statistical: three members per group, characteristic values to EN 1990 Annex D', samples: 'three' },
  D: { label: 'Protocol D', text: 'Every member is tested', samples: 'all' },
}

/** The four statuses buyers have always seen, kept as the summary of the pathway. */
export const STATUS_FROM_ASSESSMENT: Record<SteelAssessment, TestStatus> = { S0: 'untested', S1: 'inspected', S2: 'inspected', S3: 'tested', S4: 'certified' }

/** P427 admissibility, asked at capture. A "no" here keeps the member out of reuse, or routes it to P440. */
export const ADMISSIBILITY_RULES: { id: string; label: string; fail: string }[] = [
  { id: 'builtAfter1970', label: 'Made after 1970', fail: 'Made before 1970: assess under SCI P440, testing every member' },
  { id: 'fireExposure', label: 'No fire exposure', fail: 'Exposed to fire' },
  { id: 'plasticDeformation', label: 'No sign of plastic deformation', fail: 'Shows plastic deformation' },
  { id: 'sectionLossOver5', label: 'Corrosion section loss within 5% of the thickness', fail: 'Corrosion section loss over 5% of the thickness' },
  { id: 'builtUpOrSpliced', label: 'Not built up or spliced, or welds to be tested', fail: 'Built up or spliced: disassemble or test the welds' },
  { id: 'fatigueLoading', label: 'Not dynamically or fatigue loaded', fail: 'Dynamically or fatigue loaded: not for reuse in a fatigue-sensitive use' },
  { id: 'withinTolerances', label: 'Within EN 1090-2 geometric tolerances, straightening allowed', fail: 'Outside EN 1090-2 tolerances' },
]

/** Execution classes, consequence classes and the other limits a project may set on reclaimed steel. */
export const EXECUTION_CLASSES: ExecutionClass[] = ['EXC1', 'EXC2', 'EXC3', 'EXC4']
export const CONSEQUENCE_CLASSES: ConsequenceClass[] = ['CC1', 'CC2', 'CC3']
export type { ConsequenceClass, ExecutionClass }

/** Weeks from the listing to steel ready for fabrication, by assessment status (DISRUPT: 6 to 8 weeks from recovery; a lab about a week). */
export const LEAD_WEEKS: Record<SteelAssessment, number> = { S0: 8, S1: 6, S2: 5, S3: 2, S4: 1 }

export function steelRows(): Parameter[] {
  const g = 'Reclaimed steel assessment'
  return [
    { id: 'steel.provenance', group: g, label: 'Provenance codes', value: 'P0 unknown; P1 known donor after 1970; P2 with traceable EN 10204 documents; P3 built 1932 to 1970', unit: '', source: `Published: ${ADVANCE_SOURCE}`, status: 'published' },
    { id: 'steel.assessment', group: g, label: 'Assessment codes', value: 'S0 captured; S1 inspected; S2 NDT screened; S3 tested with a 3.1 certificate; S4 marked to EN 1090-2', unit: '', source: `Published: ${ADVANCE_SOURCE}`, status: 'published' },
    { id: 'steel.samples', group: g, label: 'Members tested per group', value: 'Protocol A none; B one, the softest; C three; D every member', unit: '', source: `Published: ${ADVANCE_SOURCE}`, status: 'published' },
    { id: 'steel.ndt_limit', group: g, label: 'NDT alone is enough for', value: 'EXC1 at any grade; EXC2 below S355', unit: '', source: `Published: ${ADVANCE_SOURCE}, citing a national guide`, status: 'published' },
    { id: 'steel.admissibility', group: g, label: 'Admissible for reuse', value: 'After 1970; no fire; no plastic deformation; section loss within 5%; not built up or spliced; not fatigue loaded; within EN 1090-2 tolerances', unit: '', source: `Published: ${P427_SOURCE}`, status: 'published' },
    { id: 'steel.lead', group: g, label: 'Weeks to steel ready for fabrication', value: 'S0 8; S1 6; S2 5; S3 2; S4 1', unit: 'weeks', source: 'Indicative: from the DISRUPT toolkit, 6 to 8 weeks to recover, test and refabricate and about a week in the lab', status: 'indicative' },
    { id: 'steel.cc3', group: g, label: 'Consequence class 3 or a tall frame', value: 'Extra testing beyond the protocol: the engineer decides', unit: '', source: `Published: ${ADVANCE_SOURCE}`, status: 'published' },
  ]
}
