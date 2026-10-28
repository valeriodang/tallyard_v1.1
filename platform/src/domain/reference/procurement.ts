// Specification v2 and the client's procurement pack (round 3, BRIEF section 15.7). Sources: the Interreg reuse
// toolkit's procurement strategies (FCRBE, 2022; literature review note 04, D52), whose model clauses are adapted
// here and need UK legal review, and two London architectural specifications with reclaimed clauses (note 08,
// D58 and D59), whose selection pattern and supply route are followed.
import type { FamilyId } from '../types'
import type { Ambition, AwardCriterion, AwardTemplateId, ResponsibilityTask, SupplyRoute } from '../procurementTypes'
import type { Parameter } from './assumptions'

export const FCRBE_PROCUREMENT_SOURCE = 'Interreg reuse toolkit (FCRBE), procurement strategies and model clauses (2022)'
export const LONDON_SPEC_SOURCE = 'Two London architectural specifications with reclaimed clauses (2026)'
export const LEGAL_CAVEAT = 'Adapted from the FCRBE model clauses, written for Belgian and French public procurement. Have them reviewed for UK law and your contract form before use.'

export const SUPPLY_ROUTE_ORDER: SupplyRoute[] = ['free_issue', 'contractor_sourced', 'dealer', 'reuse_lot']

export type SupplyRouteInfo = { label: string; text: string; when: string; duties: Record<ResponsibilityTask, string> }

export const SUPPLY_ROUTES: Record<SupplyRoute, SupplyRouteInfo> = {
  free_issue: {
    label: 'Free issue by the client',
    text: 'The client buys and holds the reclaimed items and issues them to the contractor to install.',
    when: 'The client owns the donor building, or reserves material before the tender. Specify the items themselves.',
    duties: { buys: 'Client', stores: 'Client, or its stockholder', prepares: "Client's supplier", tests: 'Client, before the tender', insures: 'Client owns the items', liable: 'Contractor for installation only' },
  },
  contractor_sourced: {
    label: 'Sourced by the contractor',
    text: 'The contractor finds, buys, prepares and installs reclaimed items to a performance specification.',
    when: 'The items are not yet known. Specify performance with thresholds, and a new fallback.',
    duties: { buys: 'Contractor', stores: 'Contractor', prepares: 'Contractor or a dealer', tests: 'Contractor, from a provisional sum', insures: 'Contractor', liable: 'Contractor' },
  },
  dealer: {
    label: 'Through a dealer or stockholder',
    text: 'A dealer cleans, sorts, documents, stores and delivers the items; the contractor installs them.',
    when: 'Steel and other families with a stockholder trade. The dealer carries product liability insurance.',
    duties: { buys: 'Contractor, from the dealer', stores: 'Dealer', prepares: 'Dealer', tests: 'Dealer, through an accredited laboratory', insures: "Dealer's product liability", liable: 'Dealer for the product, contractor for installation' },
  },
  reuse_lot: {
    label: 'A reuse lot in the tender',
    text: 'A separate lot finds, collects, prepares, stores, guards and documents reclaimed items for the other trades.',
    when: 'Larger schemes with many reclaimed items. At one French scheme the reuse lot was 3% of the budget.',
    duties: { buys: 'Reuse lot contractor', stores: 'Reuse lot contractor', prepares: 'Reuse lot contractor', tests: 'Reuse lot contractor, from a provisional sum', insures: 'Reuse lot contractor', liable: 'Reuse lot for supply, the installing trade for installation' },
  },
}

export const RESPONSIBILITY_TASKS: { id: ResponsibilityTask; label: string }[] = [
  { id: 'buys', label: 'Who buys' },
  { id: 'stores', label: 'Who stores' },
  { id: 'prepares', label: 'Who prepares' },
  { id: 'tests', label: 'Who tests' },
  { id: 'insures', label: 'Who insures' },
  { id: 'liable', label: 'Who is liable' },
]

/** The selection pattern every reclaimed clause in the London specification follows. */
export const SELECTION_STEPS: string[] = [
  'Examine for damage or deterioration and confirm the items suit the intended use and service conditions.',
  'Present the items to the architect for selection by size, shape, condition, colour and appearance.',
  'Clean and prepare.',
  'Reduce or cut to size where the clause allows.',
  'Dry lay before fixing.',
  'Submit samples showing the visual range.',
  'Agree the first installation as the benchmark for the rest.',
  "Make the items available for the contractor's review of condition and weight, to write method statements.",
  'Leave joints open to allow demounting at the end of life.',
]

export type ClauseStage = 'tender' | 'contract' | 'dismantling'

export type LibraryClause = { id: string; title: string; stage: ClauseStage; text: string; routes: SupplyRoute[] | 'all' }

/** Placeholders: {reviewCap} and {provisional} are filled from the pack. */
export const CLAUSE_LIBRARY: LibraryClause[] = [
  {
    id: 'objective',
    title: 'Reuse objective',
    stage: 'tender',
    routes: 'all',
    text: 'The project aims to reuse {target} of its building materials {unit}. Tenderers describe how their method meets it, and report against it at each stage.',
  },
  {
    id: 'free_issue',
    title: 'Free issue by the client',
    stage: 'contract',
    routes: ['free_issue'],
    text: 'The client supplies the reclaimed items listed in the specification free of charge. The contractor collects, protects and installs them, and is liable for the installation only.',
  },
  {
    id: 'review',
    title: 'Review clause where reused supplies cannot be found',
    stage: 'contract',
    routes: ['contractor_sourced', 'reuse_lot'],
    text: "If reclaimed supplies cannot be obtained within the client's estimated price range, the contractor proves it with several quotes and the reuse adviser's view. The client then chooses new supplies at an agreed price, or the reclaimed supplies available. The clause applies to no more than {reviewCap} of the contract value.",
  },
  {
    id: 'offsite',
    title: 'Off-site acquisition, an obligation of means',
    stage: 'contract',
    routes: ['contractor_sourced', 'dealer', 'reuse_lot'],
    text: 'The contractor makes every reasonable effort to source the reclaimed items specified, and justifies in writing, with the searches made, any switch to new.',
  },
  {
    id: 'insurance',
    title: 'Insurance',
    stage: 'tender',
    routes: 'all',
    text: "The contractor obtains its insurer's conditions for installing reclaimed items before contract, and states any extra premium in its tender.",
  },
  {
    id: 'identity',
    title: 'Identity sheet for each batch',
    stage: 'contract',
    routes: 'all',
    text: 'Each batch of reclaimed items comes with an identity sheet: origin, quantity counted after dismantling, condition, tests and storage. Only the quantity actually reclaimed counts towards the objective.',
  },
  {
    id: 'origin',
    title: 'Proof of origin',
    stage: 'contract',
    routes: 'all',
    text: 'The contractor proves the origin of each reclaimed item with an invoice, a storage sheet or a proof of direct supply, or at the least a signed statement.',
  },
  {
    id: 'provisional',
    title: 'Provisional sum for tests and losses',
    stage: 'tender',
    routes: 'all',
    text: "A provisional sum of {provisional} of the reclaimed supply covers tests and losses, spent only against the reuse adviser's instruction.",
  },
  {
    id: 'reuse_lead',
    title: 'A reuse lead on site and a reuse note at each stage',
    stage: 'contract',
    routes: 'all',
    text: 'The contractor names a reuse lead on site and submits a reuse note at each stage: what was sourced, installed and lost, and why.',
  },
  {
    id: 'dismantling',
    title: 'Careful dismantling',
    stage: 'dismantling',
    routes: 'all',
    text: 'The dismantling contractor removes the items listed with care, as an obligation of means, packs and stores them as the specification says, and is paid only for the quantity actually recovered.',
  },
  {
    id: 'trial',
    title: 'Dismantling trial',
    stage: 'dismantling',
    routes: 'all',
    text: 'Before dismantling at scale, the contractor dismantles a sample to set the method and the loss rate with the client.',
  },
  {
    id: 'surplus',
    title: 'Surplus for repairs',
    stage: 'contract',
    routes: 'all',
    text: 'The contractor sets aside a surplus of each reclaimed batch, at the share the specification gives, for repairs and replacements in use.',
  },
]

/** Clauses included by default for a route: the objective and the ones written for that route. */
export function defaultClauseIds(route: SupplyRoute): string[] {
  return CLAUSE_LIBRARY.filter((c) => c.routes === 'all' || c.routes.includes(route)).map((c) => c.id)
}

/** The review clause is allowed below this share of contract value (FCRBE factsheet 10). */
export const REVIEW_CLAUSE_CAP = 0.15

/** Placeholder: the toolkit says to keep a sum for tests and losses, with no rate. */
export const PROVISIONAL_SHARE = 0.1

export const AMBITIONS: Record<Ambition, { label: string; text: string; share: number }> = {
  baseline: { label: 'Baseline', text: 'The average reuse rate in North-West Europe, about 1%.', share: 0.01 },
  ambitious: { label: 'Ambitious', text: 'The toolkit gives 5% of value as a workable target.', share: 0.05 },
  pioneering: { label: 'Pioneering', text: 'Conventional buildings in the toolkit sample reached up to 10% by mass.', share: 0.1 },
}

export const AWARD_TEMPLATES: Record<Exclude<AwardTemplateId, 'custom'>, { label: string; text: string; criteria: AwardCriterion[] }> = {
  urban_works: {
    label: 'Works, technical led',
    text: 'Price 40%, technical 60%, of which 10% for the reuse approach: 5 for storage and 5 for supply.',
    criteria: [
      { id: 'price', label: 'Price', weight: 40, reuse: false },
      { id: 'technical', label: 'Technical merit', weight: 50, reuse: false },
      { id: 'reuse_storage', label: 'Reuse: storage method', weight: 5, reuse: true },
      { id: 'reuse_supply', label: 'Reuse: supply method', weight: 5, reuse: true },
    ],
  },
  renovation: {
    label: 'Renovation, price led',
    text: 'Price 80%, method 20%, the method including the storage of reuse supplies.',
    criteria: [
      { id: 'price', label: 'Price', weight: 80, reuse: false },
      { id: 'method', label: 'Method', weight: 12, reuse: false },
      { id: 'reuse_storage', label: 'Reuse: storage of reuse supplies', weight: 8, reuse: true },
    ],
  },
  design: {
    label: 'Design appointment',
    text: 'Sustainability 25%, including exemplary materials management.',
    criteria: [
      { id: 'quality', label: 'Design quality and team', weight: 45, reuse: false },
      { id: 'price', label: 'Fee', weight: 30, reuse: false },
      { id: 'sustainability', label: 'Sustainability, including materials management', weight: 25, reuse: true },
    ],
  },
}

export const ROUTE_LABELS: Record<SupplyRoute, string> = Object.fromEntries(SUPPLY_ROUTE_ORDER.map((r) => [r, SUPPLY_ROUTES[r].label])) as Record<SupplyRoute, string>

/** Ranges, tolerances, accepted patina and the operations on a known batch, per family (FCRBE factsheet 12). */
export const SPEC_DEFAULTS: Record<FamilyId, { tolerances: string; patina: string; operations: string }> = {
  steel_section: {
    tolerances: 'Section as listed or heavier. Lengths may be cut down; existing holes and stiffeners accepted where the engineer agrees.',
    patina: 'Mill scale and surface rust removed; existing paint stripped where coating systems differ.',
    operations: 'Shot blast, repair holes the engineer rejects, fabricate to the drawings and prime.',
  },
  curtain_wall: {
    tolerances: 'Unit sizes within 5 mm of the drawings; frames may be refinished.',
    patina: 'Light marks on frames accepted; glazing clear of scratches in the field of view.',
    operations: 'Renew seals and gaskets, test for air and water tightness, replace failed glazing units.',
  },
  precast_cladding: {
    tolerances: 'Panel sizes as listed; cast-in fixings checked and replaced where needed.',
    patina: 'Weathering and colour variation between panels accepted.',
    operations: 'Clean, repair arrises, check fixings and reseal joints.',
  },
  stone_cladding: {
    tolerances: 'Thickness within 3 mm of nominal after re-sawing; sizes may be cut down.',
    patina: 'Natural weathering and shade variation accepted; stains removed where they can be.',
    operations: 'Clean, re-saw or cut to size, and dry lay to agree the range before fixing.',
  },
  clay_brick: {
    tolerances: 'Size within the work sizes of the original; chipped arrises accepted to a sample.',
    patina: 'Shade and texture variation accepted; old mortar removed from bed faces.',
    operations: 'Clean off mortar, sort by colour and size, and lay to a sample panel.',
  },
  raised_floor: {
    tolerances: 'Panels 600 x 600 mm, square within 0.5 mm, at the load class specified.',
    patina: 'Edge bands renewed where damaged; finishes may be replaced.',
    operations: 'Inspect, test to the load class, renew edge bands and seal cut ends.',
  },
  timber_joist: {
    tolerances: 'Section within 3 mm of nominal; lengths may be cut down; strength graded.',
    patina: 'Old fixing holes and surface marks accepted where the grade allows.',
    operations: 'De-nail, regrade, treat where specified and cut to length.',
  },
  natural_slate: {
    tolerances: 'Sizes as listed, sorted by thickness; holes may be re-punched.',
    patina: 'Weathered faces accepted; delaminated slates rejected.',
    operations: 'Sort by size and thickness, re-hole and lay to a sample area.',
  },
  stone_paving: {
    tolerances: 'Thickness within 5 mm after cleaning; sizes may be cut down.',
    patina: 'Wear and shade variation accepted; oil stains removed where they can be.',
    operations: 'Stack on pallets, clean with mild detergent and lay to a sample area.',
  },
  carpet_tile: {
    tolerances: 'Tiles 500 x 500 mm, backing intact, pile height within the range of the batch.',
    patina: 'Shade variation managed by laying batches in separate areas.',
    operations: 'Deep clean, sort by batch and lay to the pattern agreed.',
  },
  metal_ceiling_tile: {
    tolerances: 'Tiles to fit the grid specified; edges straight.',
    patina: 'Minor marks accepted; tiles may be repainted.',
    operations: 'Clean, repaint where specified and fit to the grid.',
  },
  glulam_beam: {
    tolerances: 'Section within 3 mm of nominal; lengths may be cut down; glue lines sound.',
    patina: 'Old fixing holes and surface marks accepted where the engineer agrees.',
    operations: 'Inspect glue lines, regrade, plane where specified and cut to length.',
  },
  hollowcore_plank: {
    tolerances: 'Plank width and depth as listed; lengths may be cut down within the span tables.',
    patina: 'Soffit marks accepted where the soffit is covered.',
    operations: 'Saw to length, check strand ends and grout as the engineer specifies.',
  },
}

export function procurementRows(): Parameter[] {
  const g = 'Specification and procurement'
  return [
    { id: 'proc.routes', group: g, label: 'Supply routes', value: SUPPLY_ROUTE_ORDER.map((r) => SUPPLY_ROUTES[r].label).join(', '), unit: '', source: `Published: ${FCRBE_PROCUREMENT_SOURCE}, factsheets 3, 4 and 12; free issue from ${LONDON_SPEC_SOURCE}`, status: 'published' },
    { id: 'proc.review', group: g, label: 'Review clause allowed below', value: String(REVIEW_CLAUSE_CAP * 100), unit: '% of contract value', source: `Published: ${FCRBE_PROCUREMENT_SOURCE}, factsheet 10`, status: 'published' },
    { id: 'proc.provisional', group: g, label: 'Provisional sum for tests and losses', value: String(PROVISIONAL_SHARE * 100), unit: '% of the reclaimed supply', source: 'Placeholder: the toolkit says to keep a sum to be justified, with no rate', status: 'placeholder' },
    { id: 'proc.ambition', group: g, label: 'Reuse objective levels', value: '1%, 5% by value, up to 10% by mass', unit: '', source: `Indicative: ${FCRBE_PROCUREMENT_SOURCE}, factsheet 5, and the ex-post analysis of 32 projects`, status: 'indicative' },
    { id: 'proc.award', group: g, label: 'Award weightings', value: 'Works 40/60 with 10 for reuse; renovation 80/20; design 25 for sustainability', unit: '', source: `Published: ${FCRBE_PROCUREMENT_SOURCE}, factsheet 15. The split of the remaining weights is a placeholder`, status: 'published' },
    { id: 'proc.selection', group: g, label: 'Selection pattern for reclaimed clauses', value: `${SELECTION_STEPS.length} steps`, unit: '', source: `Published: ${LONDON_SPEC_SOURCE}`, status: 'published' },
  ]
}
