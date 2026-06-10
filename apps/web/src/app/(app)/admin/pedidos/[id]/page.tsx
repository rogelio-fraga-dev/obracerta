import { serverApi } from "@/lib/server-api";
import { Badge, Card } from "@obracerta/ui";
import type { BookingRequest, User } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import { BOOKING_STATUS_UI } from "@/lib/booking-ui";
import Link from "next/link";
import { BackLink } from "../../../_shell/BackLink";

export default async function AdminPedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await serverApi<BookingRequest>("GET", `/admin/bookings/${id}`);
  const contratante = await serverApi<User>("GET", `/admin/users/${pedido.contractorId}`).catch(() => null);
  const profissional = await serverApi<User>("GET", `/admin/users/${pedido.professionalId}`).catch(() => null);

  return (
    <section aria-labelledby="admin-pedido-detalhe-heading" className="space-y-6">
      <header className="flex flex-col gap-4">
        <BackLink href="/admin/pedidos" label="Voltar para pedidos" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="admin-pedido-detalhe-heading" className="font-display text-3xl font-black text-foreground">
              Detalhes do Pedido
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">
              ID: {pedido.id}
            </p>
          </div>
          <Badge tone={BOOKING_STATUS_UI[pedido.status].tone} className="w-fit text-lg py-1 px-3">
            {BOOKING_STATUS_UI[pedido.status].label}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Partes Envolvidas</h2>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1 block">Contratante</span>
              <Link href={`/admin/usuarios/${pedido.contractorId}`} className="font-medium text-primary hover:underline block truncate">
                {contratante ? contratante.nomeCompleto : pedido.contractorId}
              </Link>
              {contratante && <p className="text-xs text-muted-foreground mt-1">{contratante.email}</p>}
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1 block">Profissional</span>
              <Link href={`/admin/usuarios/${pedido.professionalId}`} className="font-medium text-primary hover:underline block truncate">
                {profissional ? profissional.nomeCompleto : pedido.professionalId}
              </Link>
              {profissional && <p className="text-xs text-muted-foreground mt-1">{profissional.email}</p>}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Detalhes do Serviço</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Especialidade</span>
              <Badge tone="neutral">{pedido.especialidade}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Data Agendada</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="text-muted-foreground">&#128197;</span> {formatDateTimeBR(pedido.dataServico)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Criado em</span>
              <span className="font-medium text-foreground">{formatDateTimeBR(pedido.criadoEm)}</span>
            </div>
            {pedido.motivoRecusa && (
              <div className="mt-4 p-3 bg-danger/10 text-danger-foreground border border-danger/20 rounded-lg">
                <span className="font-bold text-xs uppercase block mb-1">Motivo da Recusa</span>
                {pedido.motivoRecusa}
              </div>
            )}
          </div>
        </Card>

        <Card className="md:col-span-2 space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Descrição do Serviço</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
            {pedido.descricao || "Nenhuma descrição detalhada fornecida para este agendamento."}
          </div>
        </Card>
      </div>
    </section>
  );
}
