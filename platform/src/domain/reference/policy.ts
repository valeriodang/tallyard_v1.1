// Policy references, certification mapping and the stage checklist, in one file.
export const POLICY_BASIS = 'Policy basis: London Plan 2021 and the 2022 guidance. A draft new plan is in consultation.'

export const CONTENT_AIM_NAME = 'the 20% aim in the Circular Economy Statement guidance'

export const BREEAM_VERSION = { scheme: 'BREEAM UK New Construction', current: 'V6.1 numbering', note: 'Version 7 numbering is to confirm against its manual' }

export const CERTIFICATION_ROWS: { workbook: 'compliance' | 'waste'; requirement: string; provides: string }[] = [
  { workbook: 'compliance', requirement: 'Circular Economy Statement guidance (2022): bill of materials with reused and recycled content by value, aim of at least 20%', provides: 'Bill of materials, Summary' },
  { workbook: 'compliance', requirement: 'BREEAM UK New Construction V6.1, Mat 06 Material efficiency', provides: 'Reused items' },
  { workbook: 'compliance', requirement: 'BREEAM UK New Construction V6.1, Mat 01 Building life cycle assessment', provides: 'Embodied carbon: factors for the reclaimed items, as an input to the assessment, which is done elsewhere' },
  { workbook: 'compliance', requirement: 'LEED v5 Materials and Resources: MRc1 materials reuse', provides: 'Reused items' },
  { workbook: 'compliance', requirement: 'LEED v5 Materials and Resources: MRp2 Quantify and Assess Embodied Carbon; MRc2 Reduce Embodied Carbon', provides: 'Embodied carbon, as an input only' },
  { workbook: 'waste', requirement: 'London Plan 2021 Policy SI 7 and the Circular Economy Statement: recycling and waste reporting, at least 95% of construction and demolition waste reused, recycled or recovered', provides: 'Recycling and waste reporting' },
  { workbook: 'waste', requirement: 'Circular Economy Statement guidance: data for the pre-demolition audit and for post-construction reporting. The audit itself is carried out independently.', provides: 'Arisings' },
  { workbook: 'waste', requirement: 'BREEAM UK New Construction V6.1, Wst 01 Construction waste management: diversion of resources from landfill', provides: 'Arisings, Recycling and waste reporting' },
  { workbook: 'waste', requirement: 'LEED v5 Materials and Resources: MRc5 Construction and Demolition Waste Diversion. LEED counts salvage twice and caps unverified mixed recovery, so these figures are an input only.', provides: 'Recycling and waste reporting' },
]

export const STAGE_CHECKLIST = [
  'Pre-application: draft statement with the strategic approach and initial targets',
  'Planning application: written statement and completed template, including the bill of materials, recycling and waste reporting and end-of-life strategy',
  'Post-construction: update with actual figures and supporting evidence',
]

export const RIBA_STAGES = ['Strategic Definition', 'Preparation and Briefing', 'Concept Design', 'Spatial Coordination', 'Technical Design', 'Manufacturing and Construction', 'Handover', 'Use']

export const BUILDING_LAYERS = ['Site', 'Substructure', 'Superstructure', 'Shell/Skin', 'Services', 'Space', 'Stuff', 'Construction stuff']
