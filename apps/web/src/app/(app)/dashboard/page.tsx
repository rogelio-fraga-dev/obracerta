import { userSchema, type User } from "@obracerta/shared";

/**
 * Dashboard placeholder + POC de type-safety end-to-end (plan §8).
 *
 * `userSchema` é EXATAMENTE o mesmo schema Zod que apps/api usa para validar.
 * O tipo `User` é inferido dele — se o schema mudar, front e back quebram juntos
 * no compilador. Sem drift de contrato.
 */
export default function DashboardPage() {
  // Validado em tempo de execução pelo mesmo schema do backend.
  const user: User = userSchema.parse({
    id: "11111111-1111-4111-8111-111111111111",
    nomeCompleto: "Maria Souza",
    whatsapp: "+5534991234567",
    tipo: "CONTRATANTE",
    status: "ATIVO",
    criadoEm: new Date().toISOString(),
  });

  return (
    <section aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="text-3xl font-black text-foreground">
        Olá, {user.nomeCompleto}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Área logada (placeholder). Tipo de conta:{" "}
        <strong className="text-foreground">{user.tipo}</strong>.
      </p>
    </section>
  );
}
