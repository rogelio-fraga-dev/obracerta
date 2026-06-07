import { notFound } from "next/navigation";
import type { BookingRequest, TermsAcceptance, UserType } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { ApiEnvelopeError } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BookingActions } from "./_components/BookingActions";
import { TermsCard } from "./_components/TermsCard";

/** Detalhe de um pedido: estado, ações (por papel) e aceite de termos bilateral. */
export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hint = await getProfileHint();
  const tipo: UserType = hint?.tipo ?? "CONTRATANTE";

  let booking: BookingRequest;
  let acceptances: TermsAcceptance[];
  try {
    [booking, acceptances] = await Promise.all([
      serverApi<BookingRequest>("GET", `/bookings/${id}`),
      serverApi<TermsAcceptance[]>("GET", `/terms/booking/${id}`),
    ]);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) notFound();
    throw e;
  }

  const ui = BOOKING_STATUS_UI[booking.status];

  return (
    <section aria-labelledby="pedido-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 id="pedido-heading" className="font-display text-2xl font-black text-foreground">
          {booking.especialidade}
        </h1>
        <Badge tone={ui.tone}>{ui.label}</Badge>
      </div>

      <Card className="space-y-2 text-sm">
        <Row label="Quando" value={formatDateTimeBR(booking.dataServico)} />
        {booking.descricao && <Row label="Descrição" value={booking.descricao} />}
        {booking.status === "PENDENTE" && (
          <Row label="Expira em" value={formatDateTimeBR(booking.expiraEm)} />
        )}
        {booking.status === "RECUSADO" && booking.motivoRecusa && (
          <Row label="Motivo da recusa" value={booking.motivoRecusa} />
        )}
      </Card>

      <BookingActions bookingId={booking.id} status={booking.status} tipo={tipo} />

      <TermsCard bookingId={booking.id} tipo={tipo} acceptances={acceptances} />
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
