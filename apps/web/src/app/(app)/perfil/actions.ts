"use server";

import { revalidatePath } from "next/cache";
import { serverApi } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import { config } from "@/lib/config";
import { unwrapEnvelope } from "@obracerta/shared";
import type { CreateAdminInput, UpdatePasswordInput, UpdateProfileInput } from "@obracerta/shared";

export async function updateProfileAction(data: UpdateProfileInput) {
  await serverApi("PUT", "/auth/me/profile", { body: data });
  revalidatePath("/perfil");
  revalidatePath("/admin/perfil");
}

export async function updatePasswordAction(data: UpdatePasswordInput) {
  await serverApi("PUT", "/auth/me/password", { body: data });
}

export async function createAdminAction(data: CreateAdminInput) {
  await serverApi("POST", "/admin/users/admin", { body: data });
  revalidatePath("/admin/usuarios");
}

export async function uploadFotoAction(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const res = await fetch(`${config.apiUrl}/auth/me/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  
  // Note: we don't handle refresh token logic here to keep it simple
  // If it's a 401, they'll just have to reload. But we can catch it.
  const json: unknown = await res.json().catch(() => null);
  unwrapEnvelope(json, res.status);
  
  revalidatePath("/perfil");
  revalidatePath("/admin/perfil");
}
