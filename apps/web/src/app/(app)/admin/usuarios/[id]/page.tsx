import { serverApi } from "@/lib/server-api";
import { Badge, Card, Button } from "@obracerta/ui";
import type { User, ReputationSummary } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import { BackLink } from "../../../_shell/BackLink";

export default async function AdminUsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, rolesData, reputation] = await Promise.all([
    serverApi<User>("GET", `/admin/users/${id}`),
    serverApi<{roles: string[]}>("GET", `/admin/users/${id}/roles`).catch(() => ({ roles: [] })),
    serverApi<ReputationSummary>("GET", `/reputation/${id}`).catch(() => null),
  ]);

  return (
    <section aria-labelledby="admin-usuario-detalhe-heading" className="space-y-6">
      <header className="flex flex-col gap-4">
        <BackLink href="/admin/usuarios" label="Voltar para usuários" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="admin-usuario-detalhe-heading" className="font-display text-3xl font-black text-foreground">
              Detalhes do Usuário
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">
              ID: {user.id}
            </p>
          </div>
          <Badge tone={user.status === "ATIVO" ? "success" : "danger"} className="w-fit">
            {user.status}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Informações Básicas</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium text-foreground">{user.nomeCompleto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <Badge tone="neutral">{user.tipo}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium text-foreground">{user.whatsapp}</span>
            </div>
            {user.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cadastrado em</span>
              <span className="font-medium text-foreground">{formatDateTimeBR(user.criadoEm)}</span>
            </div>
          </div>
        </Card>

        {reputation && (
          <Card className="space-y-4">
            <h2 className="font-display text-xl font-bold border-b border-border pb-2">Reputação Pública</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nota Média</span>
                <span className="font-medium text-warning text-lg">
                  {reputation.mediaNota != null ? `${reputation.mediaNota.toFixed(1)} ⭐` : "Sem avaliações"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Avaliações</span>
                <span className="font-medium text-foreground">{reputation.totalAvaliacoes}</span>
              </div>
            </div>
          </Card>
        )}

        {rolesData.roles.length > 0 && (
          <Card className="space-y-4">
            <h2 className="font-display text-xl font-bold border-b border-border pb-2">Papéis no Sistema</h2>
            <div className="flex flex-wrap gap-2">
              {rolesData.roles.map(role => (
                <Badge key={role} tone={role === "ADMIN" ? "danger" : "primary"}>
                  {role}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Ações de Moderação</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ações sensíveis relativas ao controle e moderação da conta deste usuário.
            Concessão de papéis disponível na fila de moderação.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              disabled
              title="Em breve"
              className="w-full justify-start text-danger border-danger/20"
            >
              Suspender Usuário
            </Button>
            <Button variant="secondary" disabled title="Em breve" className="w-full justify-start">
              Editar Papéis (Roles)
            </Button>
            <Button variant="secondary" disabled title="Em breve" className="w-full justify-start">
              Ver Histórico de Auditoria
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
