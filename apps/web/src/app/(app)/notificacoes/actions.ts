"use server";

import { revalidatePath } from "next/cache";
import { serverApi } from "@/lib/server-api";

export async function markNotificationReadAction(id: string) {
  await serverApi("POST", `/notifications/${id}/read`);
  revalidatePath("/notificacoes");
}

export async function markAllNotificationsReadAction() {
  await serverApi("POST", "/notifications/read-all");
  revalidatePath("/notificacoes");
}
