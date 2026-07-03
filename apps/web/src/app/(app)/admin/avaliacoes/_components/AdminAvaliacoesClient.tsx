"use client";

import { useState } from "react";
import { Badge, Button, Card, Input, Select, type BadgeTone } from "@obracerta/ui";
import { formatDateTimeBR } from "@/lib/format";
import { bff } from "@/lib/client";
import { useToast } from "@/components/Toast";

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

interface AdminAvaliacoesClientProps {
  initialData: {
    items: ReviewItem[];
    total: number;
  };
}

export function AdminAvaliacoesClient({ initialData }: AdminAvaliacoesClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialData.items);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const toast = useToast();
  const itemsPerPage = 10;

  // Moderar status da avaliação (feedback via toast — não empurra o layout)
  async function toggleStatus(id: string, currentStatus: string) {
    const action = currentStatus === "REVELADA" ? "hide" : "restore";
    try {
      await bff.post(`/api/admin/reviews/${id}/${action}`);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: currentStatus === "REVELADA" ? "OCULTA" : "REVELADA" }
            : r
        )
      );
      toast.success(action === "hide" ? "Avaliação ocultada." : "Avaliação restaurada.");
    } catch {
      toast.error("Não foi possível alterar o status da avaliação.");
    }
  }

  // Filtragem no cliente
  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.autorNome.toLowerCase().includes(search.toLowerCase()) ||
      r.alvoNome.toLowerCase().includes(search.toLowerCase()) ||
      (r.comentario && r.comentario.toLowerCase().includes(search.toLowerCase()));

    const matchesRating =
      ratingFilter === "all" ? true : r.nota === Number(ratingFilter);

    const matchesStatus =
      statusFilter === "all" ? true : r.status === statusFilter;

    return matchesSearch && matchesRating && matchesStatus;
  });

  // Paginação
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const statusTone: Record<string, BadgeTone> = {
    REVELADA: "success",
    OCULTA: "danger",
    PENDENTE: "warning",
  };

  // Ação de moderação por linha (reutilizada na tabela desktop e nos cards mobile).
  const renderAcao = (r: ReviewItem) => (
    <>
      {r.status === "REVELADA" && (
        <Button size="sm" variant="secondary" onClick={() => toggleStatus(r.id, r.status)}>
          Ocultar
        </Button>
      )}
      {r.status === "OCULTA" && (
        <Button size="sm" onClick={() => toggleStatus(r.id, r.status)}>
          Restaurar
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {/* ── Filtros e Busca ── */}
      <Card className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Buscar por nome/comentário
          </label>
          <Input
            className="mt-1"
            placeholder="Ex.: João, pintor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filtrar por Nota
          </label>
          <Select
            className="mt-1"
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todas as notas</option>
            <option value="5">5 estrelas</option>
            <option value="4">4 estrelas</option>
            <option value="3">3 estrelas</option>
            <option value="2">2 estrelas</option>
            <option value="1">1 estrela</option>
          </Select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filtrar por Status
          </label>
          <Select
            className="mt-1"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos os status</option>
            <option value="REVELADA">Revelada</option>
            <option value="OCULTA">Oculta</option>
            <option value="PENDENTE">Pendente</option>
          </Select>
        </div>
      </Card>

      {/* ── Lista de Registros ── */}
      {paginatedItems.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma avaliação encontrada para os critérios selecionados.
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop: tabela */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Autor</th>
                  <th className="py-3 px-4">Destinatário</th>
                  <th className="py-3 px-4 text-center">Nota</th>
                  <th className="py-3 px-4">Comentário</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Criado em</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedItems.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/10">
                    <td className="py-3.5 px-4 font-bold text-foreground">{r.autorNome}</td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">{r.alvoNome}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-warning font-bold">★ {r.nota}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px] truncate text-muted-foreground" title={r.comentario ?? undefined}>
                      {r.comentario ?? "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge tone={statusTone[r.status] ?? "neutral"} size="sm">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {formatDateTimeBR(r.criadoEm)}
                    </td>
                    <td className="py-3.5 px-4 text-right">{renderAcao(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {paginatedItems.map((r) => (
              <li key={r.id}>
                <Card className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{r.autorNome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        para <span className="font-semibold text-foreground">{r.alvoNome}</span>
                      </p>
                    </div>
                    <Badge tone={statusTone[r.status] ?? "neutral"} size="sm">
                      {r.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-warning">★ {r.nota}</span>
                    <span className="text-xs text-muted-foreground">· {formatDateTimeBR(r.criadoEm)}</span>
                  </div>

                  {r.comentario && (
                    <p className="text-sm italic text-muted-foreground line-clamp-3">
                      &ldquo;{r.comentario}&rdquo;
                    </p>
                  )}

                  {(r.status === "REVELADA" || r.status === "OCULTA") && (
                    <div className="flex justify-end border-t border-border/60 pt-3">{renderAcao(r)}</div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} avaliações
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
