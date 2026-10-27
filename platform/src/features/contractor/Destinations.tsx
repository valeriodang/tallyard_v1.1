// The building's Destinations tab (round 3): where every stream goes, forecast against what was weighed out, with the
// duty of care papers for each stream of waste and the true cost of waste. The contractor writes it and keeps its
// carrier register here; the owner reads it to show what was reused against what was forecast.
import { useState } from 'react'
import { useParams } from 'react-router'
import { ClipboardList, Pencil, Plus, Receipt, Trash2, TriangleAlert, Truck, Waypoints } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { CarrierRow, DestinationRow, DestinationsView } from '../../store/selectors/contractorWork'
import { carrierDraft, carrierInput, destinationDraft, destinationInput, type CarrierDraft, type DestinationDraft } from '../../store/selectors/contractorWork-ui'
import type { CarrierTier, DestinationEntry } from '../../domain/contractorTypes'
import type { Destination } from '../../domain/types'
import { Button, Callout, Card, CardBody, CardHeader, Dialog, EmptyState, Field, IconButton, IndicativeMarker, Input, MetricStrip, Pill, SegmentedControl, Select, Table, TBody, TD, TH, THead, TR, Textarea, toast } from '../../ui'

export function Destinations() {
  const { buildingId = '' } = useParams()
  const v = useView(selectors.destinationsView, buildingId)
  if (!v) return null
  return (
    <div className="flex flex-col gap-6" data-testid="destinations">
      <p className="m-0 max-w-2xl text-base text-ink-soft">
        {v.canWrite
          ? 'Log where every stream goes, first as a forecast, then as weighed out, with the carrier, the receiving site and the transfer note.'
          : v.contractorName
            ? `${v.contractorName} logs where every stream goes, forecast against what was weighed out. This is the record the post-completion report draws on.`
            : 'Your deconstruction contractor logs where every stream goes here. Appoint one on Overview.'}
      </p>
      <Streams v={v} buildingId={buildingId} />
      {!v.empty ? <TrueCost v={v} /> : null}
      {v.canWrite ? <Carriers /> : null}
    </div>
  )
}

function Streams({ v, buildingId }: { v: DestinationsView; buildingId: string }) {
  const [editing, setEditing] = useState<DestinationEntry | 'new' | null>(null)
  const fromAudit = () => {
    const r = act.forecastDestinationsFromAudit(buildingId)
    if (!r.ok) return toast.error(r.error ?? 'Could not read the audit.')
    toast.success(`${r.value} ${r.value === 1 ? 'stream' : 'streams'} forecast from the audit`, { description: 'Check each one, then log the tonnes as they are weighed out.', action: { label: 'Undo', onClick: r.undo } })
  }
  const remove = (row: DestinationRow) => {
    const r = act.removeDestination(buildingId, row.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not remove the stream.')
    toast.success('Stream removed', { action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <Card data-testid="destination-log">
      <CardHeader
        icon={Waypoints}
        title="Where it goes"
        description={v.totals.targetsText ?? 'Forecast against actual, by destination.'}
        actions={
          v.canWrite ? (
            <Button size="sm" icon={Plus} onClick={() => setEditing('new')} data-testid="add-stream">
              Add a stream
            </Button>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-5">
        {v.canWrite && v.auditForecastable > 0 ? (
          <Button icon={ClipboardList} className="self-start" onClick={fromAudit} data-testid="forecast-from-audit">
            Forecast {v.auditForecastable} {v.auditForecastable === 1 ? 'line' : 'lines'} from the audit
          </Button>
        ) : null}
        {v.empty ? (
          <EmptyState
            icon={Waypoints}
            title="Nothing logged yet"
            text={v.canWrite ? (v.hasAudit ? 'Start from the pre-deconstruction audit, or add each stream yourself.' : 'Add each stream as you plan it. A pre-deconstruction audit fills the forecast in one step.') : 'Streams appear here as the contractor logs them.'}
          />
        ) : (
          <>
            <MetricStrip
              label="Destination totals"
              testId="destination-totals"
              items={[
                { key: 'forecast', label: 'Forecast', value: v.totals.forecastText, sub: 'Not hazardous' },
                { key: 'moved', label: 'Weighed out', value: v.totals.actualText, sub: v.totals.movedText },
                { key: 'reuse', label: 'Reused', value: v.totals.actualReuseText, sub: `Forecast ${v.totals.forecastReuseText}` },
                { key: 'recovery', label: 'Reused, recycled or recovered', value: v.totals.actualRecoveryText, sub: `Forecast ${v.totals.forecastRecoveryText}` },
              ]}
            />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-base font-semibold text-ink">By destination</h3>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0" data-testid="by-route">
                  {v.byRoute.map((x) => (
                    <li key={x.route} className="flex justify-between gap-3 text-sm">
                      <span className="min-w-0 text-ink-soft">{x.label}</span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {x.actualText} <span className="text-muted">of {x.forecastText}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="m-0 text-sm text-muted">Hazardous waste: {v.totals.hazardousText}. It is kept out of the shares, as the London Plan target reads.</p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-base font-semibold text-ink">Duty of care papers</h3>
                <p className="m-0 text-sm text-ink-soft" data-testid="papers">
                  {v.papers.text}
                </p>
                <p className="m-0 text-sm text-muted">Each stream of waste that leaves the site needs an upper tier carrier, a receiving site with its permit, and a transfer note, or a consignment note for hazardous waste. To confirm against the current regulations.</p>
              </div>
            </div>
            <Table className="max-xl:hidden" caption="Streams" data-testid="streams-table">
              <THead>
                <tr>
                  <TH>Stream</TH>
                  <TH>Destination</TH>
                  <TH align="right">Forecast</TH>
                  <TH align="right">Weighed out</TH>
                  <TH>Carrier and site</TH>
                  {v.canWrite ? <TH className="w-24">Actions</TH> : null}
                </tr>
              </THead>
              <TBody>
                {v.rows.map((r) => (
                  <TR key={r.id} data-testid={`stream-${r.id}`}>
                    <TD>
                      <StreamName r={r} />
                    </TD>
                    <TD className="text-sm">{r.routeLabel}</TD>
                    <TD align="right" className="whitespace-nowrap tabular-nums">
                      {r.forecastText}
                    </TD>
                    <TD align="right" className="whitespace-nowrap tabular-nums">
                      {r.actualText}
                      {r.movedText ? <span className="block text-xs text-muted">{r.movedText}</span> : null}
                    </TD>
                    <TD className="text-sm">{r.needsPapers ? <Papers r={r} /> : <span className="text-muted">No papers needed for reuse</span>}</TD>
                    {v.canWrite ? (
                      <TD>
                        <div className="flex gap-1">
                          <IconButton icon={Pencil} label={`Edit ${r.description}`} size="sm" onClick={() => setEditing(r.raw)} />
                          <IconButton icon={Trash2} label={`Remove ${r.description}`} size="sm" onClick={() => remove(r)} />
                        </div>
                      </TD>
                    ) : null}
                  </TR>
                ))}
              </TBody>
            </Table>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 xl:hidden">
              {v.rows.map((r) => (
                <li key={r.id} className="rounded-lg border border-line-soft p-3" data-testid={`stream-card-${r.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <StreamName r={r} />
                    {v.canWrite ? (
                      <div className="flex gap-1">
                        <IconButton icon={Pencil} label={`Edit ${r.description}`} onClick={() => setEditing(r.raw)} />
                        <IconButton icon={Trash2} label={`Remove ${r.description}`} onClick={() => remove(r)} />
                      </div>
                    ) : null}
                  </div>
                  <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Destination</dt>
                      <dd className="m-0 text-ink">{r.routeLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Forecast</dt>
                      <dd className="m-0 text-ink">{r.forecastText}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted">Weighed out</dt>
                      <dd className="m-0 text-ink">
                        {r.actualText}
                        {r.movedText ? `, ${r.movedText}` : ''}
                      </dd>
                    </div>
                    {r.needsPapers ? (
                      <div className="col-span-2">
                        <dt className="text-muted">Carrier and site</dt>
                        <dd className="m-0 text-ink">
                          <Papers r={r} />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
      {editing ? <StreamDialog v={v} buildingId={buildingId} entry={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
    </Card>
  )
}

function StreamName({ r }: { r: DestinationRow }) {
  return (
    <div className="min-w-0">
      <span className="block font-medium text-ink">{r.description}</span>
      <span className="block text-sm text-muted">
        {r.ewcCode || 'No waste code'}
        {r.fromAudit ? ', from the audit' : ''}
      </span>
    </div>
  )
}

function Papers({ r }: { r: DestinationRow }) {
  if (r.papersDue) return <span className="text-muted">Papers due when it moves</span>
  return (
    <div className="flex flex-col gap-1">
      <span className="text-ink">{r.carrierText}</span>
      <span className="text-muted">{r.siteText}</span>
      {r.gaps.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0" data-testid={`gaps-${r.id}`}>
          {r.gaps.map((g) => (
            <li key={g} className="flex items-start gap-1.5 text-warning">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              {g}
            </li>
          ))}
        </ul>
      ) : r.moved ? (
        <Pill tone="brand" size="sm" className="w-fit">
          Papers complete
        </Pill>
      ) : null}
    </div>
  )
}

function StreamDialog({ v, buildingId, entry, onClose }: { v: DestinationsView; buildingId: string; entry: DestinationEntry | null; onClose: () => void }) {
  const [d, setD] = useState<DestinationDraft>(() => destinationDraft(entry))
  const set = (patch: Partial<DestinationDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const r = act.saveDestination(buildingId, destinationInput(d))
    if (!r.ok) return toast.error(r.error ?? 'Could not save the stream.')
    onClose()
  }
  return (
    <Dialog
      open
      size="xl"
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title={entry ? 'Edit the stream' : 'Add a stream'}
      description="One material going one way. Log the tonnes from the weighbridge ticket once it has gone."
      testId="stream-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="save-stream">
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stream" className="sm:col-span-2">
          <Input value={d.description} onChange={(e) => set({ description: e.target.value })} data-testid="stream-description" placeholder="For example, plasterboard from the partitions" />
        </Field>
        <Field label="Destination">
          <Select value={d.route} options={v.routeOptions} onChange={(e) => set({ route: e.target.value as Destination })} data-testid="stream-route" />
        </Field>
        <Field label="Waste code" optional>
          <Input value={d.ewcCode} onChange={(e) => set({ ewcCode: e.target.value })} data-testid="stream-ewc" />
        </Field>
        <Field label="Forecast" optional>
          <Input inputMode="decimal" value={d.forecast} onChange={(e) => set({ forecast: e.target.value })} trailing={<span className="text-sm text-muted">t</span>} data-testid="stream-forecast" />
        </Field>
        <Field label="Weighed out" optional hint="Leave blank until it has gone.">
          <Input inputMode="decimal" value={d.actual} onChange={(e) => set({ actual: e.target.value })} trailing={<span className="text-sm text-muted">t</span>} data-testid="stream-actual" />
        </Field>
        <Field label="Moved on" optional>
          <Input type="date" value={d.movedOn} onChange={(e) => set({ movedOn: e.target.value })} data-testid="stream-moved-on" />
        </Field>
        <Field label="Carrier" optional hint={v.carrierOptions.length === 0 ? 'Add carriers to your register below first.' : undefined}>
          <Select value={d.carrierId} placeholder="No carrier" options={v.carrierOptions} onChange={(e) => set({ carrierId: e.target.value })} data-testid="stream-carrier" />
        </Field>
        <Field label="Receiving site" optional>
          <Input value={d.facility} onChange={(e) => set({ facility: e.target.value })} data-testid="stream-facility" placeholder="For example, Aggregate recycler, Essex" />
        </Field>
        <Field label="Permit or exemption" optional>
          <Input value={d.permitRef} onChange={(e) => set({ permitRef: e.target.value })} data-testid="stream-permit" />
        </Field>
        <Field label={d.route === 'hazardous_disposal' ? 'Consignment note' : 'Transfer note'} optional>
          <Input value={d.transferNoteRef} onChange={(e) => set({ transferNoteRef: e.target.value })} data-testid="stream-note-ref" />
        </Field>
        <Field label="Notes" optional className="sm:col-span-2">
          <Textarea rows={2} value={d.note} onChange={(e) => set({ note: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  )
}

function TrueCost({ v }: { v: DestinationsView }) {
  const [basis, setBasis] = useState<'forecast' | 'actual'>('forecast')
  const c = v.cost[basis]
  return (
    <Card data-testid="true-cost">
      <CardHeader icon={Receipt} title="The true cost of waste" description="Handling, haulage, the receiving site's fee and landfill tax. Demolition arisings carry no purchase cost." actions={<IndicativeMarker />} />
      <CardBody className="flex flex-col gap-4">
        <SegmentedControl
          label="Cost basis"
          size="sm"
          value={basis}
          onValueChange={(x) => setBasis(x as 'forecast' | 'actual')}
          items={[
            { value: 'forecast', label: 'Forecast' },
            { value: 'actual', label: 'Weighed out' },
          ]}
          className="self-start"
        />
        {c.empty ? (
          <p className="m-0 text-sm text-muted">Nothing weighed out yet.</p>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0" data-testid="cost-lines">
              {c.lines.map((l) => (
                <li key={l.route} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{l.label}</span>
                    <span className="block text-muted">
                      {l.tonnesText}: handling {l.handlingText}, haulage {l.haulageText}, fee {l.gateFeeText}, landfill tax {l.landfillTaxText}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums text-ink sm:text-right">{l.totalText}</span>
                </li>
              ))}
            </ul>
            <dl className="m-0 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Total, excluding VAT</dt>
                <dd className="m-0 font-medium tabular-nums text-ink" data-testid="cost-total">
                  {c.totalExVatText}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Per tonne</dt>
                <dd className="m-0 tabular-nums text-ink">{c.perTonneText}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">VAT</dt>
                <dd className="m-0 tabular-nums text-ink">{c.vatText}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Total, including VAT</dt>
                <dd className="m-0 tabular-nums text-ink">{c.totalIncVatText}</dd>
              </div>
            </dl>
            {c.reuseAvoids ? <Callout tone="info">Reuse kept {c.landfillAvoidedText} of landfill fees and tax off this bill.</Callout> : null}
          </>
        )}
        <p className="m-0 text-sm text-muted">Placeholder rates, except landfill tax and VAT. Published site studies found the true cost of skipped waste far above the skip: {v.cost.casesText}</p>
      </CardBody>
    </Card>
  )
}

function Carriers() {
  const v = useView(selectors.carriersView)
  const [editing, setEditing] = useState<CarrierRow | 'new' | null>(null)
  if (!v) return null
  const remove = (c: CarrierRow) => {
    const r = act.removeCarrier(c.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not remove the carrier.')
    toast.success(`${c.name} removed`, { action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <Card data-testid="carriers">
      <CardHeader
        icon={Truck}
        title="Your carriers"
        description="The waste carriers your firm uses, with their registration. Every building's log picks from this list."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')} data-testid="add-carrier">
            Add a carrier
          </Button>
        }
      />
      <CardBody>
        {v.empty ? (
          <p className="m-0 text-sm text-muted">No carriers yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.rows.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0" data-testid={`carrier-${c.id}`}>
                <div className="min-w-0 text-sm">
                  <span className="block font-medium text-ink">{c.name}</span>
                  <span className="block text-muted">
                    {c.registration}, {c.tierLabel.toLowerCase()}, expires {c.expiresText}
                  </span>
                  {c.expired ? (
                    <Pill tone="warning" size="sm" className="mt-1">
                      Registration expired
                    </Pill>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <IconButton icon={Pencil} label={`Edit ${c.name}`} onClick={() => setEditing(c)} />
                  <IconButton icon={Trash2} label={`Remove ${c.name}`} onClick={() => remove(c)} disabled={c.inUse > 0} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      {editing ? <CarrierDialog carrier={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
    </Card>
  )
}

const TIERS = [
  { value: 'upper', label: 'Upper tier' },
  { value: 'lower', label: 'Lower tier' },
]

function CarrierDialog({ carrier, onClose }: { carrier: CarrierRow | null; onClose: () => void }) {
  const [d, setD] = useState<CarrierDraft>(() => carrierDraft(carrier?.raw ?? null))
  const set = (patch: Partial<CarrierDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const r = act.saveCarrier(carrierInput(d))
    if (!r.ok) return toast.error(r.error ?? 'Could not save the carrier.')
    onClose()
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title={carrier ? `Edit ${carrier.name}` : 'Add a carrier'}
      description="As it appears on the public register of waste carriers."
      testId="carrier-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="save-carrier">
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={d.name} onChange={(e) => set({ name: e.target.value })} data-testid="carrier-name" />
        </Field>
        <Field label="Registration number">
          <Input value={d.registration} onChange={(e) => set({ registration: e.target.value })} data-testid="carrier-registration" placeholder="For example, CBDU123456" />
        </Field>
        <Field label="Tier" hint="Construction and demolition waste needs an upper tier carrier.">
          <Select value={d.tier} options={TIERS} onChange={(e) => set({ tier: e.target.value as CarrierTier })} data-testid="carrier-tier" />
        </Field>
        <Field label="Expires on" optional>
          <Input type="date" value={d.expiresOn} onChange={(e) => set({ expiresOn: e.target.value })} data-testid="carrier-expires" />
        </Field>
      </div>
    </Dialog>
  )
}
