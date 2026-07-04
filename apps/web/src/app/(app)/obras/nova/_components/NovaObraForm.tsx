"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type City,
  createWorkOrderSchema,
  professionCatalog,
  type WorkOrder,
  type WorkUrgency,
} from "@obracerta/shared";
import { Button, Card, Field, Input, Select, Textarea } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { WORK_URGENCY_UI } from "@/lib/work-order-ui";
import { uploadObraFotoAction } from "../../actions";

const URGENCIAS = Object.keys(WORK_URGENCY_UI) as WorkUrgency[];

/** Limite prático do anexo (o proxy do Next aceita até 6MB no body). */
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

/**
 * Formulário de abertura de obra. UF → cidade em cascata (o marketplace opera
 * nas capitais + piloto); a urgência define a janela de expiração no backend; a
 * foto sobe depois de criar (multipart), como no pedido.
 */
export function NovaObraForm({ cities }: { cities: City[] }) {
  const router = useRouter();

  const ufs = useMemo(
    () => [...new Set(cities.map((c) => c.uf))].sort(),
    [cities],
  );
  const [uf, setUf] = useState(ufs.includes("SP") ? "SP" : (ufs[0] ?? ""));
  const cidadesDaUf = useMemo(
    () => cities.filter((c) => c.uf === uf).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cities, uf],
  );
  const [cidadeId, setCidadeId] = useState("");
  const cidadeSelecionada = cidadesDaUf.some((c) => c.id === cidadeId)
    ? cidadeId
    : (cidadesDaUf[0]?.id ?? "");

  const [especialidade, setEspecialidade] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState<WorkUrgency>("NORMAL");
  const [bairro, setBairro] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function publicar() {
    setError(null);
    if (foto && foto.size > MAX_FOTO_BYTES) {
      setError("A foto passa de 5MB — escolha uma imagem menor.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        cidadeId: cidadeSelecionada,
        especialidade,
        titulo,
        descricao: descricao.trim() || undefined,
        urgencia,
        bairro: bairro.trim() || undefined,
      };
      const parsed = createWorkOrderSchema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      const obra = await bff.post<WorkOrder>("/api/work-orders", payload);
      // A foto sobe depois (multipart), já com a obra criada. Best-effort: se
      // falhar, a obra continua válida — dá para reenviar depois.
      if (foto) {
        const fd = new FormData();
        fd.append("file", foto);
        await uploadObraFotoAction(obra.id, fd).catch(() => {
          /* anexo é opcional: não bloqueia a navegação */
        });
      }
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

      <div className="grid grid-cols-[100px_1fr] gap-3">
        <Field label="Estado">
          <Select value={uf} onChange={(e) => setUf(e.target.value)}>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cidade">
          <Select value={cidadeSelecionada} onChange={(e) => setCidadeId(e.target.value)}>
            {cidadesDaUf.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
      </div>
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
      <Field
        label="Descrição"
        hint="Detalhe o serviço: metragem, materiais, prazo desejado — quanto mais contexto, melhores os lances"
      >
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={2000}
          placeholder="Ex.: Apartamento de 70m², preciso de forro de gesso nos 2 quartos e sala…"
        />
      </Field>
      <Field label="Foto da obra" hint="Opcional — JPEG, PNG ou WebP até 5MB; ajuda o profissional a entender o serviço">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
      </Field>

      <Button className="w-full" onClick={publicar} disabled={loading}>
        {loading ? "Publicando…" : "Publicar obra"}
      </Button>
    </Card>
  );
}
