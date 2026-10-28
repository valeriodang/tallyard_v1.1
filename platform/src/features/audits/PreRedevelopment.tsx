// The pre-redevelopment audit: the six factors that decide whether the building can be kept, the GLA decision tree
// for existing buildings, and the carbon options appraisal the City of London asks for.
import { GitBranch, Scale } from 'lucide-react'
import { act } from '../../store'
import type { PreRedevelopmentView } from '../../store/selectors/audits'
import type { RetentionFactorId, RetentionScale } from '../../domain/auditTypes'
import { Card, CardBody, CardHeader, Checkbox, Field, Pill, SegmentedControl, Select, cx, toast } from '../../ui'
import { SavedTextarea } from './fields'
import { CarbonOptions, type CarbonOptionsHandlers } from './CarbonOptions'

type Patch = Parameters<typeof act.saveAudit>[1]

function useSave(id: string) {
  return (patch: Patch) => {
    const r = act.saveAudit(id, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
}

function useOptionHandlers(id: string): CarbonOptionsHandlers {
  const save = useSave(id)
  return {
    save: (input) => act.saveRetentionOption(id, input),
    remove: (o) => {
      const r = act.removeRetentionOption(id, o.id)
      if (!r.ok) return void toast.error(r.error ?? 'Could not remove the option.')
      toast.success(`${o.label} removed`, { action: { label: 'Undo', onClick: r.undo } })
    },
    setPreferred: (preferredOptionId) => void save({ preferredOptionId }),
    saveJustification: (justification) => save({ justification }),
  }
}

export function PreRedevelopment({ v }: { v: PreRedevelopmentView }) {
  const handlers = useOptionHandlers(v.id)
  return (
    <>
      <Factors v={v} />
      <Tree v={v} />
      <CarbonOptions v={v} editable={v.editable} isCity={v.isCity} handlers={handlers} />
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
