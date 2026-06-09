"use server";

import { revalidatePath } from "next/cache";
import { unwrapEnvelope } from "@obracerta/shared";
import { config } from "@/lib/config";
import { getSession } from "@/lib/session";

/**
 * Anexa a foto do serviço a um pedido (multipart). Repassa o FormData direto à
 * API com o Bearer do cookie — mesmo padrão do upload da foto de perfil. O
 * `serverApi` só fala JSON, por isso o fetch cru aqui.
 */
export async function uploadBookingFotoAction(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/bookings/${bookingId}/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);

  revalidatePath(`/pedidos/${bookingId}`);
}
