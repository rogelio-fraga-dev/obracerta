"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { type Address, createAddressSchema, UFS } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState, Field, Input, Select } from "@obracerta/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import {
  createAddressAction,
  deleteAddressAction,
  setPrincipalAddressAction,
} from "../actions";

/** Estado do formulário de novo endereço. */
interface FormState {
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const EMPTY_FORM: FormState = {
  apelido: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "SP",
};

/** Máscara visual do CEP: 01310-100. */
function formatCep(digits: string): string {
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Lista + cadastro de endereços. Digitou o CEP → busca no ViaCEP (client-side)
 * e pré-preenche rua/bairro/cidade/UF; o usuário só confere e completa o número.
 */
export function EnderecosClient({ enderecos }: { enderecos: Address[] }) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(enderecos.length === 0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function buscarCep(cepDigits: string) {
    if (cepDigits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setError("CEP não encontrado — preencha o endereço manualmente.");
        return;
      }
      setError(null);
      setForm((f) => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        uf: data.uf || f.uf,
      }));
    } catch {
      setError("Não foi possível consultar o CEP — preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  }

  function salvar() {
    setError(null);
    const payload = {
      apelido: form.apelido,
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero.trim() || undefined,
      complemento: form.complemento.trim() || undefined,
      bairro: form.bairro.trim() || undefined,
      cidade: form.cidade,
      uf: form.uf,
    };
    const parsed = createAddressSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    startTransition(async () => {
      try {
        await createAddressAction(parsed.data);
        setForm(EMPTY_FORM);
        setShowForm(false);
        toast.success("Endereço salvo.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar o endereço.");
      }
    });
  }

  function tornarPrincipal(id: string) {
    startTransition(async () => {
      try {
        await setPrincipalAddressAction(id);
        toast.success("Endereço principal atualizado.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar o endereço.");
      }
    });
  }

  function remover(id: string) {
    startTransition(async () => {
      try {
        await deleteAddressAction(id);
        toast.success("Endereço removido.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao remover o endereço.");
      } finally {
        setRemovendoId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {enderecos.length === 0 && !showForm && (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="Nenhum endereço salvo"
          description="Cadastre o endereço da sua casa ou obra para agilizar pedidos e orçamentos."
        />
      )}

      {enderecos.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {enderecos.map((e) => (
            <li key={e.id}>
              <Card className="flex h-full flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-display text-base font-black text-foreground">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                    {e.apelido}
                  </span>
                  {e.principal && <Badge tone="primary" size="sm">Principal</Badge>}
                </div>
                <p className="text-sm text-foreground">
                  {e.logradouro}
                  {e.numero ? `, ${e.numero}` : ""}
                  {e.complemento ? ` — ${e.complemento}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[e.bairro, `${e.cidade} — ${e.uf}`, formatCep(e.cep)].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-auto flex gap-2 border-t border-border pt-2">
                  {!e.principal && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => tornarPrincipal(e.id)}
                      disabled={pending}
                    >
                      Tornar principal
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRemovendoId(e.id)}
                    disabled={pending}
                    className="text-danger"
                  >
                    Remover
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-black text-foreground">Novo endereço</h2>
          <Field label="Nome do endereço" hint='Ex.: "Casa", "Obra da Vila Mariana"'>
            <Input value={form.apelido} onChange={(e) => set("apelido", e.target.value)} maxLength={40} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CEP" hint={cepLoading ? "Buscando…" : "Preenche o resto sozinho"}>
              <Input
                inputMode="numeric"
                placeholder="00000-000"
                value={formatCep(form.cep)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  set("cep", digits);
                  if (digits.length === 8) void buscarCep(digits);
                }}
              />
            </Field>
            <Field label="UF">
              <Select value={form.uf} onChange={(e) => set("uf", e.target.value)}>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Rua / Avenida">
            <Input value={form.logradouro} onChange={(e) => set("logradouro", e.target.value)} maxLength={200} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" hint="Opcional">
              <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} maxLength={20} />
            </Field>
            <Field label="Complemento" hint="Opcional">
              <Input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} maxLength={100} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bairro" hint="Opcional">
              <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} maxLength={120} />
            </Field>
            <Field label="Cidade">
              <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} maxLength={120} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={salvar} disabled={pending}>
              {pending ? "Salvando…" : "Salvar endereço"}
            </Button>
            {enderecos.length > 0 && (
              <Button variant="secondary" onClick={() => setShowForm(false)} disabled={pending}>
                Cancelar
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>+ Adicionar endereço</Button>
      )}

      <ConfirmDialog
        open={removendoId !== null}
        title="Remover este endereço?"
        description="Ele some da sua lista — pedidos já feitos não mudam."
        confirmLabel="Sim, remover"
        cancelLabel="Manter"
        loading={pending}
        onConfirm={() => removendoId && remover(removendoId)}
        onClose={() => setRemovendoId(null)}
      />
    </div>
  );
}
