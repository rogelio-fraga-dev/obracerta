import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ApiEnvelopeError,
  type BookingRequest,
  type BookingStatus,
  type TermsAcceptance,
  type UserType,
} from "@obracerta/shared";
import { Badge } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { AgendaIcon, ClockIcon } from "../../_shell/icons";
import { BookingStepper } from "./_components/BookingStepper";
import { BookingActions } from "./_components/BookingActions";
import { TermsCard } from "./_components/TermsCard";
import { ReviewForm } from "./_components/ReviewForm";

const OFFPATH: Partial<Record<BookingStatus, string>> = {
  RECUSADO: "Este pedido foi recusado pelo profissional.",
  EXPIRADO: "Este pedido expirou sem resposta a tempo.",
  CANCELADO: "Este pedido foi cancelado.",
};

/** Detalhe de um pedido: estado (stepper), ações por papel e termos bilaterais. */
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
  const offpath = OFFPATH[booking.status];

  return (
    <section aria-labelledby="pedido-heading" className="space-y-4">
      <BackLink href="/pedidos" label="Pedidos" />

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground">Pedido</p>
            <h1 id="pedido-heading" className="font-display text-2xl font-black text-foreground">
              {booking.especialidade}
            </h1>
          </div>
          <Badge tone={ui.tone}>{ui.label}</Badge>
        </div>

        {offpath ? (
          <div className="mt-4 rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
            {offpath}
            {booking.motivoRecusa ? ` Motivo: ${booking.motivoRecusa}.` : ""}
          </div>
        ) : (
          <BookingStepper status={booking.status} />
        )}
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <Fact icon={<AgendaIcon className="h-5 w-5" />} label="Data do serviço">
          {formatDateTimeBR(booking.dataServico)}
        </Fact>
        {booking.status === "PENDENTE" && (
          <Fact icon={<ClockIcon className="h-5 w-5" />} label="Expira em">
            {formatDateTimeBR(booking.expiraEm)}
          </Fact>
        )}
        {booking.descricao && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição</p>
            <p className="mt-1 text-sm text-foreground">{booking.descricao}</p>
          </div>
        )}
      </div>

      <BookingActions bookingId={booking.id} status={booking.status} tipo={tipo} />

      {booking.status === "CONCLUIDO" && <ReviewForm bookingId={booking.id} />}

      <TermsCard bookingId={booking.id} tipo={tipo} acceptances={acceptances} />
    </section>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 first:pt-0 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{children}</p>
      </div>
    </div>
  );
}
