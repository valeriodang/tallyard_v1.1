// The deconstruction contractor's Method tab (round 3): how each item comes out, how easily, and how it is protected.
// The surveyor's recoverability grade is the starting point. Breaking an item out means it cannot be reused whole.
import { useParams } from 'react-router'
import { PackageOpen, TriangleAlert, Wrench } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { MethodRow } from '../../store/selectors/contractorWork'
import type { DismantlingMethod } from '../../domain/contractorTypes'
import { Card, Callout, EmptyState, Field, Pill, Select, toast } from '../../ui'
import { SavedInput } from '../audits/fields'

const SCORES = ['0', '1', '2', '3', '4'].map((x) => ({ value: x, label: `${x} of 4` }))

export function Method() {
  const { buildingId = '' } = useParams()
  const v = useView(selectors.methodView, buildingId)
  if (!v) return null
  return (
    <div className="flex flex-col gap-6" data-testid="method">
      <div className="flex flex-col gap-2">
        <p className="m-0 max-w-2xl text-base text-ink-soft">Say how each item comes out and how easily. The owner reads it on each item, and it tells buyers what to expect of the condition.</p>
        <p className="m-0 text-sm text-muted" data-testid="method-count">
          Method chosen for {v.recorded} of {v.rows.length} items
        </p>
      </div>
      {v.breaking > 0 ? (
        <Callout tone="warning" icon={TriangleAlert}>
          {v.breaking === 1 ? 'One item is' : `${v.breaking} items are`} set to be broken out, so {v.breaking === 1 ? 'it' : 'they'} cannot be reused whole. Check whether another method would keep {v.breaking === 1 ? 'it' : 'them'} whole.
        </Callout>
      ) : null}
      {v.empty ? (
        <EmptyState variant="page" icon={PackageOpen} title="No items captured yet" text="Items appear here as the surveyor captures them." />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {v.rows.map((r) => (
            <li key={r.itemId}>
              <MethodCard buildingId={buildingId} r={r} methodOptions={v.methodOptions} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MethodCard({ buildingId, r, methodOptions }: { buildingId: string; r: MethodRow; methodOptions: { value: DismantlingMethod; label: string }[] }) {
  const save = (patch: Partial<{ method: DismantlingMethod | null; extractability: number | null; protection: string; note: string }>) => {
    const x = act.setItemMethod(buildingId, r.itemId, { method: r.method, extractability: r.extractability, protection: r.protection, note: r.note, ...patch })
    if (!x.ok) toast.error(x.error ?? 'Could not save.')
    return x.ok
  }
  return (
    <Card padding="md" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]" data-testid={`method-${r.tag}`}>
      <div className="min-w-0">
        <p className="m-0 flex flex-wrap items-center gap-2 text-base font-medium text-ink">
          <span className="text-sm tabular-nums text-muted">{r.tag}</span>
          {r.title}
          {r.breaks ? (
            <Pill tone="warning" size="sm">
              Not kept whole
            </Pill>
          ) : null}
        </p>
        <p className="m-0 mt-0.5 text-sm text-muted">
          {r.quantityText}
          {r.location ? `, ${r.location}` : ''}
        </p>
        <p className="m-0 mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <Wrench aria-hidden="true" className="size-3.5 shrink-0 text-faint" />
          {r.recoverabilityText}
        </p>
        {r.updatedText ? <p className="m-0 mt-1 text-xs text-muted">Saved {r.updatedText}</p> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Method" id={`method-select-${r.tag}`}>
          <Select id={`method-select-${r.tag}`} data-testid={`method-select-${r.tag}`} value={r.method ?? ''} placeholder="Not chosen" options={methodOptions} onChange={(e) => save({ method: (e.target.value || null) as DismantlingMethod | null })} />
        </Field>
        <Field label="Extractability" id={`method-score-${r.tag}`} hint="0 cannot come out whole, 4 comes out easily.">
          <Select id={`method-score-${r.tag}`} data-testid={`method-score-${r.tag}`} value={r.extractability === null ? '' : String(r.extractability)} placeholder="Not scored" options={SCORES} onChange={(e) => save({ extractability: e.target.value === '' ? null : Number(e.target.value) })} />
        </Field>
        <SavedInput label="Protection" value={r.protection} onSave={(t) => save({ protection: t })} testId={`method-protection-${r.tag}`} placeholder="For example, edge protection and timber bearers" />
        <SavedInput label="Notes" value={r.note} onSave={(t) => save({ note: t })} testId={`method-note-${r.tag}`} />
      </div>
    </Card>
  )
}
