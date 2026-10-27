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
  natural_slate: {
    id: 'natural_slate',
    label: 'Natural roofing slate',
    layer: 'Shell/Skin',
    unit: 'slate',
    unitPlural: 'slates',
    pricingUnitLabel: 'per slate',
    massRule: '2.1 kg each',
    massRuleSource: 'Sample data: a 500 by 250 mm slate about 6 mm thick at 2,800 kg per m3',
    massRuleStatus: 'placeholder',
    newOrigin: 'european',
    newOriginNote: 'most new slate sold in the UK is imported from Europe',
    factorNew: 0.08,
    factorReuse: 0.005,
    factorBasis: 't',
    factorNewSource: 'Placeholder: the ICE V3 stone factor until a slate declaration is added',
    factorNewStatus: 'placeholder',
    factorReuseSource: 'Placeholder: stripping, sorting and holing only',
    factorReuseStatus: 'placeholder',
    newPrice: 3.0,
    baseReuseRatio: 0.4,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 0.05,
    recoveryPremium: 0.3,
    storage: 'open_or_covered',
    arealDensityKgM2: null,
    unitMassKg: 2.1,
    densityKgM3: null,
    countable: true,
  },
  stone_paving: {
    id: 'stone_paving',
    label: 'Stone paving slab',
    layer: 'Site',
    unit: 'm2',
    unitPlural: 'm2',
    pricingUnitLabel: 'per m2',
    massRule: '130 kg per m2',
    massRuleSource: 'Sample data: 50 mm at 2,600 kg per m3 (the reuse toolkit gives 2 to 15 cm for reclaimed slabs)',
    massRuleStatus: 'placeholder',
    newOrigin: 'global',
    newOriginNote: 'RICS example for globally manufactured: specialist stone; much new paving is imported',
    factorNew: 0.08,
    factorReuse: 0.01,
    factorBasis: 't',
    factorNewSource: 'Published: ICE V3 stone, as tabled in a London pre-demolition audit',
    factorNewStatus: 'published',
    factorReuseSource: 'Placeholder: lifting, cleaning and re-bedding preparation',
    factorReuseStatus: 'placeholder',
    newPrice: 60,
    baseReuseRatio: 0.5,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 1,
    recoveryPremium: 12,
    storage: 'open_or_covered',
    arealDensityKgM2: 130,
    unitMassKg: null,
    densityKgM3: null,
    countable: false,
  },
  carpet_tile: {
    id: 'carpet_tile',
    label: 'Carpet tile',
    layer: 'Space',
    unit: 'tile',
    unitPlural: 'tiles',
    pricingUnitLabel: 'per tile',
    massRule: '1.06 kg and 0.25 m2 each',
    massRuleSource: 'Indicative: the reuse toolkit gives 3.5 to 5 kg per m2; 4.25 kg per m2 on a 500 by 500 mm tile',
    massRuleStatus: 'indicative',
    newOrigin: 'regional',
    newOriginNote: 'RICS example for regionally manufactured: carpet',
    factorNew: 13.0,
    factorReuse: 0.2,
    factorBasis: 't',
    factorNewSource: 'Indicative: ICE V3 carpet tiles, as tabled in a London pre-demolition audit; product declarations are often lower',
    factorNewStatus: 'indicative',
    factorReuseSource: 'Placeholder: lifting, sorting and cleaning',
    factorReuseStatus: 'placeholder',
    newPrice: 5.5,
    baseReuseRatio: 0.3,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 0.05,
    recoveryPremium: 0.6,
    storage: 'covered_only',
    arealDensityKgM2: null,
    unitMassKg: 1.06,
    densityKgM3: null,
    countable: true,
  },
  metal_ceiling_tile: {
    id: 'metal_ceiling_tile',
    label: 'Metal ceiling tile',
    layer: 'Space',
    unit: 'tile',
    unitPlural: 'tiles',
    pricingUnitLabel: 'per tile',
    massRule: '1.7 kg and 0.36 m2 each',
    massRuleSource: 'Sample data: a 600 by 600 mm perforated steel tile with its acoustic pad',
    massRuleStatus: 'placeholder',
    newOrigin: 'national',
    newOriginNote: 'UK made or assembled ceiling systems',
    factorNew: 1.55,
    factorReuse: 0.05,
    factorBasis: 't',
    factorNewSource: 'Placeholder: the ICE V3 steel factor until a ceiling tile declaration is added',
    factorNewStatus: 'placeholder',
    factorReuseSource: 'Placeholder: cleaning and a new acoustic pad where needed',
    factorReuseStatus: 'placeholder',
    newPrice: 12,
    baseReuseRatio: 0.4,
    scrapValue: 0.2,
    capRatio: 0.95,
    tick: 0.1,
    recoveryPremium: 1.0,
    storage: 'covered_only',
    arealDensityKgM2: null,
    unitMassKg: 1.7,
    densityKgM3: null,
    countable: true,
  },
  glulam_beam: {
    id: 'glulam_beam',
    label: 'Glulam beam',
    layer: 'Superstructure',
    unit: 'm3',
    unitPlural: 'm3',
    pricingUnitLabel: 'per m3',
    massRule: '450 kg per m3',
    massRuleSource: 'Sample data: GL24h glulam',
    massRuleStatus: 'placeholder',
    newOrigin: 'european',
    newOriginNote: 'RICS example for European manufactured: engineered timber such as cross-laminated timber',
    factorNew: 0.3,
    factorReuse: 0.02,
    factorBasis: 't',
    factorNewSource: 'Placeholder: the ICE V3 softwood factor, excluding sequestration, until a glulam declaration is added',
    factorNewStatus: 'placeholder',
    factorReuseSource: 'Placeholder: planing, a delamination test and regrading',
    factorReuseStatus: 'placeholder',
    newPrice: 900,
    baseReuseRatio: 0.35,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 5,
    recoveryPremium: 80,
    storage: 'covered_only',
    arealDensityKgM2: null,
    unitMassKg: null,
    densityKgM3: 450,
    countable: false,
  },
  hollowcore_plank: {
    id: 'hollowcore_plank',
    label: 'Precast hollowcore plank',
    layer: 'Superstructure',
    unit: 'm2',
    unitPlural: 'm2',
    pricingUnitLabel: 'per m2',
    massRule: '280 kg per m2',
    massRuleSource: 'Sample data: a 200 mm plank',
    massRuleStatus: 'placeholder',
    newOrigin: 'national',
    newOriginNote: 'RICS example for nationally manufactured: precast concrete',
    factorNew: 0.178,
    factorReuse: 0.025,
    factorBasis: 't',
    factorNewSource: 'Published: ICE database V3, precast concrete, unreinforced (the precast cladding factor)',
    factorNewStatus: 'published',
    factorReuseSource: 'Placeholder: cutting and testing, at 14% of the new factor, the middle of the 12 to 16% that cutting added in a Danish precast reuse study',
    factorReuseStatus: 'placeholder',
    newPrice: 75,
    baseReuseRatio: 0.3,
    scrapValue: 0,
    capRatio: 0.95,
    tick: 1,
    recoveryPremium: 25,
    storage: 'open_or_covered',
    arealDensityKgM2: 280,
    unitMassKg: null,
    densityKgM3: null,
    countable: false,
  },
}

export const FAMILY_IDS = Object.keys(FAMILIES) as FamilyId[]

export const RAISED_FLOOR_PANEL_M2 = 0.36
/** Plan area of one tile, for the tile families counted in pieces. */
export const TILE_M2: Partial<Record<FamilyId, number>> = { raised_floor: RAISED_FLOOR_PANEL_M2, carpet_tile: 0.25, metal_ceiling_tile: 0.36 }

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
    case 'natural_slate':
      return `${spec.origin} roofing slates, ${spec.sizeMm} mm`
    case 'stone_paving':
      return `${spec.stone} stone paving, ${spec.thicknessMm} mm`
    case 'carpet_tile':
      return `Carpet tiles, ${spec.sizeMm} mm, ${spec.backing}`
    case 'metal_ceiling_tile':
      return `Metal ceiling tiles, ${spec.sizeMm} mm, ${spec.finish}`
    case 'glulam_beam':
      return `Glulam beams, ${spec.strengthClass}, ${spec.sectionMm} mm`
    case 'hollowcore_plank':
      return `Precast hollowcore planks, ${spec.depthMm} mm deep`
  }
}

function trim(n: number): string {
  return String(Number(n.toFixed(3)))
}

/** Lengths as catalogued: 7.5 m, 9.0 m, 3.8 m. One decimal. */
export function formatLength(m: number): string {
  return `${m.toFixed(1)} m`
}
