import type { Notification } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { BackLink } from "../_shell/BackLink";
import { NotificationList } from "./_components/NotificationList";
import { PushOptIn } from "./_components/PushOptIn";

/** Notificações: avisos e lembretes da conta (pedidos, obras, mensagens…). */
export default async function NotificacoesPage() {
  const notificacoes = await serverApi<Notification[]>("GET", "/notifications/me");

  return (
    <section aria-labelledby="notif-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="notif-heading" className="font-display text-2xl font-black text-foreground">
          Notificações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que aconteceu na sua conta — pedidos, obras, mensagens e avaliações.
        </p>
      </div>
      <PushOptIn />
      <NotificationList notificacoes={notificacoes} />
    </section>
  );
}
