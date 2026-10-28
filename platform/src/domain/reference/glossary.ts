// Help, Glossary (round 3, BRIEF section 15.8): the terms of the circular economy as the sources in the folder use
// them. Reuse first, because the sources define it three ways and the difference decides what a figure counts.
import { CITY_PAN_SOURCE, CITY_SPD_SOURCE } from './cityOfLondon'
import { LEED_IDC_SOURCE } from './schemes'

export type GlossaryEntry = { id: string; term: string; text: string; source: string }

const GLA = 'GLA London Plan Guidance, Circular Economy Statements (2022), and its template'
const ADVANCE = 'ADVANCE D2.1, circular economy of steel-based components (2024), glossary'
const TRACKER = 'BREEAM UK New Construction V6.1 trackers in the folder (2026)'
const RICS = 'RICS whole life carbon assessment for the built environment, 2nd edition (2023)'
const LONDON_PLAN = 'London Plan 2021, Policy SI 7'
const FCRBE = 'Interreg reuse toolkit (FCRBE), factsheets 3, 4 and 12'

/** The three ways the sources define reuse, and how LEED splits it. */
export const REUSE_DEFINITIONS: GlossaryEntry[] = [
  { id: 'reuse-gla', term: 'Reuse, in the GLA statement', text: 'An item used again as it is. In the recycling and waste reporting table, crushed concrete and hardcore used as fill are recycling, not reuse.', source: GLA },
  { id: 'reuse-component', term: 'Reuse, of a building component', text: 'Any operation by which building components are used again, for their first function or another, with only minor changes so they keep much the same form. Checking, cleaning and repairing are part of it.', source: ADVANCE },
  { id: 'reuse-in-situ', term: 'Reused in situ', text: 'A material removed from where it was, given no more than minor processing, and put back in a different place in the same building or project.', source: TRACKER },
  { id: 'reuse-leed', term: 'On-site and off-site reuse, in LEED', text: "Materials kept in place, or taken from the owner's own stock, count as on-site reuse under MRc1 option 1; reused materials from elsewhere count under option 2. Salvage sent off site counts twice for waste diversion in MRc5.", source: LEED_IDC_SOURCE },
]

export const GLOSSARY: GlossaryEntry[] = [
  { id: 'arisings', term: 'Arisings', text: 'Everything that comes out of a building during strip-out and demolition, whatever happens to it next.', source: 'Tallyard' },
  { id: 'bau', term: 'Business as usual', text: 'What happens to a material at end of life with no special effort: the default split between reuse, recycling, energy recovery and disposal, by material.', source: `${RICS}, Table 23` },
  { id: 'carbon-options', term: 'Carbon options', text: 'A comparison of options from keeping the building to a new build, each with the share kept, upfront and whole life carbon and demolition, reviewed independently.', source: CITY_PAN_SOURCE },
  { id: 'condition-band', term: 'Condition band', text: 'A grade from 1, as new, to 6, not recoverable as a product. Bands 1 and 2 are reused, 3 and 4 repurposed, 5 and 6 recycled.', source: CITY_SPD_SOURCE },
  { id: 'deconstruction', term: 'Deconstruction', text: 'Taking a building apart selectively so its components can be reused, repurposed or recycled, rather than clearing the site by the quickest means.', source: ADVANCE },
  { id: 'downcycling', term: 'Downcycling and upcycling', text: 'Recycling into something of lower, or higher, value, quality or function than the original, such as crushing concrete for road fill. Both are recycling.', source: ADVANCE },
  { id: 'free-issue', term: 'Free issue', text: 'The client buys the reclaimed material and hands it to the contractor to install. Owning it, the client takes on the material; the contractor is liable only for installing it.', source: FCRBE },
  { id: 'levels', term: 'Level(s) indicator 2.4', text: 'A score from 0 to 1 for where materials go at end of life: 1 for direct reuse, 0.9 for preparing for reuse, down to 0 for hazardous disposal.', source: 'EU Level(s) framework, indicator 2.4' },
  { id: 'passport', term: 'Material passport', text: 'A record that travels with a material: what it is, where it is, how it was made and how it comes apart, so it can be found and used again.', source: CITY_SPD_SOURCE },
  { id: 'module-d', term: 'Module D', text: 'The benefit of reuse and recycling beyond the building, reported separately. It belongs to the building the material leaves, so the building that receives it does not count it again.', source: RICS },
  { id: 'pioneering', term: 'Pioneering target', text: 'A target the scheme aims above the policy minimum. Most statements only copy the minimums.', source: GLA },
  { id: 'pre-demolition', term: 'Pre-demolition audit', text: 'What a building holds and where each part goes, made before it comes down. One that only lists waste routes is not suitable: reclaimed items need a route and a broker.', source: GLA },
  { id: 'pre-redevelopment', term: 'Pre-redevelopment audit', text: 'Whether the existing building, or part of it, can be kept, made before the design is fixed.', source: GLA },
  { id: 'preparing', term: 'Preparing for reuse', text: 'Checking, cleaning or repairing waste so it can be reused without any other processing.', source: ADVANCE },
  { id: 'remanufacturing', term: 'Remanufacturing', text: 'Making a product from used products or components with at least one change to its safety, performance, purpose or type, usually sold with a guarantee.', source: ADVANCE },
  { id: 'repurposing', term: 'Repurposing', text: 'Changing what a component is used for.', source: ADVANCE },
  { id: 'retrofit', term: 'Retrofit, in the City', text: 'An option that keeps at least half the existing superstructure by mass. Keeping the facade alone does not count.', source: CITY_SPD_SOURCE },
  { id: 'rrr', term: 'Reuse, recycling and recovery', text: 'What at least 95% of construction and demolition waste must go to, by weight; excavation waste must go to beneficial use. Neither is the same as diversion from landfill.', source: LONDON_PLAN },
  { id: 'upfront', term: 'Upfront and whole life carbon', text: "Upfront carbon covers modules A1 to A5, up to practical completion. Whole life carbon adds use and end of life, modules B and C; the City's benchmarks leave out operational energy and water, B6 and B7.", source: RICS },
]
