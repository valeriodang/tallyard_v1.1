// Deal terms on a reservation (round 3, stage 5): the client's picker in the request dialog, and the terms as either
// side reads them. Every figure comes from the store; the rates are placeholders.
import { EyeOff, Handshake } from 'lucide-react'
import type { DealModel, DealTerms, StoragePayer } from '../../domain/dealTypes'
import type { TermsView } from '../../store/selectors/deals'
import { selectors, useView } from '../../store'
import * as f from '../../domain/format'
import { Callout, Checkbox, Field, IndicativeMarker, Input, RadioCards, Select } from '../../ui'

/** The client chooses the deal model and its terms; the store costs them and shows what the seller will read. */
export function TermsPicker({ projectId, wishItemId, value, onChange }: { projectId: string; wishItemId: string; value: DealTerms | null; onChange: (t: DealTerms) => void }) {
  const d = useView(selectors.termsDraftView, projectId, wishItemId, value)
  if (!d) return null
  const t = d.terms
  const set = (patch: Partial<DealTerms>) => onChange({ ...t, ...patch })
  return (
    <div className="flex flex-col gap-4" data-testid="terms-picker">
      <Field label="Deal model" id="terms-model">
        <RadioCards
          id="terms-model"
          columns={2}
          value={t.model}
          onValueChange={(m) => onChange({ ...d.defaults[m as DealModel] })}
          options={d.models.map((m) => ({ value: m.value, label: m.label, description: m.disabled ? 'For material not yet out of the building' : m.text, disabled: m.disabled }))}
          data-testid="terms-model"
        />
      </Field>
      <dl className="m-0 grid gap-2 rounded-lg border border-line-soft bg-page/60 px-3.5 py-3 text-sm sm:grid-cols-3">
        {d.modelRows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-xs text-muted">{r.label}</dt>
            <dd className="m-0 text-ink-soft">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Deposit" id="terms-deposit">
          <Select id="terms-deposit" value={String(t.depositShare)} options={d.depositOptions} onChange={(e) => set({ depositShare: Number(e.target.value) })} data-testid="terms-deposit" />
        </Field>
        <Field label="Storage bridge" id="terms-bridge" hint={`Months, up to ${d.maxBridge}.`}>
          <Input id="terms-bridge" type="number" inputMode="numeric" min={0} max={d.maxBridge} step={1} value={String(t.bridgeMonths)} onChange={(e) => set({ bridgeMonths: e.target.value === '' ? 0 : Number(e.target.value) })} data-testid="terms-bridge" />
        </Field>
        <Field label="Storage" id="terms-payer">
          <Select id="terms-payer" value={t.storagePayer} options={d.payerOptions} onChange={(e) => set({ storagePayer: e.target.value as StoragePayer })} data-testid="terms-payer" />
        </Field>
      </div>
      <p className="m-0 -mt-1 text-sm text-muted">
        {d.fitText}
        {d.bridgeShortText ? <span className="font-medium text-warning"> {d.bridgeShortText}</span> : null}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Checkbox label="Price lock" description="The price holds from acceptance to delivery." checked={t.priceLock} onCheckedChange={(c) => set({ priceLock: c === true })} data-testid="terms-price-lock" />
        <Checkbox label="Design-change clause" description="Release the lot if the design changes; the seller keeps part of the deposit." checked={t.designChange} onCheckedChange={(c) => set({ designChange: c === true })} data-testid="terms-design-change" />
        <Checkbox label="Buy-back" description="The seller buys back what the project does not use." checked={t.buyBack} onCheckedChange={(c) => set({ buyBack: c === true })} data-testid="terms-buy-back" />
        <Checkbox label="Guarantee" description="The seller guarantees the stated properties, for a fee." checked={t.guarantee} onCheckedChange={(c) => set({ guarantee: c === true })} data-testid="terms-guarantee" />
      </div>
      {d.error ? (
        <Callout tone="danger" role="alert">
          {d.error}
        </Callout>
      ) : (
        <>
          <CostLines lines={d.lines} />
          <div className="rounded-lg border border-line bg-subtle/60 px-3.5 py-3" data-testid="terms-seller-sees">
            <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-muted">
              <EyeOff aria-hidden="true" className="size-3.5" />
              The seller sees these terms as
            </p>
            <p className="m-0 mt-1 text-sm text-ink">{d.sellerSees.map((r) => `${r.label}: ${r.value}`).join('. ')}.</p>
          </div>
        </>
      )}
      <p className="m-0 text-xs text-muted">{d.caveat}</p>
    </div>
  )
}

function CostLines({ lines }: { lines: { label: string; amount: number }[] }) {
  return (
    <table className="w-full text-sm" data-testid="terms-lines">
      <caption className="sr-only">Cost of the terms</caption>
      <tbody>
        {lines.map((l) => (
          <tr key={l.label} className="border-b border-line-soft last:border-0">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-ink-soft">
              {l.label}
            </th>
            <td className="py-1.5 text-right tabular-nums text-ink">{f.money(l.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The terms as one side reads them: the seller banded until accepting, the client in full. */
export function TermsSummary({ terms, title, testId }: { terms: TermsView; title: string; testId?: string }) {
  return (
    <div className="mt-3 rounded-lg border border-line-soft bg-page/60 p-3.5" data-testid={testId}>
      <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
        <Handshake aria-hidden="true" className="size-4 text-faint" />
        {title}: {terms.modelLabel}
        <IndicativeMarker />
      </p>
      <dl className="m-0 mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
        {terms.rows.map((r) => (
          <div key={r.label} className="flex min-w-0 justify-between gap-3 sm:block">
            <dt className="text-xs text-muted">{r.label}</dt>
            <dd className="m-0 text-right text-ink-soft sm:text-left">{r.value}</dd>
          </div>
        ))}
      </dl>
      {terms.lines ? (
        <div className="mt-2 border-t border-line-soft pt-2">
          <CostLines lines={terms.lines} />
        </div>
      ) : null}
    </div>
  )
}
