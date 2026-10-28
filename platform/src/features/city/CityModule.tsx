// The City of London module (round 3, BRIEF section 15.7), for the consultant on a project in the City: the carbon
// options with the retrofit test and an independent reviewer, the City's office benchmarks, the SPD's minimums (a
// reuse catalogue, a reuse schedule with condition bands, material passports) and the statement updates at RIBA
// stages 4 and 6.
import { useState } from 'react'
import { useParams } from 'react-router'
import { BookMarked, CalendarCheck, CheckCircle2, CircleDashed, Gauge, IdCard, Landmark, Plus, ScrollText, Trash2, UserCheck } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { CityView } from '../../store/selectors/city'
import type { ConditionBand } from '../../domain/cesTypes'
import { amountFromText } from '../../domain/input'
import { Button, Callout, Card, CardBody, CardHeader, Checkbox, cx, EmptyState, IconButton, IndicativeMarker, Input, Pill, Select, toast } from '../../ui'
import { Page } from '../../app/Page'
import { SavedInput } from '../audits/fields'
import { CarbonOptions, type CarbonOptionsHandlers } from '../audits/CarbonOptions'
import { TabHeader } from '../sustainability/parts'

function report(r: { ok: boolean; error: string | null }) {
  if (!r.ok) toast.error(r.error ?? 'Could not save.')
  return r.ok
}

const band = (x: string): ConditionBand | null => (x === '' ? null : (Number(x) as ConditionBand))

export function CityModule() {
  const { projectId = '' } = useParams()
  const v = useView(selectors.cityView, projectId)
  if (!v) return null
  const handlers: CarbonOptionsHandlers = {
    save: (input) => act.saveCityOption(projectId, input),
    remove: (o) => {
      const r = act.removeCityOption(projectId, o.id)
      if (!report(r)) return
      toast.success(`${o.label} removed`, { action: { label: 'Undo', onClick: r.undo } })
    },
    setPreferred: (id) => void report(act.setCityPreferred(projectId, id)),
    saveJustification: (text) => report(act.saveCityJustification(projectId, text)),
  }
  return (
    <Page className="lg:pt-7" testId="city">
      <div className="flex flex-col gap-6">
        <TabHeader title="City of London" subtitle="What the City asks of a major scheme beyond the London Plan: carbon options with independent review, minimums for reuse and passports, and updates to the statement at RIBA stages 4 and 6." />
        <Minimums v={v} />
        <CarbonOptions v={v.options} editable isCity handlers={handlers} testId="city-options" justificationTestId="city-justification" />
        <Retention v={v} />
        <Reviewer projectId={projectId} v={v} />
        <Catalogue projectId={projectId} v={v} />
        <Schedule projectId={projectId} v={v} />
        <Passports projectId={projectId} v={v} />
        <Updates projectId={projectId} v={v} />
      </div>
    </Page>
  )
}

function Minimums({ v }: { v: CityView }) {
  return (
    <Card data-testid="city-minimums">
      <CardHeader icon={Gauge} title="The City's minimums" description="Every major application meets these, from the Planning for Sustainability SPD (2025)." />
      <CardBody>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {v.minimums.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 text-sm" data-testid={`minimum-${m.id}`} data-met={m.met}>
              <span className="flex items-start gap-2">
                {m.met ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-700" /> : <CircleDashed aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />}
                <span className="text-ink">{m.label}</span>
              </span>
              <Pill size="sm" tone={m.met ? 'brand' : 'warning'}>
                {m.countText}
              </Pill>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Retention({ v }: { v: CityView }) {
  const r = v.retention
  return (
    <Card data-testid="city-retention">
      <CardHeader icon={Landmark} title="Retention and benchmarks" description="What the preferred option keeps, and the City's office benchmarks for whole life carbon." />
      <CardBody className="flex flex-col gap-4">
        <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Preferred option', r.preferredLabel ?? 'Not chosen'],
            ['Superstructure kept, by mass', r.superstructureText],
            ['Facade kept, by area', r.facadeText],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="m-0 font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <p className={cx('m-0 text-sm', r.retrofit === false ? 'font-medium text-warning' : 'text-ink-soft')} data-testid="city-verdict">
          {r.verdictText}
        </p>
        {r.facadeOnly ? (
          <div data-testid="city-facade-only">
            <Callout tone="warning">Keeping the facade alone does not count as a carbon reduction. The City looks for at least half the superstructure kept, by mass.</Callout>
          </div>
        ) : null}
        <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
          <p className="m-0 flex items-center gap-2 text-sm font-medium text-ink-soft">
            Office benchmarks
            <IndicativeMarker />
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {v.benchmarks.map((b) => (
              <li key={b.id} className="text-sm">
                <span className="text-ink">{b.label}</span>
                <span className="block text-muted">{b.limitText}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-muted">{v.benchmarkNote}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function Reviewer({ projectId, v }: { projectId: string; v: CityView }) {
  const r = v.reviewer
  const save = (patch: Partial<{ name: string; organisation: string; years: number | null }>) => report(act.saveReviewer(projectId, { name: r.name, organisation: r.organisation, years: amountFromText(r.years), ...patch }))
  return (
    <Card data-testid="city-reviewer">
      <CardHeader icon={UserCheck} title="Independent review" description={r.ruleText} />
      <CardBody className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13rem] sm:items-end">
          <SavedInput label="Reviewer" value={r.name} onSave={(x) => save({ name: x })} testId="reviewer-name" />
          <SavedInput label="Organisation" value={r.organisation} onSave={(x) => save({ organisation: x })} testId="reviewer-org" />
          <SavedInput label="Years of experience" value={r.years} inputMode="decimal" onSave={(x) => save({ years: amountFromText(x) })} testId="reviewer-years" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox label="The reviewer has signed the options off" checked={r.signedOff} disabled={!r.ready && !r.signedOff} onCheckedChange={(x) => report(act.signOffReview(projectId, x === true))} data-testid="reviewer-signoff" />
          {r.signedOffText ? (
            <Pill size="sm" tone="brand" data-testid="reviewer-signed">
              {r.signedOffText}
            </Pill>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}

function BandSelect({ label, value, options, onChange, testId }: { label: string; value: ConditionBand | null; options: CityView['bandOptions']; onChange: (b: ConditionBand | null) => void; testId: string }) {
  return <Select aria-label={label} value={value === null ? '' : String(value)} placeholder="No band yet" options={options} onChange={(e) => onChange(band(e.target.value))} data-testid={testId} />
}

function Catalogue({ projectId, v }: { projectId: string; v: CityView }) {
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [b, setB] = useState<ConditionBand | null>(null)
  const add = () => {
    if (!report(act.addCatalogueEntry(projectId, { item, quantity, band: b }))) return
    setItem('')
    setQuantity('')
    setB(null)
  }
  return (
    <Card data-testid="city-catalogue">
      <CardHeader icon={BookMarked} title="Reuse catalogue" description="Key items the existing building on the site offers for reuse, with their condition. Advertise them on a reuse platform as early as possible." />
      <CardBody className="flex flex-col gap-4">
        {v.catalogue.length === 0 ? (
          <EmptyState icon={BookMarked} title="No items catalogued yet" text="Add at least five, from the pre-demolition audit." />
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.catalogue.map((e) => (
              <li key={e.id} className="grid gap-2 py-3 first:pt-0 sm:grid-cols-[minmax(0,1fr)_16rem_auto] sm:items-center" data-testid={`catalogue-${e.id}`}>
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium text-ink">{e.item}</p>
                  {e.quantity ? <p className="m-0 text-xs text-muted">{e.quantity}</p> : null}
                </div>
                <BandSelect label={`Condition of ${e.item}`} value={e.band} options={v.bandOptions} onChange={(x) => report(act.setCatalogueBand(projectId, e.id, x))} testId={`catalogue-band-${e.id}`} />
                <IconButton icon={Trash2} label={`Remove ${e.item}`} onClick={() => report(act.removeCityEntry(projectId, 'catalogue', e.id))} />
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_16rem_auto] sm:items-center">
          <Input aria-label="Item" placeholder="Item, for example raised floor panels" value={item} onChange={(e) => setItem(e.target.value)} data-testid="catalogue-item" />
          <Input aria-label="Quantity" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="catalogue-quantity" />
          <BandSelect label="Condition band" value={b} options={v.bandOptions} onChange={setB} testId="catalogue-new-band" />
          <Button icon={Plus} onClick={add} data-testid="catalogue-add">
            Add
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function Schedule({ projectId, v }: { projectId: string; v: CityView }) {
  return (
    <Card data-testid="city-schedule">
      <CardHeader icon={ScrollText} title="Reuse schedule" description="The reclaimed items the new building takes in, each with its condition band: 1 and 2 are reused, 3 and 4 repurposed, 5 and 6 recycled." />
      <CardBody>
        {v.schedule.length === 0 ? (
          <EmptyState icon={ScrollText} title="No reclaimed items yet" text="Items appear here once the client approves or reserves them." />
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.schedule.map((s) => (
              <li key={s.publicId} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center" data-testid={`schedule-${s.publicId}`}>
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium text-ink">{s.description}</p>
                  <p className="m-0 text-xs text-muted">
                    {s.publicId}, {s.statusText.toLowerCase()}
                  </p>
                </div>
                <BandSelect label={`Condition of ${s.description}`} value={s.band} options={v.bandOptions} onChange={(x) => report(act.setScheduleBand(projectId, s.publicId, x))} testId={`schedule-band-${s.publicId}`} />
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function Passports({ projectId, v }: { projectId: string; v: CityView }) {
  const [material, setMaterial] = useState('')
  const [reference, setReference] = useState('')
  const add = () => {
    if (!report(act.addPassport(projectId, material, reference))) return
    setMaterial('')
    setReference('')
  }
  return (
    <Card data-testid="city-passports">
      <CardHeader icon={IdCard} title="Material passports" description="Passports for at least five carbon-intensive new materials, so they can be found and reused later." />
      <CardBody className="flex flex-col gap-4">
        {v.passports.length === 0 ? (
          <p className="m-0 text-sm text-muted">None recorded yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.passports.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0" data-testid={`passport-${e.id}`}>
                <span className="min-w-0 text-sm">
                  <span className="font-medium text-ink">{e.material}</span>
                  <span className="block text-xs text-muted">{e.reference}</span>
                </span>
                <IconButton icon={Trash2} label={`Remove ${e.material}`} onClick={() => report(act.removeCityEntry(projectId, 'passports', e.id))} />
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
          <Input aria-label="Material" placeholder="Material, for example the steel frame" value={material} onChange={(e) => setMaterial(e.target.value)} data-testid="passport-material" />
          <Input aria-label="Passport reference" placeholder="Passport reference" value={reference} onChange={(e) => setReference(e.target.value)} data-testid="passport-reference" />
          <Button icon={Plus} onClick={add} data-testid="passport-add">
            Add
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const UPDATE_TONE = { done: 'brand', due: 'warning', overdue: 'danger', upcoming: 'neutral' } as const

function Updates({ projectId, v }: { projectId: string; v: CityView }) {
  return (
    <Card data-testid="city-updates">
      <CardHeader icon={CalendarCheck} title="Statement updates" description="The City asks for the statement to be updated at RIBA stages 4 and 6, against the project's programme." />
      <CardBody>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {v.updates.map((u) => (
            <li key={u.stage} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end" data-testid={`update-${u.stage}`}>
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-ink">{u.label}</p>
                <Pill size="sm" tone={UPDATE_TONE[u.status]} className="mt-1">
                  {u.statusText}
                </Pill>
              </div>
              <SavedInput label="Updated on" type="date" value={u.doneOn} onSave={(x) => report(act.markCityUpdate(projectId, u.stage, x.trim() === '' ? null : x))} testId={`update-date-${u.stage}`} />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
