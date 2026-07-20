"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, ChevronLeft, Megaphone, Sparkles } from "lucide-react";
import {
  professionCatalog,
  subServicesFor,
  type Address,
  type City,
  type SearchProfessionalsResult,
  type SearchResult,
  type WorkOrder,
  type WorkUrgency,
} from "@obracerta/shared";
import { Avatar, Badge, Button, Card, Field, Input, Select, Textarea } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { WORK_URGENCY_UI } from "@/lib/work-order-ui";

const URGENCIAS = Object.keys(WORK_URGENCY_UI) as WorkUrgency[];

type Step = 1 | 2 | 3 | 4;

/**
 * Wizard do pedido guiado (concierge): profissão → sub-serviço → detalhes →
 * match. No match, o contratante chama um profissional direto (pedido) ou
 * publica a obra para receber lances — o sub-serviço viaja nos dois fluxos.
 */
export function GuidedRequestWizard({
  cities,
  enderecos = [],
}: {
  cities: City[];
  enderecos?: Address[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [profissao, setProfissao] = useState("");
  const [subServico, setSubServico] = useState("");
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState<WorkUrgency>("NORMAL");
  const [bairro, setBairro] = useState("");

  const ufs = useMemo(() => [...new Set(cities.map((c) => c.uf))].sort(), [cities]);
  const [uf, setUf] = useState(ufs.includes("SP") ? "SP" : (ufs[0] ?? ""));
  const cidadesDaUf = useMemo(
    () => cities.filter((c) => c.uf === uf).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cities, uf],
  );
  const [cidadeId, setCidadeId] = useState("");
  const cidadeSelecionada = cidadesDaUf.some((c) => c.id === cidadeId)
    ? cidadeId
    : (cidadesDaUf[0]?.id ?? "");

  const [matches, setMatches] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const subServicos = subServicesFor(profissao);

  /** Pré-preenche UF/cidade/bairro a partir de um endereço salvo. */
  function usarEndereco(id: string) {
    const endereco = enderecos.find((e) => e.id === id);
    if (!endereco) return;
    setUf(endereco.uf);
    const cidade = cities.find(
      (c) =>
        c.uf === endereco.uf &&
        c.nome.localeCompare(endereco.cidade, "pt-BR", { sensitivity: "base" }) === 0,
    );
    if (cidade) setCidadeId(cidade.id);
    if (endereco.bairro) setBairro(endereco.bairro);
  }

  /** Passo 3 → 4: busca os melhores profissionais da especialidade (concierge). */
  async function buscarMatches() {
    setError(null);
    setLoading(true);
    try {
      const qs = new URLSearchParams({ especialidade: profissao, limit: "5" });
      const result = await bff.get<SearchProfessionalsResult>(
        `/api/search/professionals?${qs.toString()}`,
      );
      setMatches(result.items);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível buscar profissionais.");
    } finally {
      setLoading(false);
    }
  }

  /** Publica a obra para lances com o sub-serviço no título/campo próprio. */
  async function publicarObra() {
    setError(null);
    setPublicando(true);
    try {
      const obra = await bff.post<WorkOrder>("/api/work-orders", {
        cidadeId: cidadeSelecionada,
        especialidade: profissao,
        subServico,
        titulo: subServico,
        descricao: descricao.trim() || undefined,
        urgencia,
        bairro: bairro.trim() || undefined,
      });
      router.replace(`/obras/${obra.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível publicar a obra.");
      setPublicando(false);
    }
  }

  return (
    <div className="space-y-4">
      <StepDots current={step} />

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* ── Passo 1: profissão ── */}
      {step === 1 && (
        <Card className="space-y-3">
          <h2 className="font-display text-lg font-black text-foreground">
            Qual profissional você precisa?
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {professionCatalog.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setProfissao(p.label);
                    setSubServico("");
                    setStep(2);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl border-2 p-3 text-left text-sm font-semibold transition-all ${
                    profissao === p.label
                      ? "border-primary bg-primary/[0.06] text-foreground"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  <span aria-hidden>{p.icon}</span>
                  <span className="min-w-0 flex-1">{p.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Passo 2: sub-serviço ── */}
      {step === 2 && (
        <Card className="space-y-3">
          <BackStep onClick={() => setStep(1)} />
          <h2 className="font-display text-lg font-black text-foreground">
            O que precisa ser feito? <span className="text-muted-foreground">({profissao})</span>
          </h2>
          <ul className="space-y-2">
            {subServicos.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    setSubServico(s);
                    setStep(3);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all ${
                    subServico === s
                      ? "border-primary bg-primary/[0.06] text-foreground"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {s}
                  {subServico === s && <Check aria-hidden className="h-4 w-4 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Passo 3: detalhes ── */}
      {step === 3 && (
        <Card className="space-y-4">
          <BackStep onClick={() => setStep(2)} />
          <h2 className="font-display text-lg font-black text-foreground">Detalhes do serviço</h2>
          <p className="text-sm text-muted-foreground">
            {profissao} · <strong className="text-foreground">{subServico}</strong>
          </p>

          {enderecos.length > 0 && (
            <Field label="Usar endereço salvo" hint="Preenche estado, cidade e bairro">
              <Select defaultValue="" onChange={(e) => usarEndereco(e.target.value)}>
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
          <Field label="Bairro" hint="Opcional">
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
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
          <Field label="Descreva o serviço" hint="Opcional — metragem, materiais, prazo desejado">
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={2000}
              placeholder="Ex.: Apartamento de 70m², chuveiro novo já comprado…"
            />
          </Field>

          <Button className="w-full" onClick={buscarMatches} disabled={loading}>
            {loading ? "Buscando profissionais…" : "Ver profissionais recomendados →"}
          </Button>
        </Card>
      )}

      {/* ── Passo 4: match concierge ── */}
      {step === 4 && matches && (
        <div className="space-y-4">
          <Card className="space-y-1 border-primary/25 bg-primary/[0.04]">
            <p className="flex items-center gap-2 font-display text-lg font-black text-foreground">
              <Sparkles aria-hidden className="h-5 w-5 text-primary" />
              Encontramos {matches.length > 0 ? `${matches.length} profissional${matches.length > 1 ? "is" : ""}` : "o caminho"} para você
            </p>
            <p className="text-sm text-muted-foreground">
              {profissao} · {subServico}
              {bairro.trim() ? ` · ${bairro.trim()}` : ""}
            </p>
          </Card>

          <BackStep onClick={() => setStep(3)} label="Ajustar detalhes" />

          {matches.length > 0 ? (
            <ul className="space-y-3">
              {matches.map((p) => (
                <li key={p.userId}>
                  <Card className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar nome={p.nome} src={p.fotoUrl ?? undefined} size="lg" className="shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/${p.slug}`} className="font-display text-base font-black text-foreground hover:underline">
                            {p.nome}
                          </Link>
                          {p.verificado && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-success" title="Identidade verificada">
                              <BadgeCheck aria-hidden className="h-4 w-4" /> Verificado
                            </span>
                          )}
                        </div>
                        {p.totalAvaliacoes > 0 ? (
                          <p className="flex items-center gap-1.5 text-sm">
                            <span aria-hidden className="tracking-tight text-warning">
                              {"★".repeat(Math.round(p.mediaNota))}
                              <span className="text-border">{"★".repeat(5 - Math.round(p.mediaNota))}</span>
                            </span>
                            <span className="font-bold text-foreground">{p.mediaNota.toFixed(1)}</span>
                            <span className="text-muted-foreground">({p.totalAvaliacoes})</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Ainda sem avaliações</p>
                        )}
                        {p.bairro && <p className="text-xs text-muted-foreground">{p.bairro}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="secondary" className="flex-1">
                        <Link href={`/${p.slug}`}>Ver perfil</Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link
                          href={`/pedidos/novo?prof=${p.userId}&esp=${encodeURIComponent(profissao)}&nome=${encodeURIComponent(p.nome)}`}
                        >
                          Chamar direto
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card>
              <p className="text-sm text-muted-foreground">
                Nenhum profissional de {profissao} disponível agora. Publique a obra para lances —
                os profissionais da sua cidade são avisados na hora.
              </p>
            </Card>
          )}

          <Card className="space-y-3 border-dashed">
            <div className="flex items-start gap-3">
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Megaphone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">Prefere comparar orçamentos?</p>
                <p className="text-sm text-muted-foreground">
                  Publique como obra e receba lances sigilosos de vários profissionais.
                </p>
              </div>
            </div>
            <Button variant="secondary" className="w-full" onClick={publicarObra} disabled={publicando}>
              {publicando ? "Publicando…" : "Publicar obra para lances"}
            </Button>
          </Card>

          {matches.length > 0 && (
            <p className="px-1 text-center text-xs text-muted-foreground">
              Recomendação por reputação, plano e atividade — <Badge tone="neutral" size="sm">match concierge</Badge>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Indicador de progresso do wizard (4 passos). */
function StepDots({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Passo ${current} de 4`}>
      {[1, 2, 3, 4].map((s) => (
        <span
          key={s}
          aria-hidden
          className={`h-1.5 rounded-full transition-all ${
            s === current ? "w-6 bg-primary" : s < current ? "w-3 bg-primary/40" : "w-3 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

/** Botão de voltar um passo. */
function BackStep({ onClick, label = "Voltar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft aria-hidden className="h-4 w-4" /> {label}
    </button>
  );
}
