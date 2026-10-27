// The pre-redevelopment audit: the six factors that decide whether the building can be kept, the GLA decision tree
// for existing buildings, and the carbon options appraisal the City of London asks for.
import { useState } from 'react'
import { Building2, GitBranch, Pencil, Plus, Scale, Star, Trash2 } from 'lucide-react'
import { act } from '../../store'
import type { OptionView, PreRedevelopmentView } from '../../store/selectors/audits'
import { optionDraft, optionInput, type OptionDraft } from '../../store/selectors/audits-ui'
import type { RetentionFactorId, RetentionOptionKind, RetentionScale } from '../../domain/auditTypes'
import { Button, Callout, Card, CardBody, CardHeader, Checkbox, Dialog, EmptyState, Field, IconButton, IndicativeMarker, Input, Pill, SegmentedControl, Select, Table, TBody, TD, TH, THead, TR, Textarea, cx, toast } from '../../ui'
import { ReadValue, SavedTextarea } from './fields'

type Patch = Parameters<typeof act.saveAudit>[1]

function useSave(id: string) {
  return (patch: Patch) => {
    const r = act.saveAudit(id, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
}

export function PreRedevelopment({ v }: { v: PreRedevelopmentView }) {
  return (
    <>
      <Factors v={v} />
      <Tree v={v} />
      <Options v={v} />
      <FollowOn v={v} />
    </>
  )
}

function Factors({ v }: { v: PreRedevelopmentView }) {
  const save = useSave(v.id)
  return (
    <Card data-testid="audit-factors">
      <CardHeader icon={Scale} title="Retention factors" description={`${v.factorsRated} of ${v.factors.length} rated. Rate each factor on what keeping the building would mean for it.`} />
      <CardBody>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {v.factors.map((f) => (
            <li key={f.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid={`factor-${f.id}`}>
              <div className="min-w-0">
                <p className="m-0 text-base font-medium text-ink">{f.label}</p>
                <p className="m-0 mt-0.5 text-sm text-muted">{f.question}</p>
              </div>
              {v.editable ? (
                <div className="flex min-w-0 flex-col gap-3">
                  <Field label="Rating" id={`factor-scale-${f.id}`}>
                    <Select
                      id={`factor-scale-${f.id}`}
                      data-testid={`factor-scale-${f.id}`}
                      value={f.scale ?? ''}
                      placeholder="Not rated"
                      options={v.scaleOptions}
                      onChange={(e) => save({ factor: { id: f.id as RetentionFactorId, scale: (e.target.value || null) as RetentionScale | null, note: f.note } })}
                    />
                  </Field>
                  <SavedTextarea label="Notes" rows={2} value={f.note} onSave={(t) => save({ factor: { id: f.id as RetentionFactorId, scale: f.scale, note: t } })} testId={`factor-note-${f.id}`} />
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-2">
                  <Pill tone={f.scale === 'not_prohibit' ? 'brand' : f.scale === 'may_not_be_supported' ? 'warning' : 'neutral'} className="w-fit">
                    {f.scaleLabel}
                  </Pill>
                  {f.note ? <p className="m-0 whitespace-pre-wrap text-sm text-ink-soft">{f.note}</p> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

function Tree({ v }: { v: PreRedevelopmentView }) {
  const save = useSave(v.id)
  return (
    <Card data-testid="audit-tree">
      <CardHeader icon={GitBranch} title="The GLA decision tree" description="Answer in order. The design approach it reaches is the one the statement has to start from." />
      <CardBody className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {v.tree.map((q, i) => (
            <li key={q.id} className="flex flex-col gap-2" data-testid={`tree-${q.id}`}>
              <p className="m-0 text-base text-ink">
                <span className="mr-1.5 font-medium tabular-nums text-muted">{i + 1}.</span>
                {q.text}
              </p>
              {v.editable ? (
                <SegmentedControl label={q.text} items={YES_NO} value={q.answer ?? ''} onValueChange={(x) => save({ tree: { [q.id]: x as 'yes' | 'no' } })} className="w-fit" />
              ) : (
                <p className="m-0 text-sm font-medium text-ink-soft">{q.answer === 'yes' ? 'Yes' : q.answer === 'no' ? 'No' : 'Not answered'}</p>
              )}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-medium text-ink-soft">Design approaches, most preferred first</p>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {v.outcomes.map((o) => (
              <li key={o.id} className={cx('rounded-lg border px-3 py-2.5', o.reached ? 'border-brand-600 bg-brand-50' : 'border-line-soft')} data-testid={`outcome-${o.id}`} data-reached={o.reached}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-medium text-ink">{o.label}</span>
                  {o.reached ? (
                    <Pill tone="brand" size="sm">
                      Reached
                    </Pill>
                  ) : null}
                </div>
                <p className="m-0 mt-0.5 text-sm text-muted">{o.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </CardBody>
    </Card>
  )
}

function Options({ v }: { v: PreRedevelopmentView }) {
  const save = useSave(v.id)
  const [editing, setEditing] = useState<OptionView | 'new' | null>(null)
  const remove = (o: OptionView) => {
    const r = act.removeRetentionOption(v.id, o.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not remove the option.')
    toast.success(`${o.label} removed`, { action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <Card data-testid="audit-options">
      <CardHeader
        icon={Building2}
        title="Carbon options"
        description={v.isCity ? 'Compare options at different levels of intervention, from keeping the building to a new build, on upfront and whole life carbon.' : 'Compare at least two options, with their upfront and whole life carbon where known.'}
        actions={
          v.editable ? (
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
                  {v.editable ? <TH className="w-24">Actions</TH> : null}
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
                    {v.editable ? (
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
                    {v.editable ? (
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
            {v.isCity ? <p className="m-0 text-sm text-muted">{v.retrofitRuleText}</p> : null}
          </>
        )}
        {v.options.length > 0 ? (
          <div className="grid gap-4 border-t border-line-soft pt-4 md:grid-cols-2">
            {v.editable ? (
              <Field label="Preferred option" id="preferred-option">
                <Select id="preferred-option" data-testid="preferred-option" value={v.preferredOptionId ?? ''} placeholder="Not chosen" options={v.options.map((o) => ({ value: o.id, label: o.label }))} onChange={(e) => save({ preferredOptionId: e.target.value || null })} />
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
              v.editable ? (
                <SavedTextarea
                  className="md:col-span-2"
                  label="Why this option"
                  hint="The preferred option keeps less than another option, or is not the lowest whole life carbon. Say why, in at least a sentence."
                  value={v.justification}
                  onSave={(t) => save({ justification: t })}
                  testId="audit-justification"
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
      {editing ? <OptionDialog v={v} option={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /> : null}
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

function OptionDialog({ v, option, onClose }: { v: PreRedevelopmentView; option: OptionView | null; onClose: () => void }) {
  const [d, setD] = useState<OptionDraft>(() => optionDraft(option?.raw ?? null))
  const set = (patch: Partial<OptionDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const r = act.saveRetentionOption(v.id, optionInput(d))
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
      {v.isCity ? (
        <Callout tone="info" className="mt-4">
          {v.retrofitRuleText}
        </Callout>
      ) : null}
    </Dialog>
  )
}

function FollowOn({ v }: { v: PreRedevelopmentView }) {
  const save = useSave(v.id)
  const chosen = v.followOn.filter((f) => f.checked).map((f) => f.label)
  return (
    <Card data-testid="audit-follow-on">
      <CardHeader title="Follow-on assessments" description="What the design team still needs before the decision is final." />
      <CardBody>
        {v.editable ? (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {v.followOn.map((f) => (
              <li key={f.label}>
                <Checkbox label={f.label} checked={f.checked} onCheckedChange={(c) => save({ followOn: c ? [...chosen, f.label] : chosen.filter((x) => x !== f.label) })} />
              </li>
            ))}
          </ul>
        ) : chosen.length > 0 ? (
          <p className="m-0 text-base text-ink">{chosen.join(', ')}</p>
        ) : (
          <p className="m-0 text-base text-muted">None listed.</p>
        )}
      </CardBody>
    </Card>
  )
}
