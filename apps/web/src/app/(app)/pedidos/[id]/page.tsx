import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ApiEnvelopeError,
  type BookingContact,
  type BookingMessage,
  type BookingRequest,
  type BookingReviewStatus,
  type BookingStatus,
  isBookingContactReleased,
  type JwtClaims,
  type TermsAcceptance,
  type UserType,
} from "@obracerta/shared";
import { Badge } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../_shell/BackLink";
import { Fact } from "../../_shell/Fact";
import { AgendaIcon, ClockIcon } from "../../_shell/icons";
import { ChatCard } from "@/components/ChatCard";
import { BookingStepper } from "./_components/BookingStepper";
import { BookingActions } from "./_components/BookingActions";
import { RescheduleCard } from "./_components/RescheduleCard";
import { ContactCard } from "./_components/ContactCard";
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

  // Contato é double-blind: só busca quando o pedido foi aceito (§8.4/§24).
  // O chat abre na mesma janela do contato — busca o histórico + quem sou eu.
  let contato: BookingContact | null = null;
  let mensagens: BookingMessage[] | null = null;
  let meuId: string | null = null;
  // Já avaliou? Evita o ReviewForm reaparecer após enviar (e o 409 num 2º envio).
  let jaAvaliou = false;
  if (isBookingContactReleased(booking.status)) {
    // CONCLUIDO está no conjunto liberado — o status de avaliação entra no MESMO
    // Promise.all (evita um round-trip sequencial extra).
    const [contatoRes, mensagensRes, claimsRes, reviewRes] = await Promise.all([
      serverApi<BookingContact>("GET", `/bookings/${booking.id}/contato`).catch((e: unknown) => {
        if (!(e instanceof ApiEnvelopeError)) throw e;
        return null;
      }),
      serverApi<BookingMessage[]>("GET", `/bookings/${booking.id}/mensagens`).catch(
        (e: unknown) => {
          if (!(e instanceof ApiEnvelopeError)) throw e;
          return null;
        },
      ),
      serverApi<JwtClaims>("POST", "/auth/me").catch(() => null),
      booking.status === "CONCLUIDO"
        ? serverApi<BookingReviewStatus>("GET", `/reviews/booking/${booking.id}/mine`).catch(
            (e: unknown) => {
              if (!(e instanceof ApiEnvelopeError)) throw e;
              return null;
            },
          )
        : Promise.resolve(null),
    ]);
    contato = contatoRes;
    mensagens = mensagensRes;
    meuId = claimsRes?.sub ?? null;
    jaAvaliou = reviewRes?.jaAvaliou ?? false;
  }
  const outraParte = tipo === "PROFISSIONAL" ? "Cliente" : "Profissional";

  return (
    <section aria-labelledby="pedido-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href="/pedidos" label="Pedidos" />
        {isBookingContactReleased(booking.status) && (
          <Link
            href={`/pedidos/${booking.id}/resumo`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            📄 Exportar resumo do serviço
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mensagem</p>
            <p className="mt-1 text-sm text-foreground">{booking.descricao}</p>
          </div>
        )}
        {booking.fotoUrl && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto do serviço</p>
            <img
              src={booking.fotoUrl}
              alt="Foto anexada ao pedido"
              width={1200}
              height={675}
              loading="lazy"
              decoding="async"
              className="mt-2 max-h-72 w-full rounded-lg object-cover"
            />
          </div>
        )}
      </div>

      {contato && <ContactCard contato={contato} papel={outraParte} />}

      {mensagens !== null && meuId && (
        <ChatCard
          endpoint={`/api/bookings/${booking.id}/mensagens`}
          meuId={meuId}
          initialMensagens={mensagens}
          outraParte={outraParte}
        />
      )}

      {booking.status === "APROVADO" && meuId && (
        <RescheduleCard
          bookingId={booking.id}
          meuId={meuId}
          dataServico={booking.dataServico}
          reagendamentoData={booking.reagendamentoData}
          reagendamentoPor={booking.reagendamentoPor}
        />
      )}

      <BookingActions bookingId={booking.id} status={booking.status} tipo={tipo} />

      {booking.status === "CONCLUIDO" &&
        (jaAvaliou ? (
          <Badge tone="success">Avaliação enviada</Badge>
        ) : (
          <ReviewForm bookingId={booking.id} />
        ))}

      <TermsCard bookingId={booking.id} tipo={tipo} acceptances={acceptances} />
    </section>
  );
}

