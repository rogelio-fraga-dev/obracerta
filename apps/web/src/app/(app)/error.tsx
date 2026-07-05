"use client";

import { ErrorState } from "@/components/ErrorState";

/** Boundary de erro da área logada — falha de fetch vira uma tela amigável com retry. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} home="/inicio" homeLabel="Ir para o início" />;
}
