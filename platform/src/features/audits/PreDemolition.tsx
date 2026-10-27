// The pre-deconstruction audit: the desk study, the hazard screen for the building's age, the reuse, recycling and
// waste inventories with a route for every reusable line, and the targets. Lines can come from the surveyed
// inventory, and reusable lines can be listed early as private lots.
import { useState } from 'react'
import { Link } from 'react-router'
import { Boxes, ClipboardList, Download, FileSearch, Pencil, Plus, Recycle, Store, Target, Trash2, TriangleAlert } from 'lucide-react'
import { act } from '../../store'
import type { AuditRowView, PreDemolitionView } from '../../store/selectors/audits'
import { rowDraft, rowDraftForFamily, rowInput, shareFromText, shareText, type RowDraft } from '../../store/selectors/audits-ui'
import type { AuditRow, BrokerRoute, BrokerStatus, HazardId, HazardStatus, PreDemolitionAudit } from '../../domain/auditTypes'
import { Button, Callout, Card, CardBody, CardHeader, Checkbox, Dialog, EmptyState, Field, IconButton, IndicativeMarker, Input, MetricStrip, Pill, SegmentedControl, Select, Table, TBody, TD, TH, THead, TR, Textarea, toast } from '../../ui'
import { ReadValue, SavedInput, SavedTextarea } from './fields'

type Patch = Parameters<typeof act.saveAudit>[1]

function useSave(id: string) {
  return (patch: Patch) => {
    const r = act.saveAudit(id, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
}

export function PreDemolition({ v }: { v: PreDemolitionView }) {
  return (
    <>
      <DeskStudy v={v} />
      <Hazards v={v} />
      <Inventories v={v} />
      <Targets v={v} />
    </>
  )
}

function DeskStudy({ v }: { v: PreDemolitionView }) {
  const save = useSave(v.id)
  return (
    <Card data-testid="audit-desk-study">
      <CardHeader icon={FileSearch} title="Desk study" description={v.yearBuiltText} />
      <CardBody className="grid gap-4 md:grid-cols-2">
        {v.editable ? (
          <>
            <div className="flex flex-col gap-3">
              <Checkbox label="Drawings and records seen" checked={v.deskStudy.drawingsSeen} onCheckedChange={(c) => save({ deskStudy: { drawingsSeen: c === true } })} data-testid="desk-drawings" />
              <Field label="Asbestos records" id="desk-register">
                <Select id="desk-register" data-testid="desk-register" value={v.deskStudy.asbestosRegister} options={v.registerOptions} onChange={(e) => save({ deskStudy: { asbestosRegister: e.target.value as PreDemolitionAudit['deskStudy']['asbestosRegister'] } })} />
              </Field>
            </div>
            <SavedTextarea label="History of the building" value={v.deskStudy.history} onSave={(t) => save({ deskStudy: { history: t } })} testId="desk-history" placeholder="Refurbishments, changes of use, what the records say." />
          </>
        ) : (
          <>
            <ReadValue label="Drawings and records" value={v.deskStudy.drawingsSeen ? 'Seen' : 'Not seen'} />
            <ReadValue label="Asbestos records" value={v.registerText} />
            <div className="md:col-span-2">
              <ReadValue label="History of the building" value={v.deskStudy.history} />
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

function Hazards({ v }: { v: PreDemolitionView }) {
  const save = useSave(v.id)
  const set = (h: PreDemolitionView['hazards'][number], patch: Partial<{ status: HazardStatus | null; basis: 'era' | 'survey' | 'test' | null; note: string }>) =>
    save({ hazard: { id: h.id as HazardId, status: h.status, basis: h.basis, note: h.note, ...patch } })
  return (
    <Card data-testid="audit-hazards">
      <CardHeader icon={TriangleAlert} title="Hazard screen" description="Hazards to look for, from when the building was built. Reclaimed boards, ceilings and flooring need the same screen before they are listed." />
      <CardBody>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {v.hazards.map((h) => (
            <li key={h.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" data-testid={`hazard-${h.id}`}>
              <div className="min-w-0">
                <p className="m-0 flex flex-wrap items-center gap-2 text-base font-medium text-ink">
                  {h.label}
                  {h.suggested ? (
                    <Pill tone="warning" size="sm">
                      Suspected by age
                    </Pill>
                  ) : null}
                </p>
                <p className="m-0 mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>{h.source}</span>
                  {h.indicative ? <IndicativeMarker /> : null}
                </p>
              </div>
              {v.editable ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Status" id={`hazard-status-${h.id}`}>
                    <Select id={`hazard-status-${h.id}`} data-testid={`hazard-status-${h.id}`} value={h.status ?? ''} placeholder="Not screened" options={v.hazardStatusOptions} onChange={(e) => set(h, { status: (e.target.value || null) as HazardStatus | null })} />
                  </Field>
                  <Field label="Basis" id={`hazard-basis-${h.id}`}>
                    <Select id={`hazard-basis-${h.id}`} value={h.basis ?? ''} placeholder="Not given" options={v.hazardBasisOptions} onChange={(e) => set(h, { basis: (e.target.value || null) as 'era' | 'survey' | 'test' | null })} />
                  </Field>
                  <SavedInput className="sm:col-span-2" label="Notes" value={h.note} onSave={(t) => set(h, { note: t })} testId={`hazard-note-${h.id}`} />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Pill tone={h.status === 'confirmed' ? 'danger' : h.status === 'suspected' ? 'warning' : 'neutral'} className="w-fit">
                    {h.statusLabel}
                  </Pill>
                  {h.note ? <p className="m-0 text-sm text-ink-soft">{h.note}</p> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Inventories({ v }: { v: PreDemolitionView }) {
  const [editing, setEditing] = useState<AuditRowView | 'new' | null>(null)
  const importItems = () => {
    const r = act.importSurveyedItems(v.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not bring in the items.')
    toast.success(`${r.value} ${r.value === 1 ? 'item' : 'items'} brought in`, { description: 'Check each line: the scores and shares start from the survey.', action: { label: 'Undo', onClick: r.undo } })
  }
  const listEarly = () => {
    const r = act.createListingsFromAudit(v.id)
    if (!r.ok || !r.value) return toast.error(r.error ?? 'Could not list the lines.')
    const { created, marked, skipped } = r.value
    const parts = [created > 0 ? `${created} private ${created === 1 ? 'lot' : 'lots'} made` : '', marked > 0 ? `${marked} surveyed ${marked === 1 ? 'item' : 'items'} marked as offered` : ''].filter(Boolean)
    toast.success(parts.join(', ') || 'Nothing new to list', {
      description: skipped > 0 ? `${skipped} ${skipped === 1 ? 'line needs' : 'lines need'} surveying first: steel and curtain wall need their sizes.` : 'They stay private until you share or publish them on Listings.',
      action: { label: 'Undo', onClick: r.undo },
    })
  }
  const remove = (r: AuditRowView) => {
    const x = act.removeAuditRow(v.id, r.id)
    if (!x.ok) return toast.error(x.error ?? 'Could not remove the line.')
    toast.success('Line removed', { action: { label: 'Undo', onClick: x.undo } })
  }
  return (
    <Card data-testid="audit-inventories">
      <CardHeader
        icon={Boxes}
        title="What comes out"
        description="Three inventories: what can be reused, what can be recycled and what is waste. An audit that only lists waste routes is not suitable."
        actions={
          v.editable ? (
            <Button size="sm" icon={Plus} onClick={() => setEditing('new')} data-testid="add-line">
              Add a line
            </Button>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-5">
        {v.editable && (v.importable > 0 || v.listable > 0) ? (
          <div className="flex flex-wrap gap-2">
            {v.importable > 0 ? (
              <Button icon={Download} onClick={importItems} data-testid="import-items">
                Bring in {v.importable} surveyed {v.importable === 1 ? 'item' : 'items'}
              </Button>
            ) : null}
            {v.listable > 0 ? (
              <Button icon={Store} onClick={listEarly} data-testid="list-early">
                List {v.listable} reusable {v.listable === 1 ? 'line' : 'lines'} early
              </Button>
            ) : null}
          </div>
        ) : null}
        {v.totals.empty ? (
          <EmptyState icon={ClipboardList} title="No lines yet" text={v.importable > 0 && v.editable ? 'Bring in the surveyed items, then add what the survey did not cover: finishes, services, the frame.' : 'Lines appear here as the auditor adds them.'} />
        ) : (
          <>
            <MetricStrip
              label="Audit totals"
              testId="audit-totals"
              items={[
                { key: 'total', label: 'Comes out', value: v.totals.totalText },
                { key: 'reusable', label: 'Reusable', value: v.totals.reusableText, sub: `${v.totals.reuseByMassText} by mass` },
                { key: 'recovery', label: 'Reused, recycled or recovered', value: v.totals.recoveryText, state: v.totals.recoveryMeetsTarget === null ? undefined : v.totals.recoveryMeetsTarget ? 'good' : 'warning', stateLabel: v.totals.recoveryStateText },
                { key: 'avoided', label: 'Carbon avoided', value: v.totals.avoidedText, indicative: true, sub: 'Against buying new, A1 to A4' },
              ]}
            />
            {v.inventories.map((inv) => (
              <section key={inv.id} className="flex flex-col gap-2" data-testid={`inventory-${inv.id}`}>
                <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
                  {inv.id === 'reuse' ? <Store aria-hidden="true" className="size-4 text-faint" /> : inv.id === 'recycle' ? <Recycle aria-hidden="true" className="size-4 text-faint" /> : <Trash2 aria-hidden="true" className="size-4 text-faint" />}
                  {inv.label}
                  <span className="text-sm font-normal text-muted">
                    {inv.rows.length} {inv.rows.length === 1 ? 'line' : 'lines'}, {inv.massText}
                  </span>
                </h3>
                {inv.rows.length === 0 ? (
                  <p className="m-0 text-sm text-muted">Nothing here yet.</p>
                ) : (
                  <>
                    <Table className="max-xl:hidden" caption={inv.label}>
                      <THead>
                        <tr>
                          <TH>Line</TH>
                          <TH align="right">Quantity</TH>
                          <TH align="right">Mass</TH>
                          <TH align="right">Score</TH>
                          {inv.id === 'reuse' ? <TH align="right">Reusable</TH> : null}
                          {inv.id === 'reuse' ? <TH>Band</TH> : null}
                          {inv.id === 'reuse' ? <TH>Route</TH> : null}
                          {v.editable ? <TH className="w-24">Actions</TH> : null}
                        </tr>
                      </THead>
                      <TBody>
                        {inv.rows.map((r) => (
                          <TR key={r.id} data-testid={`line-${r.id}`}>
                            <TD>
                              <LineName r={r} />
                            </TD>
                            <TD align="right" className="whitespace-nowrap tabular-nums">
                              {r.quantityText}
                            </TD>
                            <TD align="right" className="whitespace-nowrap tabular-nums">
                              {r.massText}
                            </TD>
                            <TD align="right" className="whitespace-nowrap tabular-nums">
                              {r.scoreText}
                            </TD>
                            {inv.id === 'reuse' ? (
                              <TD align="right" className="whitespace-nowrap tabular-nums">
                                {r.reusableText}
                                {r.reusableShareText ? <span className="block text-xs text-muted">{r.reusableShareText}</span> : null}
                                {r.avoidedText ? <span className="block text-xs text-muted">{r.avoidedText}</span> : null}
                              </TD>
                            ) : null}
                            {inv.id === 'reuse' ? <TD className="text-sm">{r.bandText}</TD> : null}
                            {inv.id === 'reuse' ? (
                              <TD className="text-sm">
                                {r.routeLabel}
                                <span className="block text-muted">{r.statusLabel}</span>
                              </TD>
                            ) : null}
                            {v.editable ? (
                              <TD>
                                <div className="flex gap-1">
                                  <IconButton icon={Pencil} label={`Edit ${r.raw.description}`} size="sm" onClick={() => setEditing(r)} />
                                  <IconButton icon={Trash2} label={`Remove ${r.raw.description}`} size="sm" onClick={() => remove(r)} />
                                </div>
                              </TD>
                            ) : null}
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0 xl:hidden">
                      {inv.rows.map((r) => (
                        <li key={r.id} className="rounded-lg border border-line-soft p-3" data-testid={`line-card-${r.id}`}>
                          <div className="flex items-start justify-between gap-2">
                            <LineName r={r} />
                            {v.editable ? (
                              <div className="flex gap-1">
                                <IconButton icon={Pencil} label={`Edit ${r.raw.description}`} onClick={() => setEditing(r)} />
                                <IconButton icon={Trash2} label={`Remove ${r.raw.description}`} onClick={() => remove(r)} />
                              </div>
                            ) : null}
                          </div>
                          <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <dt className="text-muted">Quantity</dt>
                              <dd className="m-0 text-ink">{r.quantityText}</dd>
                            </div>
                            <div>
                              <dt className="text-muted">Mass</dt>
                              <dd className="m-0 text-ink">{r.massText}</dd>
                            </div>
                            <div>
                              <dt className="text-muted">Score</dt>
                              <dd className="m-0 text-ink">{r.scoreText}</dd>
                            </div>
                            {inv.id === 'reuse' ? (
                              <>
                                <div>
                                  <dt className="text-muted">Reusable</dt>
                                  <dd className="m-0 text-ink">{r.reusableText ? `${r.reusableText}, ${r.reusableShareText}` : 'Not given'}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted">Band</dt>
                                  <dd className="m-0 text-ink">{r.bandText}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted">Route</dt>
                                  <dd className="m-0 text-ink">
                                    {r.routeLabel}, {r.statusLabel.toLowerCase()}
                                  </dd>
                                </div>
                              </>
                            ) : null}
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            ))}
            <section className="flex flex-col gap-2 border-t border-line-soft pt-4" data-testid="audit-arisings">
              <h3 className="m-0 text-base font-semibold text-ink">Arisings by waste code</h3>
              <ul className="m-0 grid list-none gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2">
                {v.arisings.map((a) => (
                  <li key={a.code} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 text-ink-soft">
                      <span className="tabular-nums text-muted">{a.code}</span> {a.label}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink">{a.massText}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </CardBody>
      {editing ? <LineDialog v={v} line={editing === 'new' ? null : editing.raw} onClose={() => setEditing(null)} /> : null}
    </Card>
  )
}

function LineName({ r }: { r: AuditRowView }) {
  return (
    <div className="min-w-0">
      <span className="block font-medium text-ink">{r.raw.description}</span>
      <span className="block text-sm text-muted">
        {r.familyLabel}, {r.nrmText}
        {r.raw.ewcCode ? `, ${r.raw.ewcCode}` : ''}
      </span>
      {r.itemHref ? (
        <Link to={r.itemHref} className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline">
          Open the item
        </Link>
      ) : null}
    </div>
  )
}

const INVENTORY_ITEMS = [
  { value: 'reuse', label: 'Reuse' },
  { value: 'recycle', label: 'Recycling' },
  { value: 'waste', label: 'Waste' },
]

const SCORE_OPTIONS = ['0', '1', '2', '3', '4'].map((x) => ({ value: x, label: x }))

function LineDialog({ v, line, onClose }: { v: PreDemolitionView; line: AuditRow | null; onClose: () => void }) {
  const [d, setD] = useState<RowDraft>(() => rowDraft(line))
  const set = (patch: Partial<RowDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const r = act.saveAuditRow(v.id, rowInput(d))
    if (!r.ok) return toast.error(r.error ?? 'Could not save the line.')
    onClose()
  }
  const score = (label: string, key: 'extractability' | 'quality' | 'marketValue', hint: string) => (
    <Field label={label} hint={hint}>
      <Select value={d[key]} placeholder="Not scored" options={SCORE_OPTIONS} onChange={(e) => set({ [key]: e.target.value })} data-testid={`line-${key}`} />
    </Field>
  )
  return (
    <Dialog
      open
      size="xl"
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title={line ? 'Edit the line' : 'Add a line'}
      description="One material or element as it comes out of the building."
      testId="line-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="save-line">
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description" className="sm:col-span-2">
          <Input value={d.description} onChange={(e) => set({ description: e.target.value })} data-testid="line-description" placeholder="For example, Welsh slates from the rear roof" />
        </Field>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-ink">Inventory</span>
          <SegmentedControl label="Inventory" items={INVENTORY_ITEMS} value={d.inventory} onValueChange={(x) => set({ inventory: x as AuditRow['inventory'] })} className="w-fit" />
        </div>
        <Field label="Material">
          <Select value={d.family} options={v.familyOptions} onChange={(e) => setD((x) => rowDraftForFamily(x, e.target.value, v.familyDefaults, x.family))} data-testid="line-family" />
        </Field>
        <Field label="Element">
          <Select value={d.nrm} options={v.nrmOptions} onChange={(e) => set({ nrm: e.target.value })} data-testid="line-nrm" />
        </Field>
        <Field label="Quantity" optional>
          <Input inputMode="decimal" value={d.quantity} onChange={(e) => set({ quantity: e.target.value })} data-testid="line-quantity" />
        </Field>
        <Field label="Unit" optional>
          <Input value={d.unit} onChange={(e) => set({ unit: e.target.value })} data-testid="line-unit" />
        </Field>
        <Field label="Mass" hint="Needed for the reuse and recovery shares.">
          <Input inputMode="decimal" value={d.mass} onChange={(e) => set({ mass: e.target.value })} trailing={<span className="text-sm text-muted">t</span>} data-testid="line-mass" />
        </Field>
        <Field label="Waste code" optional hint="European Waste Catalogue, for example 17 04 05.">
          <Input value={d.ewcCode} onChange={(e) => set({ ewcCode: e.target.value })} data-testid="line-ewc" />
        </Field>
        {score('Extractability', 'extractability', '0 cannot come out whole, 4 comes out easily.')}
        {score('Quality', 'quality', '0 unusable, 4 as new.')}
        {score('Market value', 'marketValue', '0 no demand, 4 sought after.')}
        {d.inventory === 'reuse' ? (
          <Field label="Reusable share" hint="Of the line, after losses in taking it out.">
            <Input inputMode="decimal" value={d.reusable} onChange={(e) => set({ reusable: e.target.value })} trailing={<span className="text-sm text-muted">%</span>} data-testid="line-reusable" />
          </Field>
        ) : null}
        {d.inventory === 'reuse' ? (
          <Field label="Condition band" optional={!v.isCity} hint={v.isCity ? 'The City of London asks for a band on every reuse item.' : 'The City of London bands, 1 as new to 6.'}>
            <Select value={d.band} placeholder="No band" options={v.bandOptions.map((b) => ({ value: String(b.value), label: b.label }))} onChange={(e) => set({ band: e.target.value })} data-testid="line-band" />
          </Field>
        ) : null}
        {d.inventory === 'reuse' ? (
          <>
            <Field label="Route">
              <Select value={d.route} options={v.routeOptions} onChange={(e) => set({ route: e.target.value as BrokerRoute })} data-testid="line-route" />
            </Field>
            <Field label="Route status">
              <Select value={d.status} options={v.brokerStatusOptions} onChange={(e) => set({ status: e.target.value as BrokerStatus })} data-testid="line-status" />
            </Field>
            {d.route === 'other_outlet' ? (
              <Field label="Outlet" optional className="sm:col-span-2">
                <Input value={d.outlet} onChange={(e) => set({ outlet: e.target.value })} placeholder="For example, Reclamation yard, Kent" />
              </Field>
            ) : null}
          </>
        ) : null}
        <Field label="Considerations" optional className="sm:col-span-2">
          <Textarea rows={2} value={d.considerations} onChange={(e) => set({ considerations: e.target.value })} placeholder="Fixings, access, protection, what to watch for." />
        </Field>
      </div>
    </Dialog>
  )
}

function Targets({ v }: { v: PreDemolitionView }) {
  const save = useSave(v.id)
  return (
    <Card data-testid="audit-targets">
      <CardHeader icon={Target} title="Targets" description={v.recoveryTargetText} />
      <CardBody className="grid gap-4 md:grid-cols-2">
        {v.editable ? (
          <>
            <SavedInput label="Reuse, by mass" inputMode="decimal" value={shareText(v.targets.reuseByMass)} onSave={(t) => save({ targets: { reuseByMass: shareFromText(t) } })} testId="target-reuse" trailing={<span className="text-sm text-muted">%</span>} hint={`Forecast from the lines: ${v.totals.reuseByMassText}.`} />
            <SavedInput label="Reuse, recycling and recovery, by weight" inputMode="decimal" value={shareText(v.targets.recoveryByWeight)} onSave={(t) => save({ targets: { recoveryByWeight: shareFromText(t) } })} testId="target-recovery" trailing={<span className="text-sm text-muted">%</span>} hint={`Forecast from the lines: ${v.totals.recoveryText}.`} />
          </>
        ) : (
          <>
            <ReadValue label="Reuse, by mass" value={v.targetsText.reuse} />
            <ReadValue label="Reuse, recycling and recovery, by weight" value={v.targetsText.recovery} />
          </>
        )}
        {v.totals.recoveryMeetsTarget === false ? (
          <Callout tone="warning" className="md:col-span-2">
            {v.totals.recoveryWarning}
          </Callout>
        ) : null}
      </CardBody>
    </Card>
  )
}
