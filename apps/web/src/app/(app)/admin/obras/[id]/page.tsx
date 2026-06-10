import { serverApi } from "@/lib/server-api";
import { Badge, Card, Button } from "@obracerta/ui";
import { formatCentavos } from "@obracerta/shared";
import type { WorkOrder, User } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import Link from "next/link";
import { BackLink } from "../../../_shell/BackLink";

export default async function AdminObraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const obra = await serverApi<WorkOrder>("GET", `/admin/work-orders/${id}`);
  const contratante = await serverApi<User>("GET", `/admin/users/${obra.contractorId}`).catch(() => null);

  return (
    <section aria-labelledby="admin-obra-detalhe-heading" className="space-y-6">
      <header className="flex flex-col gap-4">
        <BackLink href="/admin/obras" label="Voltar para obras" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="admin-obra-detalhe-heading" className="font-display text-3xl font-black text-foreground">
              {obra.titulo}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">
              ID: {obra.id}
            </p>
          </div>
          <Badge tone={obra.status === "ABERTA" ? "primary" : obra.status === "ADJUDICADA" ? "success" : "neutral"} className="w-fit text-lg py-1 px-3">
            {obra.status}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <h2 className="font-display text-xl font-bold border-b border-border pb-2">Detalhes da Obra</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {obra.descricao || "Nenhuma descrição detalhada fornecida pelo contratante."}
            </div>
            
            <div className="pt-4 mt-4 border-t border-border flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Especialidade:</span>
                <Badge tone="neutral">{obra.especialidade}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Urgência:</span>
                <Badge tone={obra.urgencia === "URGENTE" ? "danger" : "warning"}>{obra.urgencia}</Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-display text-xl font-bold border-b border-border pb-2">Informações Adicionais</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contratante</span>
                <div className="text-right">
                  <Link href={`/admin/usuarios/${obra.contractorId}`} className="font-medium text-primary hover:underline block truncate max-w-[150px]">
                    {contratante ? contratante.nomeCompleto : `${obra.contractorId.substring(0, 8)}...`}
                  </Link>
                  {contratante && <span className="text-xs text-muted-foreground">{contratante.whatsapp ?? contratante.email}</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Criada em</span>
                <span className="font-medium text-foreground">{formatDateTimeBR(obra.criadoEm)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Expira em</span>
                <span className="font-medium text-foreground">{formatDateTimeBR(obra.expiraEm)}</span>
              </div>
              {obra.pisoCentavos !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Piso de Dignidade</span>
                  <span className="font-medium text-foreground">{formatCentavos(obra.pisoCentavos)}</span>
                </div>
              )}
              {obra.bairro && (
                <div className="flex items-center justify-between text-muted-foreground pt-2">
                  <span className="text-muted-foreground">Bairro</span>
                  <span className="font-medium text-foreground">{obra.bairro}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="space-y-4 border-danger/20">
            <h2 className="font-display text-xl font-bold text-danger border-b border-danger/20 pb-2">Zona de Perigo</h2>
            <p className="text-xs text-muted-foreground">
              Ações administrativas forçadas para esta obra.
            </p>
            <Button
              variant="secondary"
              disabled
              title="Em breve"
              className="w-full text-danger border-danger/20"
            >
              Forçar Cancelamento (Takedown)
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
