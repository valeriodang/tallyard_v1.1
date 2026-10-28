// The consultant's circular economy statement workspace (round 3, BRIEF section 15.7): the records behind the GLA
// template. Plain data, kept with the project's sustainability records.
import type { CesStage } from './reference/gla'
import type { EolScenarioId } from './reference/rics'

export type YesNo = 'yes' | 'no'

/** The four questions of the guidance's decision tree for existing buildings (Figure 4, as the template asks them). */
export type ExistingQuestion = 'hasBuilding' | 'retainFeasible' | 'suited' | 'residualValue'

/** The building layers of the guidance's Table 1. */
export type CesLayer = 'site' | 'structure' | 'skin' | 'services' | 'space' | 'stuff'

/** The seven design approaches for new buildings, the guidance's Table 3. */
export type DesignApproach = 'relocation' | 'reuse' | 'adaptability' | 'flexibility' | 'disassembly' | 'longevity' | 'recyclability'

export type WasteStream = 'demolition' | 'excavation' | 'construction' | 'municipal'

/** Shares by weight of a waste stream's routes, 0 to 1 each. Reuse covers items used again as they are. */
export type WasteRoutes = { reuseOnsite: number; reuseOffsite: number; recycleOnsite: number; recycleOffsite: number; landfill: number; other: number }

export type WasteEstimate = { tonnes: number | null; routes: WasteRoutes; source: string }

export type Achievement = { id: string; measure: string; action: string }

export type Lesson = { id: string; description: string; solution: string }

export type CesRecord = {
  /** The Mayor's referral criteria that apply, by ID. */
  referralIds: string[]
  /** The borough's own plan asks for a statement. */
  localRequirement: boolean
  stage: CesStage
  existing: Partial<Record<ExistingQuestion, YesNo>>
  /** Why the scheme sits below retention on the decision tree. */
  justification: string
  layers: Partial<Record<CesLayer, { approaches: DesignApproach[]; response: string }>>
  /** The end-of-life scenario the bill of materials assumes; null until chosen. */
  eolScenario: EolScenarioId | null
  /** The cost plan's total material cost, for the content figure's coverage. */
  materialCost: number | null
  waste: Partial<Record<WasteStream, WasteEstimate>>
  /** The rate the scheme aims for, by GLA target ID, 0 to 1. */
  aiming: Partial<Record<string, number>>
  /** Rates achieved, reported after completion. */
  achieved: Partial<Record<string, number>>
  achievements: Achievement[]
  lessons: Lesson[]
  /** A pre-redevelopment and a pre-demolition audit accompany the statement. */
  audits: { preRedevelopment: boolean; preDemolition: boolean }
  updatedAt: string | null
  updatedByUserId: string | null
}
