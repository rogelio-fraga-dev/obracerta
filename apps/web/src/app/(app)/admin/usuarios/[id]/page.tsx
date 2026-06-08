import { serverApi } from "@/lib/server-api";
import { Badge, Card, Button } from "@obracerta/ui";
import type { User } from "@obracerta/shared";
import { formatDateTimeBR } from "@/lib/format";
import Link from "next/link";

export default async function AdminUsuarioDetalhePage({ params }: { params: { id: string } }) {
  const user = await serverApi<User>("GET", `/admin/users/${params.id}`);

  return (
    <section aria-labelledby="admin-usuario-detalhe-heading" className="space-y-6">
      <header className="flex flex-col gap-4">
        <Link href="/admin/usuarios" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors font-medium">
          <span className="text-lg">&larr;</span> Voltar para usuários
        </Link>
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

        <Card className="space-y-4">
          <h2 className="font-display text-xl font-bold border-b border-border pb-2">Ações de Moderação</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Ações sensíveis relativas ao controle e moderação da conta deste usuário.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="secondary" className="w-full justify-start text-danger border-danger/20 hover:bg-danger/10">
              Suspender Usuário
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              Editar Papéis (Roles)
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              Ver Histórico de Auditoria
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
