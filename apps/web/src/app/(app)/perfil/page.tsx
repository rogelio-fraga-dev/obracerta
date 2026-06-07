import type { JwtClaims } from "@obracerta/shared";
import { Badge, Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";

/**
 * Aba Perfil. Faz uma chamada **autenticada server-side** (`serverApi` → API
 * `/auth/me`) usando o token do cookie — prova o loop completo da sessão BFF.
 * O perfil editável completo vem nas etapas 7.1/7.4.
 */
export default async function PerfilPage() {
  const claims = await serverApi<JwtClaims>("POST", "/auth/me");

  return (
    <section aria-labelledby="perfil-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 id="perfil-heading" className="font-display text-2xl font-black text-foreground">
          Perfil
        </h1>
        <Badge tone="success">Sessão ativa</Badge>
      </div>
      <Card className="space-y-2">
        <p className="text-sm text-muted-foreground">
          WhatsApp: <strong className="text-foreground">{claims.whatsapp}</strong>
        </p>
        <p className="break-all text-sm text-muted-foreground">
          ID: <strong className="text-foreground">{claims.sub}</strong>
        </p>
      </Card>
    </section>
  );
}
