"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Clock, ShieldAlert, ShieldQuestion } from "lucide-react";
import { type MyVerification, VerificationStatus } from "@obracerta/shared";
import { Badge, Button, Card, Field } from "@obracerta/ui";
import { submitVerificationAction } from "../verificacao-actions";

/**
 * Painel de verificação de identidade por foto (selfie). Mostra o estado atual e,
 * quando cabível (não enviado ou recusado), permite enviar uma selfie para análise
 * da moderação. Só o selo VERIFICADO aparece no perfil público.
 */
export function VerificationCard({ verificacao }: { verificacao: MyVerification }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const status = verificacao.status;
  const podeEnviar = status === VerificationStatus.NAO_ENVIADO || status === VerificationStatus.RECUSADO;

  function enviar() {
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        await submitVerificationAction(fd);
        setFile(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enviar a foto.");
      }
    });
  }

  return (
    <div className="animate-fade-in delay-1 space-y-3">
      <div>
        <h2 className="font-display text-xl font-black text-foreground">Verificação de identidade</h2>
        <p className="text-sm text-muted-foreground">
          Envie uma selfie para ganhar o selo <strong>Verificado</strong> — ele aparece no seu perfil
          público e na busca, e passa mais confiança para quem contrata.
        </p>
      </div>

      <Card className="space-y-4">
        <StatusRow status={status} />

        {podeEnviar && (
          <div className="space-y-2 rounded-lg border border-dashed border-border p-2.5 sm:p-3">
            {error && (
              <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <Field label="Sua selfie (rosto visível, boa iluminação)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              A foto é privada — só a nossa equipe de moderação a vê para conferir sua identidade.
            </p>
            <Button size="sm" onClick={enviar} disabled={!file || pending}>
              {pending ? "Enviando…" : "Enviar para verificação"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/** Linha de estado com ícone + selo conforme o status da verificação. */
function StatusRow({ status }: { status: VerificationStatus }) {
  const ui = STATUS_UI[status];
  const Icon = ui.icon;
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${ui.iconWrap}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-foreground">{ui.title}</span>
          <Badge tone={ui.tone}>{ui.badge}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{ui.description}</p>
      </div>
    </div>
  );
}

const STATUS_UI: Record<
  VerificationStatus,
  {
    title: string;
    badge: string;
    description: string;
    tone: "neutral" | "primary" | "success" | "warning" | "danger";
    icon: typeof BadgeCheck;
    iconWrap: string;
  }
> = {
  NAO_ENVIADO: {
    title: "Ainda não verificado",
    badge: "Não enviado",
    description: "Envie sua selfie para começar. Leva menos de um minuto.",
    tone: "neutral",
    icon: ShieldQuestion,
    iconWrap: "bg-muted text-muted-foreground",
  },
  EM_ANALISE: {
    title: "Em análise",
    badge: "Em análise",
    description: "Recebemos sua foto. Nossa equipe confere em breve — você será avisado.",
    tone: "warning",
    icon: Clock,
    iconWrap: "bg-warning/10 text-warning",
  },
  VERIFICADO: {
    title: "Identidade verificada",
    badge: "Verificado",
    description: "Seu selo já aparece no perfil público e na busca. 🎉",
    tone: "success",
    icon: BadgeCheck,
    iconWrap: "bg-success/10 text-success",
  },
  RECUSADO: {
    title: "Verificação recusada",
    badge: "Recusado",
    description: "A foto não pôde ser confirmada. Envie outra selfie nítida, com o rosto bem visível.",
    tone: "danger",
    icon: ShieldAlert,
    iconWrap: "bg-danger/10 text-danger",
  },
};
