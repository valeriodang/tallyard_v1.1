// A carbon options appraisal (City of London advice note, Table A): options from keeping the building to a new build,
// with upfront and whole life carbon including demolition, the retrofit test and the City's office benchmarks. Shared
// by the owner's pre-redevelopment audit and the consultant's City module.
import { useState } from 'react'
import { Building2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import type { CarbonOptionsView, OptionView } from '../../store/selectors/audits'
import { optionDraft, optionInput, type OptionDraft } from '../../store/selectors/audits-ui'
import type { RetentionOptionInput } from '../../store/actions/audits'
import type { RetentionOptionKind } from '../../domain/auditTypes'
import { Button, Callout, Card, CardBody, CardHeader, Dialog, EmptyState, Field, IconButton, IndicativeMarker, Input, Select, Table, TBody, TD, TH, THead, TR, Textarea, toast } from '../../ui'
import { ReadValue, SavedTextarea } from './fields'

/** What the owner's audit and the consultant's City module each do with an option. */
export type CarbonOptionsHandlers = {
  save: (input: RetentionOptionInput) => { ok: boolean; error: string | null }
  remove: (o: OptionView) => void
  setPreferred: (id: string | null) => void
  saveJustification: (text: string) => boolean
}

export function CarbonOptions({ v, editable, isCity, handlers, testId = 'audit-options', justificationTestId = 'audit-justification' }: { v: CarbonOptionsView; editable: boolean; isCity: boolean; handlers: CarbonOptionsHandlers; testId?: string; justificationTestId?: string }) {
  const [editing, setEditing] = useState<OptionView | 'new' | null>(null)
  const remove = handlers.remove
  return (
    <Card data-testid={testId}>
      <CardHeader
        icon={Building2}
        title="Carbon options"
        description={isCity ? 'Compare options at different levels of intervention, from keeping the building to a new build, on upfront and whole life carbon.' : 'Compare at least two options, with their upfront and whole life carbon where known.'}
        actions={
          editable ? (
            <Button size="sm" icon={Plus} onClick={() => setEditing('new')} data-testid="add-option">
              Add an option
            </Button>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-4">
        {v.options.length === 0 ? (
          <EmptyState icon={Building2} title="No options yet" text="Add the options the design team has looked at: refurbish, extend, keep part of the building, keep the substructure or build new." />
        ) : (
          <>
            <Table className="max-xl:hidden" caption="Options compared" data-testid="options-table">
              <THead>
                <tr>
                  <TH>Option</TH>
                  <TH align="right">Superstructure kept</TH>
                  <TH align="right">Upfront, with demolition</TH>
                  <TH align="right">Whole life, with demolition</TH>
                  <TH>Retrofit test</TH>
                  {editable ? <TH className="w-24">Actions</TH> : null}
                </tr>
              </THead>
              <TBody>
                {v.options.map((o) => (
                  <TR key={o.id} data-testid={`option-${o.id}`}>
                    <TD>
                      <OptionName o={o} />
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {o.superstructureText}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {o.upfrontWithDemolitionText}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {o.wlcWithDemolitionText}
                      {o.isLowestWlc ? <span className="block text-xs text-brand-700">Lowest</span> : null}
                    </TD>
                    <TD>{o.retrofitText}</TD>
                    {editable ? (
                      <TD>
                        <div className="flex gap-1">
                          <IconButton icon={Pencil} label={`Edit ${o.label}`} size="sm" onClick={() => setEditing(o)} />
                          <IconButton icon={Trash2} label={`Remove ${o.label}`} size="sm" onClick={() => remove(o)} />
                        </div>
                      </TD>
                    ) : null}
                  </TR>
                ))}
              </TBody>
            </Table>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 xl:hidden">
              {v.options.map((o) => (
                <li key={o.id} className="rounded-lg border border-line-soft p-3" data-testid={`option-card-${o.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <OptionName o={o} />
                    {editable ? (
                      <div className="flex gap-1">
                        <IconButton icon={Pencil} label={`Edit ${o.label}`} onClick={() => setEditing(o)} />
                        <IconButton icon={Trash2} label={`Remove ${o.label}`} onClick={() => remove(o)} />
                      </div>
                    ) : null}
                  </div>
                  <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Superstructure kept</dt>
                      <dd className="m-0 text-ink">{o.superstructureText}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Retrofit test</dt>
                      <dd className="m-0 text-ink">{o.retrofitText}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Upfront, with demolition</dt>
                      <dd className="m-0 text-ink">{o.upfrontWithDemolitionText}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Whole life, with demolition</dt>
                      <dd className="m-0 text-ink">
                        {o.wlcWithDemolitionText}
                        {o.isLowestWlc ? ', lowest' : ''}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{v.demolitionDefaultText}</span>
              <IndicativeMarker />
            </p>
            {isCity ? <p className="m-0 text-sm text-muted">{v.retrofitRuleText}</p> : null}
          </>
        )}
        {v.options.length > 0 ? (
          <div className="grid gap-4 border-t border-line-soft pt-4 md:grid-cols-2">
            {editable ? (
              <Field label="Preferred option" id="preferred-option">
                <Select id="preferred-option" data-testid="preferred-option" value={v.preferredOptionId ?? ''} placeholder="Not chosen" options={v.options.map((o) => ({ value: o.id, label: o.label }))} onChange={(e) => handlers.setPreferred(e.target.value || null)} />
              </Field>
            ) : (
              <ReadValue label="Preferred option" value={v.options.find((o) => o.isPreferred)?.label ?? 'Not chosen'} />
            )}
            {v.cityChecks.length > 0 ? (
              <div className="flex flex-col gap-2" data-testid="city-checks">
                <p className="m-0 flex items-center gap-2 text-sm font-medium text-ink-soft">
                  Against the City office benchmarks
                  <IndicativeMarker />
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {v.cityChecks.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="text-ink">{c.label}</span>
                      <span className="block text-muted">
                        {c.valueText}, benchmark {c.limitText}.{' '}
                        <span className={c.within ? 'text-brand-700' : 'text-warning'}>{c.within ? 'Within it' : 'Above it'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {v.needsJustification ? (
              editable ? (
                <SavedTextarea
                  className="md:col-span-2"
                  label="Why this option"
                  hint="The preferred option keeps less than another option, or is not the lowest whole life carbon. Say why, in at least a sentence."
                  value={v.justification}
                  onSave={handlers.saveJustification}
                  testId={justificationTestId}
                />
              ) : (
                <div className="md:col-span-2">
                  <ReadValue label="Why this option" value={v.justification} />
                </div>
              )
            ) : null}
          </div>
        ) : null}
      </CardBody>
      {editing ? <OptionDialog v={v} isCity={isCity} save={handlers.save} option={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
    </Card>
  )
}

function OptionName({ o }: { o: OptionView }) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 font-medium text-ink">
        {o.isPreferred ? <Star aria-label="Preferred" className="size-3.5 shrink-0 fill-current text-brand-700" /> : null}
        {o.label}
      </span>
      <span className="block text-sm text-muted">{o.kindLabel}</span>
    </div>
  )
}

function OptionDialog({ v, isCity, save, option, onClose }: { v: CarbonOptionsView; isCity: boolean; save: CarbonOptionsHandlers['save']; option: OptionView | null; onClose: () => void }) {
  const [d, setD] = useState<OptionDraft>(() => optionDraft(option?.raw ?? null))
  const set = (patch: Partial<OptionDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const r = save(optionInput(d))
    if (!r.ok) return toast.error(r.error ?? 'Could not save the option.')
    onClose()
  }
  const num = (label: string, key: keyof OptionDraft, unit: string, hint?: string) => (
    <Field label={label} hint={hint} optional>
      <Input inputMode="decimal" value={d[key] as string} onChange={(e) => set({ [key]: e.target.value })} trailing={<span className="text-sm text-muted">{unit}</span>} data-testid={`option-${key}`} />
    </Field>
  )
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title={option ? `Edit ${option.label}` : 'Add an option'}
      description="Carbon per m2 of the option's floor area (GIA)."
      testId="option-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="save-option">
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input value={d.label} onChange={(e) => set({ label: e.target.value })} data-testid="option-label" />
        </Field>
        <Field label="Kind">
          <Select value={d.kind} options={v.optionKinds} onChange={(e) => set({ kind: e.target.value as RetentionOptionKind })} data-testid="option-kind" />
        </Field>
        {num('Superstructure kept, by mass', 'superstructure', '%')}
        {num('Facade kept, by area', 'facade', '%')}
        {num('Floor area (GIA)', 'gia', 'm2')}
        {num('Upfront carbon, A1 to A5', 'upfront', 'kgCO2e per m2')}
        {num('Whole life carbon, A to C', 'wlc', 'kgCO2e per m2', 'Excluding B6 and B7.')}
        {num('Floor area demolished', 'demolishedArea', 'm2')}
        {num('Demolition carbon', 'demolition', 'kgCO2e per m2', 'Leave blank to use the default for the area demolished.')}
        <Field label="Notes" optional className="sm:col-span-2">
          <Textarea rows={2} value={d.note} onChange={(e) => set({ note: e.target.value })} />
        </Field>
      </div>
      {isCity ? (
        <Callout tone="info" className="mt-4">
          {v.retrofitRuleText}
        </Callout>
      ) : null}
    </Dialog>
  )
}
