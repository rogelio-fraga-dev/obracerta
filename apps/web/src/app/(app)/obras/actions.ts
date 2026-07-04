"use server";

import { revalidatePath } from "next/cache";
import { unwrapEnvelope } from "@obracerta/shared";
import { config } from "@/lib/config";
import { getSession } from "@/lib/session";

/**
 * Anexa a foto ilustrativa a uma obra (multipart). Repassa o FormData direto à
 * API com o Bearer do cookie — mesmo padrão da foto do pedido. O `serverApi`
 * só fala JSON, por isso o fetch cru aqui.
 */
export async function uploadObraFotoAction(workOrderId: string, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/work-orders/${workOrderId}/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);

  revalidatePath(`/obras/${workOrderId}`);
  revalidatePath("/obras");
}
