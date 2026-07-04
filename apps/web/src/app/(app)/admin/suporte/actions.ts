"use server";

import { revalidatePath } from "next/cache";
import { serverApi } from "@/lib/server-api";

export async function respondSupportTicketAction(id: string, resposta: string) {
  await serverApi("POST", `/admin/support/tickets/${id}/respond`, { body: { resposta } });
  revalidatePath("/admin/suporte");
}

export async function closeSupportTicketAction(id: string) {
  await serverApi("POST", `/admin/support/tickets/${id}/close`);
  revalidatePath("/admin/suporte");
}
