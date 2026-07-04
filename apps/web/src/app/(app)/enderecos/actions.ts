"use server";

import { revalidatePath } from "next/cache";
import type { CreateAddressInput, UpdateAddressInput } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";

export async function createAddressAction(data: CreateAddressInput) {
  await serverApi("POST", "/addresses", { body: data });
  revalidatePath("/enderecos");
}

export async function updateAddressAction(id: string, data: UpdateAddressInput) {
  await serverApi("PATCH", `/addresses/${id}`, { body: data });
  revalidatePath("/enderecos");
}

export async function setPrincipalAddressAction(id: string) {
  await serverApi("POST", `/addresses/${id}/principal`);
  revalidatePath("/enderecos");
}

export async function deleteAddressAction(id: string) {
  await serverApi("DELETE", `/addresses/${id}`);
  revalidatePath("/enderecos");
}
