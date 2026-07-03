import { GoogleMockForm } from "./GoogleMockForm";

/**
 * **Consentimento Google simulado** (sandbox). Sem credenciais reais no backend,
 * o adapter fake manda o usuário para cá; esta tela faz o papel do
 * accounts.google.com e devolve um `code` fictício ao callback do BFF. Com
 * `GOOGLE_CLIENT_ID/SECRET` no env, o fluxo real ignora esta página.
 */
export default async function GoogleMockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectUri = typeof params.redirect_uri === "string" ? params.redirect_uri : "";
  const state = typeof params.state === "string" ? params.state : "";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <GoogleMockForm redirectUri={redirectUri} state={state} />
    </div>
  );
}
