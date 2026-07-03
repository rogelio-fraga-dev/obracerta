import { serverApi } from "@/lib/server-api";
import { AdminAvaliacoesClient } from "./_components/AdminAvaliacoesClient";

export const dynamic = "force-dynamic";

interface ReviewItem {
  id: string;
  bookingId: string;
  autorNome: string;
  alvoNome: string;
  nota: number;
  comentario: string | null;
  status: string;
  criadoEm: string;
}

export default async function AdminAvaliacoesPage() {
  const initialData = await serverApi<{ items: ReviewItem[]; total: number }>(
    "GET",
    "/admin/reviews?limit=100"
  );

  return (
    <section aria-labelledby="admin-eval-heading" className="space-y-6">
      <div>
        <h1 id="admin-eval-heading" className="font-display text-3xl font-black text-foreground">
          Gestão de Avaliações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audite, modere e acompanhe as notas e depoimentos dos profissionais e contratantes.
        </p>
      </div>

      <AdminAvaliacoesClient initialData={initialData} />
    </section>
  );
}
