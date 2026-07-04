"use server";

import { revalidatePath } from "next/cache";
import type { CreateSupportTicketInput } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";

export async function createSupportTicketAction(data: CreateSupportTicketInput) {
  await serverApi("POST", "/support/tickets", { body: data });
  revalidatePath("/ajuda");
}
