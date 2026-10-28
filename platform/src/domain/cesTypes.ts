// The consultant's circular economy statement workspace (round 3, BRIEF section 15.7): the records behind the GLA
// template. Plain data, kept with the project's sustainability records.
import type { CesStage } from './reference/gla'
import type { EolScenarioId } from './reference/rics'
import type { LeedMaterialType } from './reference/schemes'
import type { RetentionOption } from './auditTypes'

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

/** The City of London's condition bands: 1 and 2 reuse, 3 and 4 repurpose, 5 and 6 recycle. */
export type ConditionBand = 1 | 2 | 3 | 4 | 5 | 6

/** An item of the reuse catalogue: what the existing building on the site holds for reuse. */
export type CatalogueEntry = { id: string; item: string; quantity: string; band: ConditionBand | null }

/** A material passport for a carbon-intensive new material. */
export type PassportEntry = { id: string; material: string; reference: string }

/** The City of London's records for a project in the City (round 3, stage 6c). */
export type CityRecord = {
  /** The carbon options appraisal for the site, in the advice note's Table A. */
  options: RetentionOption[]
  preferredId: string | null
  /** Why the preferred option is chosen when it keeps less, or is not the lowest whole life carbon. */
  justification: string
  /** The independent reviewer of the carbon options. */
  reviewer: { name: string; organisation: string; years: number | null; signedOffOn: string | null }
  catalogue: CatalogueEntry[]
  /** The condition band of each reclaimed item on the reuse schedule, by public ID. */
  scheduleBands: Record<string, ConditionBand>
  passports: PassportEntry[]
  /** When the statement was updated at RIBA stages 4 and 6. */
  updates: { stage4: string | null; stage6: string | null }
}

/** The consultant's inputs to the LEED v5 interiors calculators; waste comes from the statement's estimates. */
export type LeedInputs = {
  /** MRc1 option 1, path 1: interiors and furniture reused on site, and all of them, priced as new. */
  onsiteReused: number | null
  onsiteTotal: number | null
  /** MRc1 option 1, path 2: furniture alone. */
  furnitureReused: number | null
  furnitureTotal: number | null
  /** MRc1 option 2: the share of each material type reused from off site, 0 to 1. */
  offsite: Partial<Record<LeedMaterialType, number>>
  /** MRc5: the share of recycling that was source-separated; the rest goes to a mixed facility. */
  separatedShare: number | null
  /** MRc5: the mixed facility's verified recovery rate; null takes the 35% cap. */
  mixedRate: number | null
  /** MRc5 path 4: tonnes of gypsum, carpet, ceilings and furniture salvaged or source-separated. */
  targetedT: number | null
}

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
  /** Round 3, stage 6c: the City of London module, for projects in the City. */
  city: CityRecord
  /** Round 3, stage 6c: the LEED v5 interiors calculators. */
  leed: LeedInputs
  updatedAt: string | null
  updatedByUserId: string | null
}
