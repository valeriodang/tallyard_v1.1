// Material families and parameters (06-DATA.md section A2).
import type { FamilyId, FactorStatus, Spec, StorageNeed } from '../types'
import type { TransportCategory } from './rics'

export type Family = {
  id: FamilyId
  label: string
  layer: string
  unit: string
  unitPlural: string
  pricingUnitLabel: string
  massRule: string
  /** Where the mass rule comes from, shown in Methodology. */
  massRuleSource: string
  massRuleStatus: FactorStatus
  /** Where new product of this family is usually made, for the RICS default transport distance (Table 17). */
  newOrigin: TransportCategory
  newOriginNote: string
  factorNew: number
  factorReuse: number
  factorBasis: 't' | 'm2'
  factorNewSource: string
  factorNewStatus: FactorStatus
  factorReuseSource: string
  factorReuseStatus: FactorStatus
  newPrice: number
  baseReuseRatio: number
  scrapValue: number
  capRatio: number
  tick: number
  recoveryPremium: number
  storage: StorageNeed
  arealDensityKgM2: number | null
  unitMassKg: number | null
  densityKgM3: number | null
  countable: boolean
}

export const FAMILIES: Record<FamilyId, Family> = {
  steel_section: {
    id: 'steel_section',
    label: 'Structural steel section',
    layer: 'Superstructure',
    unit: 'tonne',
    unitPlural: 'tonnes',
    pricingUnitLabel: 'per tonne',
    massRule: 'pieces x length x kg per metre',
    massRuleSource: 'Published: section tables, mass per metre times length',
    massRuleStatus: 'published',
    newOrigin: 'national',
    newOriginNote: 'RICS example for nationally manufactured: structural steelwork',
    factorNew: 1.74,
    factorReuse: 0.0466,
    factorBasis: 't',
    factorNewSource: 'Published: UK average for new structural sections, modules A1 to A3, the blended market rate the RICS standard cites (ICE V3 gives 1.55 for sections)',
    factorNewStatus: 'published',
    factorReuseSource: 'Published: a declaration for reclaimed structural sections, modules A1 to A3 (25.5, 13.4 and 7.7 kgCO2e per tonne). Reprocessing only, under the RICS rule for reused material',
    factorReuseStatus: 'published',
    newPrice: 1000,
    baseReuseRatio: 0.8,
    scrapValue: 220,
    capRatio: 0.95,
    tick: 5,
    recoveryPremium: 90,
    storage: 'open_or_covered',
    arealDensityKgM2: null,
    unitMassKg: null,
    densityKgM3: null,
    countable: true,
  },
  curtain_wall: {
    id: 'curtain_wall',
    label: 'Curtain wall panel',
    layer: 'Shell/Skin',
    unit: 'm2',
    unitPlural: 'm2',
    pricingUnitLabel: 'per m2',
    massRule: '55 kg per m2',
    massRuleSource: 'Sample data',
    massRuleStatus: 'placeholder',
    newOrigin: 'european',
    newOriginNote: 'RICS example for European manufactured: facade modules',
    factorNew: 200,
    factorReuse: 15,
    factorBasis: 'm2',
    factorNewSource: 'Indicative: published studies give about 150 to 190 for aluminium curtain walling',
    factorNewStatus: 'indicative',
    factorReuseSource: 'Placeholder: assumes units are reinstalled without re-glazing',
    factorReuseStatus: 'placeholder',
    newPrice: 1000,
    baseReuseRatio: 0.1,
    scrapValue: 10,
    capRatio: 0.95,
    tick: 1,
    recoveryPremium: 35,
    storage: 'covered_only',
    arealDensityKgM2: 55,
    unitMassKg: null,
    densityKgM3: null,
    countable: true,
  },
  precast_cladding: {
    id: 'precast_cladding',
    label: 'Precast cladding panel',
    layer: 'Shell/Skin',
    unit: 'm2',
    unitPlural: 'm2',
    pricingUnitLabel: 'per m2',
    massRule: '360 kg per m2',
    massRuleSource: 'Sample data: 150 mm at 2,400 kg per m3, which the reuse toolkit study confirms',
    massRuleStatus: 'indicative',
    newOrigin: 'national',
    newOriginNote: 'RICS example for nationally manufactured: precast concrete',
    factorNew: 0.178,
    factorReuse: 0.01,
    factorBasis: 't',
    factorNewSource: 'Published: ICE database V3, precast concrete, unreinforced',
    factorNewStatus: 'published',
    factorReuseSource: 'Placeholder',
    factorReuseStatus: 'placeholder',
    newPrice: 320,
    baseReuseRatio: 0.15,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 1,
    recoveryPremium: 60,
    storage: 'open_or_covered',
    arealDensityKgM2: 360,
    unitMassKg: null,
    densityKgM3: null,
    countable: false,
  },
  stone_cladding: {
    id: 'stone_cladding',
    label: 'Stone cladding',
    layer: 'Shell/Skin',
    unit: 'm2',
    unitPlural: 'm2',
    pricingUnitLabel: 'per m2',
    massRule: '110 kg per m2',
    massRuleSource: 'Sample data: about 40 mm of limestone (the reuse toolkit gives 52 kg per m2 at 20 mm)',
    massRuleStatus: 'indicative',
    newOrigin: 'national',
    newOriginNote: 'UK quarried stone such as Portland; RICS treats specialist imported stone as global',
    factorNew: 0.08,
    factorReuse: 0.01,
    factorBasis: 't',
    factorNewSource: 'Indicative: published declarations for Portland stone are lower',
    factorNewStatus: 'indicative',
    factorReuseSource: 'Placeholder',
    factorReuseStatus: 'placeholder',
    newPrice: 450,
    baseReuseRatio: 0.4,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 1,
    recoveryPremium: 70,
    storage: 'open_or_covered',
    arealDensityKgM2: 110,
    unitMassKg: null,
    densityKgM3: null,
    countable: false,
  },
  clay_brick: {
    id: 'clay_brick',
    label: 'Clay brick',
    layer: 'Shell/Skin',
    unit: 'brick',
    unitPlural: 'bricks',
    pricingUnitLabel: 'per brick',
    massRule: '2.3 kg each',
    massRuleSource: 'Sample data',
    massRuleStatus: 'placeholder',
    newOrigin: 'national',
    newOriginNote: 'UK made bricks',
    factorNew: 0.213,
    factorReuse: 0.0027,
    factorBasis: 't',
    factorNewSource: 'Published: ICE database V3, clay brick',
    factorNewStatus: 'published',
    factorReuseSource: 'Published: a declaration for reclaimed clay bricks, cleaning and sorting only',
    factorReuseStatus: 'published',
    newPrice: 0.85,
    baseReuseRatio: 1.4,
    scrapValue: 0,
    capRatio: 3.0,
    tick: 0.01,
    recoveryPremium: 0.35,
    storage: 'open_or_covered',
    arealDensityKgM2: null,
    unitMassKg: 2.3,
    densityKgM3: null,
    countable: true,
  },
  raised_floor: {
    id: 'raised_floor',
    label: 'Raised access floor panel',
    layer: 'Space',
    unit: 'panel',
    unitPlural: 'panels',
    pricingUnitLabel: 'per panel',
    massRule: '9.3 kg and 0.36 m2 each',
    massRuleSource: 'Indicative: a London pre-demolition audit gives 320.5 t over 34,572 panels, about 9.3 kg each (steel skin, chipboard core)',
    massRuleStatus: 'indicative',
    newOrigin: 'national',
    newOriginNote: 'UK made or recertified panels',
    factorNew: 40,
    factorReuse: 8.6,
    factorBasis: 'm2',
    factorNewSource: 'Indicative: a published declaration for a new panel, fossil carbon',
    factorNewStatus: 'indicative',
    factorReuseSource: 'Indicative: a published declaration for a reclaimed panel system with new pedestals',
    factorReuseStatus: 'indicative',
    newPrice: 11.0,
    baseReuseRatio: 0.4,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 0.1,
    recoveryPremium: 1.2,
    storage: 'covered_only',
    arealDensityKgM2: null,
    unitMassKg: 9.3,
    densityKgM3: null,
    countable: true,
  },
  timber_joist: {
    id: 'timber_joist',
    label: 'Timber joist',
    layer: 'Superstructure',
    unit: 'm3',
    unitPlural: 'm3',
    pricingUnitLabel: 'per m3',
    massRule: '500 kg per m3',
    massRuleSource: 'Sample data',
    massRuleStatus: 'placeholder',
    newOrigin: 'national',
    newOriginNote: 'RICS example for nationally manufactured: structural timber',
    factorNew: 0.263,
    factorReuse: 0.02,
    factorBasis: 't',
    factorNewSource: 'Published: ICE database V3, softwood, excluding sequestration',
    factorNewStatus: 'published',
    factorReuseSource: 'Placeholder',
    factorReuseStatus: 'placeholder',
    newPrice: 450,
    baseReuseRatio: 0.9,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 5,
    recoveryPremium: 60,
    storage: 'covered_only',
    arealDensityKgM2: null,
    unitMassKg: null,
    densityKgM3: 500,
    countable: false,
  },
}

export const FAMILY_IDS = Object.keys(FAMILIES) as FamilyId[]

export const RAISED_FLOOR_PANEL_M2 = 0.36

/** The public title, built from structured fields only (06 section A2). */
export function titleFor(spec: Spec): string {
  switch (spec.family) {
    case 'steel_section':
      return `${spec.designation}, ${formatLength(spec.lengthM)}`
    case 'curtain_wall':
      return `${spec.system} curtain wall panels, ${trim(spec.panelWidthM)} m by ${trim(spec.panelHeightM)} m`
    case 'precast_cladding':
      return `Precast concrete cladding panels, ${spec.thicknessMm} mm`
    case 'stone_cladding':
      return `${spec.stone} stone cladding, ${spec.thicknessMm} mm`
    case 'clay_brick':
      return `Clay ${spec.brickType} bricks, ${spec.mortar}`
    case 'raised_floor':
      return `Raised access floor panels, ${spec.panelSize}`
    case 'timber_joist':
      return `Timber joists, ${spec.species}`
  }
}

function trim(n: number): string {
  return String(Number(n.toFixed(3)))
}

/** Lengths as catalogued: 7.5 m, 9.0 m, 3.8 m. One decimal. */
export function formatLength(m: number): string {
  return `${m.toFixed(1)} m`
}
