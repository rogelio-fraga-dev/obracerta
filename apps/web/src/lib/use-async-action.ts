import { useState } from "react";

/**
 * Estado de uma ação assíncrona (erro + loading) com um runner que zera o erro,
 * marca loading, executa, captura a mensagem e finaliza. Usado nos formulários de
 * autenticação (login/cadastro) — antes era duplicado em cada página.
 */
export function useAsyncAction() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };
  return { error, loading, run };
}
