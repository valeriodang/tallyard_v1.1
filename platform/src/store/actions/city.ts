// The City of London module (round 3, BRIEF section 15.7), for the consultant on a project in the City: the carbon
// options appraisal with its independent reviewer, the reuse catalogue and the condition bands of the reuse schedule,
// material passports, and the statement updates at RIBA stages 4 and 6. Every input is checked and trimmed here.
import type { CatalogueEntry, CityRecord, ConditionBand, PassportEntry } from '../../domain/cesTypes'
import { isCityOfLondon } from '../../domain/engines/audit'
import type { ActionResult, Actor, AppData } from '../types'
import { lotByPublicId } from '../lots'
import { mint } from '../ids'
import { clean, fail, isIsoDate, ok } from './common'
import { checkedOption, MAX_OPTIONS, type RetentionOptionInput } from './audits'
import { cesOf, consultantOn, saveCes } from './ces'

export const CITY_ERRORS = {
  notCity: 'The City of London module is for projects in the City.',
  tooMany: `Compare up to ${MAX_OPTIONS} options.`,
  noOption: 'That option could not be found.',
  reviewerName: "Give the reviewer's name.",
  years: 'Give the years of experience as a whole number.',
  reviewerNotReady: "Record the reviewer and their years of experience before the sign-off.",
  noOptions: 'Add at least two options before the sign-off.',
  band: 'Choose a band from 1 to 6.',
  noItem: 'That item is not on the reuse schedule.',
  itemText: 'Name the item.',
  passportText: 'Name the material and the passport reference.',
  noEntry: 'That entry could not be found.',
  date: 'Give a date on or before today.',
} as const

function inCity(state: AppData, projectId: string): boolean {
  const p = state.world.projects[projectId]
  return !!p && isCityOfLondon(p)
}

/** Changes the project's City record, for the consultant on a project in the City. */
function saveCity(state: AppData, actor: Actor, projectId: string, change: (c: CityRecord) => CityRecord | string): ActionResult {
  if (state.world.projects[projectId] && !inCity(state, projectId) && typeof consultantOn(state, actor, projectId) !== 'string') return fail(state, CITY_ERRORS.notCity)
  return saveCes(state, actor, projectId, (r) => {
    const next = change(r.city)
    return typeof next === 'string' ? next : { ...r, city: next }
  })
}

export function saveCityOption(state: AppData, actor: Actor, projectId: string, input: RetentionOptionInput): ActionResult<string> {
  let savedId = ''
  const r = saveCity(state, actor, projectId, (c) => {
    const existing = input.id ? c.options.find((o) => o.id === input.id) : undefined
    if (input.id && !existing) return CITY_ERRORS.noOption
    if (!existing && c.options.length >= MAX_OPTIONS) return CITY_ERRORS.tooMany
    const taken = new Set(c.options.map((o) => o.id))
    let n = c.options.length + 1
    while (taken.has(`opt${n}`)) n += 1
    const option = checkedOption(input, existing?.id ?? `opt${n}`)
    if (typeof option === 'string') return option
    savedId = option.id
    return { ...c, options: existing ? c.options.map((o) => (o.id === option.id ? option : o)) : [...c.options, option] }
  })
  return r.error ? fail(state, r.error) : ok(r.state, savedId)
}

export function removeCityOption(state: AppData, actor: Actor, projectId: string, optionId: string): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    if (!c.options.some((o) => o.id === optionId)) return CITY_ERRORS.noOption
    return { ...c, options: c.options.filter((o) => o.id !== optionId), preferredId: c.preferredId === optionId ? null : c.preferredId }
  })
}

export function setCityPreferred(state: AppData, actor: Actor, projectId: string, optionId: string | null): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    if (optionId !== null && !c.options.some((o) => o.id === optionId)) return CITY_ERRORS.noOption
    return { ...c, preferredId: optionId }
  })
}

export function saveCityJustification(state: AppData, actor: Actor, projectId: string, text: string): ActionResult {
  return saveCity(state, actor, projectId, (c) => ({ ...c, justification: clean(text, 4000) }))
}

/** The independent reviewer of the options. A change to who reviews clears an earlier sign-off. */
export function saveReviewer(state: AppData, actor: Actor, projectId: string, input: { name: string; organisation: string; years: number | null }): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    const name = clean(input.name, 120)
    if (!name) return CITY_ERRORS.reviewerName
    if (input.years !== null && (!Number.isInteger(input.years) || input.years < 0 || input.years > 60)) return CITY_ERRORS.years
    const organisation = clean(input.organisation, 120)
    const same = name === c.reviewer.name && organisation === c.reviewer.organisation
    return { ...c, reviewer: { name, organisation, years: input.years, signedOffOn: same ? c.reviewer.signedOffOn : null } }
  })
}

/** Records that the reviewer signed the options off today, or clears it. */
export function signOffReview(state: AppData, actor: Actor, projectId: string, signed: boolean): ActionResult {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  return saveCity(state, actor, projectId, (c) => {
    if (!signed) return { ...c, reviewer: { ...c.reviewer, signedOffOn: null } }
    if (!c.reviewer.name || c.reviewer.years === null) return CITY_ERRORS.reviewerNotReady
    if (c.options.length < 2) return CITY_ERRORS.noOptions
    return { ...c, reviewer: { ...c.reviewer, signedOffOn: a.today } }
  })
}

function isBand(b: unknown): b is ConditionBand {
  return typeof b === 'number' && Number.isInteger(b) && b >= 1 && b <= 6
}

export function addCatalogueEntry(state: AppData, actor: Actor, projectId: string, input: { item: string; quantity: string; band: ConditionBand | null }): ActionResult<string> {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const item = clean(input.item, 200)
  if (!item) return fail(state, CITY_ERRORS.itemText)
  if (input.band !== null && !isBand(input.band)) return fail(state, CITY_ERRORS.band)
  const id = mint(state, 'cat', (x) => cesOf(state, projectId).city.catalogue.some((e) => e.id === x))
  const entry: CatalogueEntry = { id: id.id, item, quantity: clean(input.quantity, 80), band: input.band }
  const r = saveCity(id.state, actor, projectId, (c) => ({ ...c, catalogue: [...c.catalogue, entry] }))
  return r.error ? fail(state, r.error) : ok(r.state, id.id)
}

export function setCatalogueBand(state: AppData, actor: Actor, projectId: string, entryId: string, band: ConditionBand | null): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    if (band !== null && !isBand(band)) return CITY_ERRORS.band
    if (!c.catalogue.some((e) => e.id === entryId)) return CITY_ERRORS.noEntry
    return { ...c, catalogue: c.catalogue.map((e) => (e.id === entryId ? { ...e, band } : e)) }
  })
}

/** The condition band of a reclaimed item on the reuse schedule, by its public ID; null clears it. */
export function setScheduleBand(state: AppData, actor: Actor, projectId: string, publicId: string, band: ConditionBand | null): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    if (band !== null && !isBand(band)) return CITY_ERRORS.band
    if (!lotByPublicId(state.world, publicId)) return CITY_ERRORS.noItem
    const scheduleBands = { ...c.scheduleBands }
    if (band === null) delete scheduleBands[publicId]
    else scheduleBands[publicId] = band
    return { ...c, scheduleBands }
  })
}

export function addPassport(state: AppData, actor: Actor, projectId: string, material: string, reference: string): ActionResult<string> {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  const m = clean(material, 120)
  const ref = clean(reference, 120)
  if (!m || !ref) return fail(state, CITY_ERRORS.passportText)
  const id = mint(state, 'pas', (x) => cesOf(state, projectId).city.passports.some((e) => e.id === x))
  const entry: PassportEntry = { id: id.id, material: m, reference: ref }
  const r = saveCity(id.state, actor, projectId, (c) => ({ ...c, passports: [...c.passports, entry] }))
  return r.error ? fail(state, r.error) : ok(r.state, id.id)
}

export function removeCityEntry(state: AppData, actor: Actor, projectId: string, kind: 'catalogue' | 'passports', entryId: string): ActionResult {
  return saveCity(state, actor, projectId, (c) => {
    if (!c[kind].some((e) => e.id === entryId)) return CITY_ERRORS.noEntry
    return { ...c, [kind]: c[kind].filter((e) => e.id !== entryId) }
  })
}

/** The date the statement was updated at RIBA stage 4 or 6, or null to clear it. */
export function markCityUpdate(state: AppData, actor: Actor, projectId: string, stage: 4 | 6, date: string | null): ActionResult {
  const a = consultantOn(state, actor, projectId)
  if (typeof a === 'string') return fail(state, a)
  if (date !== null && (!isIsoDate(date) || date > a.today)) return fail(state, CITY_ERRORS.date)
  return saveCity(state, actor, projectId, (c) => ({ ...c, updates: { ...c.updates, [stage === 4 ? 'stage4' : 'stage6']: date } }))
}
