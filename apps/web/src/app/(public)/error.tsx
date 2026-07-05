"use client";

import { ErrorState } from "@/components/ErrorState";

/** Boundary de erro da área pública — landing e perfil público. */
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} home="/" homeLabel="Voltar ao início" />;
}
