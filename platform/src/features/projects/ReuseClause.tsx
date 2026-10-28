// A reuse clause in the specification (round 3, BRIEF section 15.7): the FCRBE factsheet 12 structure, generated from
// the family's guides until the architect writes their own. The architect edits; the client reads.
import { useState } from 'react'
import { ChevronDown, Recycle } from 'lucide-react'
import { act } from '../../store'
import type { ClauseRow } from '../../domain/engines/procurement'
import type { SpecClauseField, SupplyRoute } from '../../domain/procurementTypes'
import { ROUTE_LABELS, SUPPLY_ROUTE_ORDER } from '../../domain/reference/procurement'
import { cx, Field, Pill, Select, toast } from '../../ui'
import { SavedInput, SavedTextarea } from '../audits/fields'

const EDITABLE: SpecClauseField[] = ['location', 'tolerances', 'patina', 'operations', 'acceptance', 'fallback']

export function ReuseClause({ projectId, publicId, rows, canEdit }: { projectId: string; publicId: string; rows: ClauseRow[]; canEdit: boolean }) {
  const [editing, setEditing] = useState(false)
  const save = (edit: Parameters<typeof act.editSpecClause>[2]) => {
    const r = act.editSpecClause(projectId, publicId, edit)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
  const routeRow = rows.find((r) => r.field === 'route')!
  const surplusRow = rows.find((r) => r.field === 'surplus')!
  return (
    <section className="mt-4 rounded-lg border border-line-soft bg-page/50 p-4 print:border-0 print:bg-transparent print:p-0" data-testid={`reuse-clause-${publicId}`} aria-label="Reuse clause">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="m-0 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-faint">
          <Recycle aria-hidden="true" className="size-3.5" />
          Reuse clause
        </h4>
        {canEdit ? (
          <button type="button" aria-expanded={editing} onClick={() => setEditing(!editing)} className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium text-ink-soft hover:text-ink sm:min-h-0 print:hidden" data-testid={`reuse-edit-${publicId}`}>
            {editing ? 'Done' : 'Edit'}
            <ChevronDown aria-hidden="true" className={cx('size-4 transition-transform', editing && 'rotate-180')} />
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 print:hidden">
          <Field label="Supply route" id={`route-${publicId}`} hint={routeRow.edited ? 'Set for this clause.' : "The client's route, or free issue once reserved."}>
            <Select
              id={`route-${publicId}`}
              value={routeRow.edited ? (SUPPLY_ROUTE_ORDER.find((r) => ROUTE_LABELS[r] === routeRow.value) ?? '') : ''}
              placeholder={`As the pack says: ${routeRow.value}`}
              options={SUPPLY_ROUTE_ORDER.map((r) => ({ value: r, label: ROUTE_LABELS[r] }))}
              onChange={(e) => save({ field: 'route', route: (e.target.value || null) as SupplyRoute | null })}
              data-testid={`reuse-route-${publicId}`}
            />
          </Field>
          <SavedInput
            label="Surplus for repairs"
            value={surplusRow.edited ? surplusRow.value.replace(/% over the quantity needed$/, '') : ''}
            placeholder={surplusRow.value}
            hint="Percent over the quantity needed. Clear it for the family's figure."
            inputMode="decimal"
            onSave={(t) => save({ field: 'surplusShare', share: t.trim() === '' ? null : Number(t) / 100 })}
            testId={`reuse-surplus-${publicId}`}
          />
          {EDITABLE.map((field) => {
            const row = rows.find((r) => r.field === field)!
            return (
              <SavedTextarea
                key={field}
                label={row.label}
                value={row.edited ? row.value : ''}
                placeholder={row.value}
                hint={row.edited ? 'Your text. Clear it to go back to the generated text.' : 'Generated from the family guides.'}
                rows={2}
                onSave={(t) => save({ field, text: t })}
                testId={`reuse-${field}-${publicId}`}
                className={field === 'acceptance' ? 'sm:col-span-2' : undefined}
              />
            )
          })}
        </div>
      ) : (
        <dl className="m-0 mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.field} className={cx('min-w-0', r.field === 'acceptance' && 'sm:col-span-2')}>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                {r.label}
                {r.edited ? (
                  <Pill size="sm" tone="info" className="print:hidden">
                    Edited
                  </Pill>
                ) : null}
              </dt>
              <dd className="m-0 text-sm text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
