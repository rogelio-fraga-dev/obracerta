import { notFound } from "next/navigation";
import {
  ApiEnvelopeError,
  type BookingContact,
  type BookingRequest,
  isBookingContactReleased,
  type JwtClaims,
  type TermsAcceptance,
  type User,
} from "@obracerta/shared";
import { config } from "@/lib/config";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../../_shell/BackLink";
import { PrintButton } from "./PrintButton";

/**
 * Resumo do serviço ("contrato" informal): documento imprimível com as partes,
 * o combinado e os aceites — **sem** a plataforma como parte. Deixa explícito
 * que somos apenas a intermediação do encontro; o contrato é direto entre as
 * partes (mesmo espírito do §7.4 dos termos de ciência).
 */
export default async function ResumoPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hint = await getProfileHint();

  let booking: BookingRequest;
  let acceptances: TermsAcceptance[];
  let me: User | null;
  try {
    [booking, acceptances, me] = await Promise.all([
      serverApi<BookingRequest>("GET", `/bookings/${id}`),
      serverApi<TermsAcceptance[]>("GET", `/terms/booking/${id}`),
      serverApi<User>("GET", "/auth/me/profile").catch(() => null),
    ]);
  } catch (e) {
    if (e instanceof ApiEnvelopeError) notFound();
    throw e;
  }

  // O resumo faz sentido com as partes conectadas (contato liberado pós-aceite).
  if (!isBookingContactReleased(booking.status)) notFound();

  let contato: BookingContact | null = null;
  let claims: JwtClaims | null = null;
  try {
    [contato, claims] = await Promise.all([
      serverApi<BookingContact>("GET", `/bookings/${booking.id}/contato`),
      serverApi<JwtClaims>("POST", "/auth/me"),
    ]);
  } catch (e) {
    if (!(e instanceof ApiEnvelopeError)) throw e;
  }

  const ui = BOOKING_STATUS_UI[booking.status];
  const souContratante = claims?.sub === booking.contractorId;
  const contratante = souContratante
    ? { nome: me?.nomeCompleto ?? hint?.nome ?? "—", whatsapp: claims?.whatsapp ?? "—" }
    : { nome: contato?.nome ?? "—", whatsapp: contato?.whatsapp ?? "—" };
  const profissional = souContratante
    ? { nome: contato?.nome ?? "—", whatsapp: contato?.whatsapp ?? "—" }
    : { nome: me?.nomeCompleto ?? hint?.nome ?? "—", whatsapp: claims?.whatsapp ?? "—" };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href={`/pedidos/${booking.id}`} label="Voltar ao pedido" />
        <PrintButton />
      </div>

      {/* Área imprimível */}
      <div className="print-area mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-background p-6 sm:p-10">
        <header className="border-b-2 border-foreground pb-4">
          <p className="text-xs font-extrabold uppercase tracking-[3px] text-muted-foreground">
            Resumo do serviço combinado
          </p>
          <h1 className="mt-1 font-display text-2xl font-black text-foreground">
            {booking.especialidade}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido nº {booking.id} · situação: {ui.label}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Contratante
            </p>
            <p className="mt-1 font-bold text-foreground">{contratante.nome}</p>
            <p className="text-sm text-muted-foreground">WhatsApp: {contratante.whatsapp}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Profissional
            </p>
            <p className="mt-1 font-bold text-foreground">{profissional.nome}</p>
            <p className="text-sm text-muted-foreground">WhatsApp: {profissional.whatsapp}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-black text-foreground">O combinado</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 font-semibold text-muted-foreground">Serviço</dt>
              <dd className="text-foreground">{booking.especialidade}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 font-semibold text-muted-foreground">Data e hora</dt>
              <dd className="text-foreground">{formatDateTimeBR(booking.dataServico)}</dd>
            </div>
            {booking.descricao && (
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-semibold text-muted-foreground">Descrição</dt>
                <dd className="whitespace-pre-line text-foreground">{booking.descricao}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 font-semibold text-muted-foreground">Pedido criado em</dt>
              <dd className="text-foreground">{formatDateTimeBR(booking.criadoEm)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Valores, materiais e condições de pagamento são combinados diretamente entre as
            partes — registre-os por escrito (ex.: no chat do pedido ou em orçamento próprio).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-black text-foreground">Termos de ciência</h2>
          {acceptances.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {acceptances.map((a) => (
                <li key={`${a.papel}-${a.aceitoEm}`} className="text-foreground">
                  ✔ {a.papel === "PROFISSIONAL" ? "Profissional" : "Contratante"} registrou ciência
                  (v{a.termoVersao}) em {formatDateTimeBR(a.aceitoEm)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum aceite registrado até agora.</p>
          )}
        </section>

        <section className="rounded-lg border-2 border-foreground/20 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-extrabold uppercase tracking-wide text-foreground">Aviso importante</p>
          <p className="mt-1">
            A plataforma {config.brand.name} atua exclusivamente como <strong>intermediadora do
            encontro</strong> entre contratante e profissional. Ela <strong>não é parte</strong> deste
            acordo, não intermedeia pagamentos, não garante a execução do serviço nem responde por
            obrigações assumidas entre as partes. O contrato de prestação de serviço é celebrado
            direta e exclusivamente entre o contratante e o profissional identificados acima, que
            respondem integralmente pelos seus termos, execução, garantias e eventuais disputas.
          </p>
          <p className="mt-2">
            Este documento é um <strong>resumo informativo</strong> gerado a partir dos registros da
            plataforma em {formatDateTimeBR(new Date().toISOString())} e não substitui contrato
            escrito entre as partes.
          </p>
        </section>

        <section className="grid gap-8 pt-6 sm:grid-cols-2">
          <div className="border-t border-foreground pt-2 text-center text-sm text-muted-foreground">
            Assinatura do contratante
          </div>
          <div className="border-t border-foreground pt-2 text-center text-sm text-muted-foreground">
            Assinatura do profissional
          </div>
        </section>
      </div>
    </section>
  );
}
