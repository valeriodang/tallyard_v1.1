// The certification calculators under each scheme's credits (round 3, BRIEF section 15.7): LEED v5 interiors MRc1 and
// MRc5, BREEAM Wst 01 from the waste estimates in Statement inputs, and the WELL X01 to X03 screen of the project's
// reclaimed items. Indicative inputs for an assessor, never an assessment.
import { Link } from 'react-router'
import { Calculator, ShieldAlert } from 'lucide-react'
import { act } from '../../store'
import type { CertCalcs, LeedCalcView, WellView, Wst01View } from '../../store/selectors/certCalcs'
import { amountFromText, shareFromPercentText } from '../../domain/input'
import { Card, CardBody, CardHeader, cx, EmptyState, IndicativeMarker, Pill, toast } from '../../ui'
import { SavedInput } from '../audits/fields'

function report(r: { ok: boolean; error: string | null }) {
  if (!r.ok) toast.error(r.error ?? 'Could not save.')
  return r.ok
}

function Figure({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 font-semibold text-ink" data-testid={testId}>
        {value}
      </dd>
    </div>
  )
}

function InputsLink({ projectId }: { projectId: string }) {
  return (
    <Link to={`/app/projects/${projectId}/ces`} className="inline-flex min-h-11 items-center rounded-sm text-sm text-brand-700 hover:underline sm:min-h-0">
      Waste estimates in Statement inputs
    </Link>
  )
}

export function SchemeCalcs({ projectId, calcs }: { projectId: string; calcs: CertCalcs }) {
  if (calcs.leed) return <Leed projectId={projectId} v={calcs.leed} />
  if (calcs.breeam) return <Wst01 projectId={projectId} v={calcs.breeam} />
  if (calcs.well) return <Well v={calcs.well} />
  return null
}

function Leed({ projectId, v }: { projectId: string; v: LeedCalcView }) {
  const save = (patch: Parameters<typeof act.saveLeedInputs>[1]) => report(act.saveLeedInputs(projectId, patch))
  return (
    <>
      <Card data-testid="calc-mrc1">
        <CardHeader icon={Calculator} title="MRc1 interior materials reuse" description="Option 1 by cost, pricing reused elements as new; option 2 by the share of each material type reused from off site. Up to 4 points." actions={<IndicativeMarker />} />
        <CardBody className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <SavedInput label="Reused on site (£)" value={v.inputs.onsiteReused} inputMode="decimal" onSave={(x) => save({ onsiteReused: amountFromText(x) })} testId="mrc1-onsite-reused" />
            <SavedInput label="All interiors and furniture (£)" value={v.inputs.onsiteTotal} inputMode="decimal" onSave={(x) => save({ onsiteTotal: amountFromText(x) })} testId="mrc1-onsite-total" />
            <SavedInput label="Furniture reused (£)" value={v.inputs.furnitureReused} inputMode="decimal" onSave={(x) => save({ furnitureReused: amountFromText(x) })} testId="mrc1-furniture-reused" />
            <SavedInput label="All furniture (£)" value={v.inputs.furnitureTotal} inputMode="decimal" onSave={(x) => save({ furnitureTotal: amountFromText(x) })} testId="mrc1-furniture-total" />
          </div>
          <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Figure label="On site, by cost" value={`${v.mrc1.onsiteShareText}, ${v.mrc1.onsitePointsText}`} />
            <Figure label="Furniture, by cost" value={`${v.mrc1.furnitureShareText}, ${v.mrc1.furniturePointsText}`} />
            <Figure label="Off site, option 2" value={v.mrc1.option2Text} />
            <Figure label="MRc1" value={v.mrc1.pointsText} testId="mrc1-points" />
          </dl>
          <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
            <p className="m-0 text-sm font-medium text-ink-soft">Reused from off site, by material type (%)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {v.offsite.map((t) => (
                <SavedInput
                  key={t.type}
                  label={
                    <span className="flex flex-wrap items-center gap-1.5">
                      {t.label}
                      {t.targeted ? (
                        <Pill size="sm" tone="brand">
                          Targeted
                        </Pill>
                      ) : null}
                    </span>
                  }
                  hint={t.onProjectText ?? undefined}
                  value={t.share}
                  inputMode="decimal"
                  onSave={(x) => save({ offsite: { [t.type]: shareFromPercentText(x) ?? 0 } })}
                  testId={`mrc1-offsite-${t.type}`}
                />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
      <Card data-testid="calc-mrc5">
        <CardHeader icon={Calculator} title="MRc5 construction and demolition waste diversion" description="From the demolition and construction estimates. Salvage counts twice; reuse on site belongs to MRc1; unverified mixed recovery counts at no more than 35%." actions={<IndicativeMarker />} />
        <CardBody className="flex flex-col gap-5">
          {!v.mrc5.hasEstimates ? <EmptyState icon={Calculator} title="No waste estimates yet" text="Add the demolition and construction estimates in Statement inputs." action={<InputsLink projectId={projectId} />} /> : null}
          <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <SavedInput label="Recycling source-separated (%)" value={v.inputs.separatedShare} inputMode="decimal" hint="The rest goes to a mixed facility." onSave={(x) => save({ separatedShare: shareFromPercentText(x) })} testId="mrc5-separated" />
            <SavedInput label="Mixed facility rate (%)" value={v.inputs.mixedRate} inputMode="decimal" hint="Verified by a third party; blank takes 35%." onSave={(x) => save({ mixedRate: shareFromPercentText(x) })} testId="mrc5-mixed-rate" />
            <SavedInput label="Gypsum, carpet, ceilings and furniture (t)" value={v.inputs.targetedT} inputMode="decimal" hint="Salvaged or source-separated, for path 4." onSave={(x) => save({ targetedT: amountFromText(x) })} testId="mrc5-targeted" />
          </div>
          {v.mrc5.hasEstimates ? (
            <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Figure label="Waste counted" value={v.mrc5.totalText} />
              <Figure label="Salvaged" value={v.mrc5.salvagedText} />
              <Figure label="Recycled" value={v.mrc5.recycledText} />
              <Figure label="Mixed facility rate" value={v.mrc5.mixedRateText} />
              <Figure label="Diversion rate" value={v.mrc5.rateText} testId="mrc5-rate" />
              <Figure label="Salvaged or separated, of diverted" value={v.mrc5.separatedShareText} />
              <Figure label="Targeted materials" value={v.mrc5.targetedShareText} />
              <Figure label="MRc5" value={v.mrc5.pointsText} testId="mrc5-points" />
            </dl>
          ) : null}
        </CardBody>
      </Card>
    </>
  )
}

function Wst01({ projectId, v }: { projectId: string; v: Wst01View }) {
  return (
    <Card data-testid="calc-wst01">
      <CardHeader icon={Calculator} title="Wst 01 construction waste management" description="Construction waste per m2 GIA against the guidance's Appendix 4 bands, and diversion from landfill." actions={<IndicativeMarker />} />
      <CardBody className="flex flex-col gap-4">
        {!v.hasEstimate && v.diversion.every((d) => d.met === null) ? (
          <EmptyState icon={Calculator} title="No waste estimates yet" text="Add the construction and demolition streams in Statement inputs." action={<InputsLink projectId={projectId} />} />
        ) : (
          <>
            <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Figure label="Construction waste" value={v.tPerM2Text} testId="wst01-intensity" />
              <Figure label="Band reached" value={v.creditsText} testId="wst01-credits" />
              {v.nextText ? <Figure label="Next band" value={v.nextText} /> : null}
            </dl>
            <ul className="m-0 flex list-none flex-col gap-1.5 border-t border-line-soft p-0 pt-4">
              {v.diversion.map((d) => (
                <li key={d.label} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink">{d.label}</span>
                  <span className={cx(d.met === false ? 'font-medium text-warning' : 'text-ink-soft')}>
                    {d.valueText}, {d.needText}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  )
}

function Well({ v }: { v: WellView }) {
  return (
    <Card data-testid="calc-well">
      <CardHeader icon={ShieldAlert} title="Hazardous materials screen" description={`WELL X01 to X03 for each reclaimed item, from its family, its era and the hazards its listing confirms. ${v.confirmed} confirmed, ${v.toCheck} to check.`} actions={<IndicativeMarker />} />
      <CardBody>
        {v.rows.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No reclaimed materials yet" text="Items appear here once the client approves or reserves them." />
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.rows.map((r) => (
              <li key={r.publicId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0" data-testid={`well-${r.publicId}`}>
                <p className="m-0 text-sm font-medium text-ink">
                  {r.description} <span className="font-normal text-muted">{r.publicId}</span>
                </p>
                {r.checks.length === 0 ? (
                  <p className="m-0 text-sm text-muted">No X01 to X03 check applies.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {r.checks.map((c, i) => (
                      <li key={i} className="flex flex-col items-start gap-1 text-sm sm:flex-row sm:gap-2">
                        <Pill size="sm" tone={c.status === 'confirmed' ? 'danger' : 'warning'}>
                          {c.label}
                        </Pill>
                        <span className="min-w-0 flex-1 text-ink-soft">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
