"use server";

import { revalidatePath } from "next/cache";
import { unwrapEnvelope } from "@obracerta/shared";
import { config } from "@/lib/config";
import { getSession } from "@/lib/session";

/**
 * Envia a selfie para verificação de identidade (multipart). Repassa o FormData
 * à API com o Bearer do cookie — mesmo padrão do upload de portfólio. A foto vai
 * para análise (status EM_ANALISE) e a moderação decide.
 */
export async function submitVerificationAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/profiles/professional/me/verificacao`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);

  revalidatePath("/perfil");
}
