// City of London rules that go beyond the London Plan (round 3, BRIEF section 15.3 and 15.7): the Carbon Options
// planning advice note (March 2023, revision 01) and the Planning for Sustainability SPD (February 2025).
import type { Parameter } from './assumptions'

export const CITY_PAN_SOURCE = 'City of London, Carbon Options Guidance planning advice note (March 2023)'
export const CITY_SPD_SOURCE = 'City of London, Planning for Sustainability SPD (February 2025)'

/** A retrofit keeps at least this share of the existing superstructure by mass; less than that counts as new build. */
export const RETROFIT_MIN_SUPERSTRUCTURE_SHARE = 0.5

/** Demolition carbon used when a scheme has no better figure, kgCO2e per m2 of demolished floor area. */
export const DEMOLITION_DEFAULT_KGCO2E_M2 = 50

/** Office whole life carbon benchmarks the SPD cites, kgCO2e per m2 GIA. Residential values are not in the folder. */
export const CITY_OFFICE_BENCHMARKS: { id: string; label: string; modules: string; value: number; kind: 'standard' | 'aspirational' }[] = [
  { id: 'wlc_standard', label: 'Whole life carbon, standard benchmark', modules: 'modules A to C, excluding B6 and B7', value: 1400, kind: 'standard' },
  { id: 'wlc_aspirational', label: 'Whole life carbon, aspirational benchmark', modules: 'modules A to C, excluding B6 and B7', value: 970, kind: 'aspirational' },
  { id: 'upfront_aspirational', label: 'Upfront carbon, aspirational benchmark', modules: 'modules A1 to A5', value: 600, kind: 'aspirational' },
  { id: 'inuse_aspirational', label: 'In-use and end-of-life carbon, aspirational benchmark', modules: 'modules B to C', value: 370, kind: 'aspirational' },
]

/** From 2030 the aspirational whole life carbon benchmark becomes the City's minimum. */
export const CITY_ASPIRATIONAL_MINIMUM_FROM = '2030'

/** Condition bands for reclaimed items (SPD case study): 1 is as new. */
export const CITY_CONDITION_BANDS: { band: 1 | 2 | 3 | 4 | 5 | 6; label: string; route: 'reuse' | 'repurpose' | 'recycle' }[] = [
  { band: 1, label: 'As new', route: 'reuse' },
  { band: 2, label: 'Light wear', route: 'reuse' },
  { band: 3, label: 'Wear, needs minor work', route: 'repurpose' },
  { band: 4, label: 'Needs repair or a new use', route: 'repurpose' },
  { band: 5, label: 'Poor', route: 'recycle' },
  { band: 6, label: 'Not recoverable as a product', route: 'recycle' },
]

/** The SPD's minimums for every major application. */
export const CITY_MINIMUMS = {
  reuseCatalogueItems: 5,
  reuseScheduleItems: 5,
  passportedNewMaterials: 5,
  /** Statements updated by condition at these RIBA stages. */
  updateStages: [4, 6] as const,
}

/** Carbon options optioneering applies to every major scheme, and to smaller ones that demolish most of the structure. */
export const CITY_OPTIONEERING = {
  majorFromM2: 1000,
  majorFromHomes: 10,
  minorDemolitionShareOver: 0.5,
  studyYears: 60,
  interventionEveryYears: 15,
  reviewerMinYears: 3,
  gasFactorKgCO2ePerKWh: 0.21,
}

export function cityRows(): Parameter[] {
  const g = 'City of London'
  const rows: Parameter[] = [
    { id: 'city.retrofit', group: g, label: 'Retrofit test', value: `At least ${RETROFIT_MIN_SUPERSTRUCTURE_SHARE * 100}% of the existing superstructure kept, by mass`, unit: '', source: `Published: ${CITY_SPD_SOURCE}. Keeping the facade alone does not count as a carbon reduction`, status: 'published' },
    { id: 'city.demolition', group: g, label: 'Demolition carbon default', value: String(DEMOLITION_DEFAULT_KGCO2E_M2), unit: 'kgCO2e per m2 demolished', source: `Published: ${CITY_PAN_SOURCE}, the GLA default`, status: 'published' },
    { id: 'city.optioneering', group: g, label: 'Carbon options optioneering', value: `Majors (${CITY_OPTIONEERING.majorFromM2.toLocaleString('en-GB')} m2 or ${CITY_OPTIONEERING.majorFromHomes} homes or more) and schemes demolishing more than half the structure by mass; ${CITY_OPTIONEERING.studyYears}-year study, work every ${CITY_OPTIONEERING.interventionEveryYears} years; independent review`, unit: '', source: `Published: ${CITY_PAN_SOURCE}`, status: 'published' },
    { id: 'city.minimums', group: g, label: 'Circular economy minimums', value: `Reuse catalogue of ${CITY_MINIMUMS.reuseCatalogueItems} key items, reuse schedule of ${CITY_MINIMUMS.reuseScheduleItems}, passports for ${CITY_MINIMUMS.passportedNewMaterials} carbon-intensive new materials; statement updated at RIBA stages 4 and 6`, unit: '', source: `Published: ${CITY_SPD_SOURCE}`, status: 'published' },
    { id: 'city.bands', group: g, label: 'Condition bands', value: 'Bands 1 and 2 reuse, 3 and 4 repurpose, 5 and 6 recycle', unit: '', source: `Published: ${CITY_SPD_SOURCE}, case study. Only band 1, as new, is named there; the other band names are Tallyard's`, status: 'published' },
  ]
  for (const b of CITY_OFFICE_BENCHMARKS) rows.push({ id: `city.bench.${b.id}`, group: g, label: `Office ${b.label.toLowerCase()}`, value: `Below ${b.value.toLocaleString('en-GB')}`, unit: `kgCO2e per m2 GIA, ${b.modules}`, source: `Published: ${CITY_SPD_SOURCE}, citing the GLA benchmarks${b.id === 'wlc_aspirational' ? `; the minimum from ${CITY_ASPIRATIONAL_MINIMUM_FROM}` : ''}`, status: 'published' })
  return rows
}
