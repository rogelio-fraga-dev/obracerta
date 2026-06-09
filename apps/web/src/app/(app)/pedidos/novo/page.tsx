"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type BookingRequest, createBookingSchema } from "@obracerta/shared";
import { Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { uploadBookingFotoAction } from "../actions";

/**
 * Contratante cria um pedido. O profissional-alvo vem por query (`?prof=&esp=`)
 * quando se chega pelo perfil público (etapa 7.3); aqui também dá para informar
 * manualmente. `dataServico` (datetime-local) é convertida para ISO 8601.
 */
export default function NovoPedidoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [professionalId, setProfessionalId] = useState(params.get("prof") ?? "");
  const [especialidade, setEspecialidade] = useState(params.get("esp") ?? "");
  const [descricao, setDescricao] = useState("");
  const [quando, setQuando] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function criar() {
    setError(null);
    setLoading(true);
    try {
      if (!quando) throw new Error("Escolha a data e a hora do serviço.");
      const payload = {
        professionalId,
        especialidade,
        descricao: descricao.trim() || undefined,
        dataServico: new Date(quando).toISOString(),
      };
      const parsed = createBookingSchema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      const booking = await bff.post<BookingRequest>("/api/bookings", payload);
      // A foto sobe depois (multipart), já com o pedido criado. Best-effort: se
      // falhar, o pedido continua válido — o contratante pode reenviar no detalhe.
      if (foto) {
        const fd = new FormData();
        fd.append("file", foto);
        await uploadBookingFotoAction(booking.id, fd).catch(() => {
          /* anexo é opcional: não bloqueia a navegação */
        });
      }
      router.replace(`/pedidos/${booking.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar o pedido.");
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="novo-heading" className="space-y-4">
      <h1 id="novo-heading" className="font-display text-2xl font-black text-foreground">
        Novo pedido
      </h1>

      <Card className="space-y-4">
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <Field label="Profissional" hint="Identificador do profissional (vem do perfil dele)">
          <Input
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            placeholder="ID do profissional"
          />
        </Field>
        <Field label="Especialidade">
          <Input
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
            placeholder="Ex.: Pedreiro"
          />
        </Field>
        <Field label="Data e hora">
          <Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />
        </Field>
        <Field label="Mensagem ao profissional" hint="Opcional — detalhe o serviço">
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Field>
        <Field label="Foto do serviço" hint="Opcional — JPEG, PNG ou WebP">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
          />
        </Field>

        <Button className="w-full" onClick={criar} disabled={loading}>
          {loading ? "Enviando…" : "Enviar pedido"}
        </Button>
      </Card>
    </section>
  );
}
