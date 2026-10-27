// The true cost of waste on a deconstruction site (round 3, BRIEF section 15.4). The method is the site waste
// calculator's: quantity times materials, labour and plant, plus the skip or haulage, plus VAT. Demolition arisings
// carry no purchase cost, so for them the cost is handling, haulage, the receiving site's fee and landfill tax.
// The rates are placeholders until the founder supplies real ones, except landfill tax and VAT, which are
// published (landfill tax to confirm against the current year's rates).
import type { Destination } from '../types'
import type { Parameter } from './assumptions'

export const TRUE_COST_SOURCE = 'Zero Waste Scotland site waste calculator and case studies (in the reference folder)'

/** Labour and plant to sort, load and handle a tonne on site, £. Placeholder. */
export const HANDLING_PER_T = 45

/** Haulage to the receiving site, £ per tonne. Placeholder; reuse on site travels nowhere. */
export const HAULAGE_PER_T: Record<Destination, number> = {
  reused_on_site: 0,
  reused_off_site: 12,
  recycled_on_site: 0,
  recycled_off_site: 12,
  recovered: 15,
  landfill: 15,
  hazardous_disposal: 40,
}

/** What the receiving site charges, £ per tonne. Placeholders; reuse off site is taken at no fee. */
export const GATE_FEE_PER_T: Record<Destination, number> = {
  reused_on_site: 0,
  reused_off_site: 0,
  recycled_on_site: 0,
  recycled_off_site: 20,
  recovered: 95,
  landfill: 30,
  hazardous_disposal: 250,
}

/** Landfill tax, £ per tonne, from 1 April 2025. Inert waste pays the lower rate. */
export const LANDFILL_TAX = { standard: 126.15, lower: 4.05, from: '2025-04-01' } as const

/** Waste codes taxed at the lower rate: inert concrete, bricks, mixed inert and soil and stones. */
export const LOWER_RATE_CODES = ['17 01 01', '17 01 02', '17 01 07', '17 05 04']

export const VAT_RATE = 0.2

/** True cost against skip hire alone, per m3 of skipped waste excluding VAT, from two published site studies. */
export const TRUE_COST_CASES = [
  { id: 'glasgow_housing', label: 'A Glasgow housing site', trueCostPerM3: 389, skipOnlyPerM3: 10 },
  { id: 'edinburgh_refurbishment', label: 'An Edinburgh refurbishment', trueCostPerM3: 472, skipOnlyPerM3: 35 },
]

export function wasteCostRows(): Parameter[] {
  const g = 'True cost of waste'
  const placeholder = "Placeholder: no rate in the reference folder; to be replaced with the founder's figures"
  return [
    { id: 'wastecost.method', group: g, label: 'Method', value: "Tonnes times handling, haulage and the receiving site's fee, plus landfill tax, plus VAT. Demolition arisings carry no purchase cost", unit: '', source: TRUE_COST_SOURCE, status: 'published' },
    { id: 'wastecost.handling', group: g, label: 'Handling, labour and plant', value: String(HANDLING_PER_T), unit: '£ per t', source: placeholder, status: 'placeholder' },
    { id: 'wastecost.haulage', group: g, label: 'Haulage, off site', value: `${HAULAGE_PER_T.reused_off_site} reuse and recycling, ${HAULAGE_PER_T.landfill} recovery and landfill, ${HAULAGE_PER_T.hazardous_disposal} hazardous`, unit: '£ per t', source: placeholder, status: 'placeholder' },
    { id: 'wastecost.gate', group: g, label: 'Receiving site fee', value: `${GATE_FEE_PER_T.recycled_off_site} recycling, ${GATE_FEE_PER_T.recovered} energy recovery, ${GATE_FEE_PER_T.landfill} landfill, ${GATE_FEE_PER_T.hazardous_disposal} hazardous`, unit: '£ per t', source: placeholder, status: 'placeholder' },
    { id: 'wastecost.tax', group: g, label: 'Landfill tax', value: `${LANDFILL_TAX.standard} standard, ${LANDFILL_TAX.lower} lower rate for inert waste`, unit: '£ per t', source: 'Indicative: HM Revenue and Customs rates from 1 April 2025, to confirm against the current year', status: 'indicative' },
    { id: 'wastecost.vat', group: g, label: 'VAT', value: '20%', unit: '', source: 'Published: the UK standard rate', status: 'published' },
    { id: 'wastecost.duty', group: g, label: 'Duty of care papers on each stream of waste', value: 'An upper tier carrier with a registration in date, a receiving site with its permit or exemption, and a transfer note (a consignment note for hazardous waste). Reused material is not waste', unit: '', source: 'Indicative: English waste law is not in the reference folder; to confirm against the current regulations', status: 'indicative' },
    { id: 'wastecost.cases', group: g, label: 'True cost against skip hire', value: TRUE_COST_CASES.map((c) => `${c.label}: £${c.trueCostPerM3} against £${c.skipOnlyPerM3} per m3`).join('; '), unit: 'excluding VAT', source: TRUE_COST_SOURCE, status: 'published' },
  ]
}
