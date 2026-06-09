"use server";

import { revalidatePath } from "next/cache";
import { unwrapEnvelope } from "@obracerta/shared";
import { config } from "@/lib/config";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";

/**
 * Adiciona uma foto ao portfólio (multipart). Repassa o FormData à API com o
 * Bearer do cookie — mesmo padrão do upload da foto de perfil.
 */
export async function uploadPortfolioPhotoAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/profiles/professional/me/portfolio`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);

  revalidatePath("/perfil");
}

/** Remove uma foto do portfólio. */
export async function deletePortfolioPhotoAction(photoId: string) {
  await serverApi("DELETE", `/profiles/professional/me/portfolio/${photoId}`);
  revalidatePath("/perfil");
}
