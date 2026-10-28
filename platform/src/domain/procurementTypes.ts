// Specification v2 and the client's procurement pack (round 3, BRIEF section 15.7). Plain data.

/** How reclaimed items reach the site (FCRBE procurement factsheets 3, 4 and 12). */
export type SupplyRoute = 'free_issue' | 'contractor_sourced' | 'dealer' | 'reuse_lot'

/** The duties the responsibility matrix assigns for each route. */
export type ResponsibilityTask = 'buys' | 'stores' | 'prepares' | 'tests' | 'insures' | 'liable'

/** The fields of a reuse clause the architect may set, in the FCRBE factsheet 12 structure. */
export type SpecClauseField = 'location' | 'tolerances' | 'patina' | 'operations' | 'acceptance' | 'fallback'

/** The architect's own entries for one clause, by public ID. Fields left out read the generated text. */
export type SpecClauseV2 = Partial<Record<SpecClauseField, string>> & { route?: SupplyRoute; surplusShare?: number }

export type Ambition = 'baseline' | 'ambitious' | 'pioneering'

export type TargetUnit = 'value' | 'mass'

export type AwardTemplateId = 'urban_works' | 'renovation' | 'design' | 'custom'

export type AwardCriterion = { id: string; label: string; weight: number; reuse: boolean }

/** The client's procurement pack for a project. Client-written; public facts and the project's own words only. */
export type ProcurementPack = {
  ambition: Ambition
  unit: TargetUnit
  /** The reuse target as a share, 0 to 1. */
  targetShare: number
  route: SupplyRoute
  /** The clause IDs the client includes, in library order. */
  clauseIds: string[]
  award: { template: AwardTemplateId; criteria: AwardCriterion[] }
  /** A sum for tests and losses, as a share of the reclaimed supply. */
  provisionalShare: number
  updatedAt: string
  byUserId: string
}
