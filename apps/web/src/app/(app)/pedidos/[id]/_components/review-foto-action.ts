"use server";

import { unwrapEnvelope } from "@obracerta/shared";
import { config } from "@/lib/config";
import { getSession } from "@/lib/session";

/**
 * Anexa a foto do serviço concluído a uma avaliação já criada (multipart). O
 * reviewId vem da resposta do POST /reviews; a foto é opcional e não bloqueia a
 * avaliação em si.
 */
export async function attachReviewPhotoAction(reviewId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/reviews/${reviewId}/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);
}
