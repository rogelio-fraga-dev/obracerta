"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type City,
  createWorkOrderSchema,
  professionCatalog,
  type WorkOrder,
  type WorkUrgency,
} from "@obracerta/shared";
import { Button, Card, Field, Input, Select } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { WORK_URGENCY_UI } from "@/lib/work-order-ui";

const URGENCIAS = Object.keys(WORK_URGENCY_UI) as WorkUrgency[];

/** Formulário de abertura de obra. A urgência define a janela de expiração no backend. */
export function NovaObraForm({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [cidadeId, setCidadeId] = useState(cities[0]?.id ?? "");
  const [especialidade, setEspecialidade] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState<WorkUrgency>("NORMAL");
  const [bairro, setBairro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function publicar() {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        cidadeId,
        especialidade,
        titulo,
        descricao: descricao.trim() || undefined,
        urgencia,
        bairro: bairro.trim() || undefined,
      };
      const parsed = createWorkOrderSchema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      const obra = await bff.post<WorkOrder>("/api/work-orders", payload);
      router.replace(`/obras/${obra.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao publicar a obra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Field label="Cidade">
        <Select value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} — {c.uf}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Título" hint="Resuma o serviço (ex.: Forro de gesso em apartamento 2 quartos)">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </Field>
      <Field label="Especialidade">
        <Select value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
          <option value="">Selecione a profissão</option>
          {professionCatalog.map((p) => (
            <option key={p.id} value={p.label}>
              {p.icon} {p.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Urgência">
        <Select value={urgencia} onChange={(e) => setUrgencia(e.target.value as WorkUrgency)}>
          {URGENCIAS.map((u) => (
            <option key={u} value={u}>
              {WORK_URGENCY_UI[u].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bairro" hint="Opcional">
        <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
      </Field>
      <Field label="Descrição" hint="Opcional — detalhe o serviço">
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </Field>

      <Button className="w-full" onClick={publicar} disabled={loading}>
        {loading ? "Publicando…" : "Publicar obra"}
      </Button>
    </Card>
  );
}
