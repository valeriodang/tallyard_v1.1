// The provenance pack of a reserved lot (round 3): released to the client organisation once the seller has accepted
// the reservation. It names the donor building, which the CEN technical specification needs in the test record, and
// holds the steel record, the grading, the custody events and the documents. Prints on A4.
import { Link, useParams } from 'react-router'
import { ChevronLeft, FileBadge, Printer } from 'lucide-react'
import { selectors, useView } from '../../store'
import { Button, Card, CardBody, CardHeader, DescriptionList } from '../../ui'

export function ProvenancePack() {
  const { projectId = '', reservationId = '' } = useParams()
  const v = useView(selectors.provenancePackView, projectId, reservationId)
  if (!v) return null
  const list = (items: { label: string; value: string }[]) => <DescriptionList layout="grid" columns={2} items={items.map((x) => ({ label: x.label, value: x.value }))} />
  return (
    <div className="flex flex-col gap-6" data-testid="provenance-pack">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/app/projects/${projectId}/reservations`} className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm font-medium text-ink-soft hover:text-ink">
          <ChevronLeft aria-hidden="true" className="size-4" />
          Reservations
        </Link>
        <Button icon={Printer} onClick={() => window.print()} data-testid="print-pack">
          Print
        </Button>
      </div>
      <div>
        <p className="m-0 flex items-center gap-2 text-sm text-muted">
          <FileBadge aria-hidden="true" className="size-4" />
          Provenance pack, {v.publicId}
        </p>
        <h2 className="m-0 mt-1 text-lg font-semibold text-ink">{v.title}</h2>
        <p className="m-0 mt-1 text-sm text-ink-soft">From {v.sellerOrg}. Released to your organisation because the seller accepted your reservation.</p>
      </div>
      <Card>
        <CardHeader title="Identity" />
        <CardBody>{list(v.identity)}</CardBody>
      </Card>
      <Card>
        <CardHeader title="Donor building" description="The CEN technical specification asks for the donor's location in the test record." />
        <CardBody data-testid="pack-donor">{list(v.donor)}</CardBody>
      </Card>
      {v.steel ? (
        <Card>
          <CardHeader title="Steel record" />
          <CardBody data-testid="pack-steel">{list(v.steel)}</CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader title="Grading and handling" />
        <CardBody>{list(v.grading)}</CardBody>
      </Card>
      <Card>
        <CardHeader title="Custody" description="What happened to it, in order." />
        <CardBody>
          <ol className="m-0 flex list-none flex-col gap-2 p-0" data-testid="pack-events">
            {v.events.map((e, i) => (
              <li key={`${e.at}${i}`} className="grid gap-x-4 text-sm sm:grid-cols-[160px_minmax(0,1fr)]">
                <span className="tabular-nums text-muted">{e.dateText}</span>
                <span className="text-ink">{e.text}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Documents" />
        <CardBody>{v.documents.length === 0 ? <p className="m-0 text-sm text-muted">No documents recorded yet. Ask the seller for them.</p> : list(v.documents)}</CardBody>
      </Card>
    </div>
  )
}
