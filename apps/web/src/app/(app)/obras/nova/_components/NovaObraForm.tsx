"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Address,
  type City,
  createWorkOrderSchema,
  MAX_WORK_ORDER_PHOTOS,
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
export function NovaObraForm({ cities, enderecos = [] }: { cities: City[]; enderecos?: Address[] }) {
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
  const [fotos, setFotos] = useState<File[]>([]);
  const [enderecoId, setEnderecoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Pré-preenche UF/cidade/bairro a partir de um endereço salvo. */
  function usarEndereco(id: string) {
    setEnderecoId(id);
    const endereco = enderecos.find((e) => e.id === id);
    if (!endereco) return;
    setUf(endereco.uf);
    const cidade = cities.find(
      (c) => c.uf === endereco.uf && c.nome.localeCompare(endereco.cidade, "pt-BR", { sensitivity: "base" }) === 0,
    );
    if (cidade) setCidadeId(cidade.id);
    if (endereco.bairro) setBairro(endereco.bairro);
  }

  async function publicar() {
    setError(null);
    if (fotos.some((f) => f.size > MAX_FOTO_BYTES)) {
      setError("Uma das fotos passa de 5MB — escolha imagens menores.");
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
      // As fotos sobem depois (multipart), já com a obra criada — em sequência
      // para a 1ª virar a capa. Best-effort: falha não invalida a obra.
      for (const foto of fotos) {
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

      {enderecos.length > 0 && (
        <Field label="Usar endereço salvo" hint="Preenche estado, cidade e bairro">
          <Select value={enderecoId} onChange={(e) => usarEndereco(e.target.value)}>
            <option value="">Preencher manualmente</option>
            {enderecos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.apelido} — {e.cidade}/{e.uf}
              </option>
            ))}
          </Select>
        </Field>
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
      <Field
        label={`Fotos da obra (até ${MAX_WORK_ORDER_PHOTOS})`}
        hint="Opcional — JPEG, PNG ou WebP até 5MB cada; a primeira vira a capa"
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFotos(Array.from(e.target.files ?? []).slice(0, MAX_WORK_ORDER_PHOTOS))}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
        {fotos.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {fotos.length} foto(s) selecionada(s)
          </p>
        )}
      </Field>

      <Button className="w-full" onClick={publicar} disabled={loading}>
        {loading ? "Publicando…" : "Publicar obra"}
      </Button>
    </Card>
  );
}
