/** Perfil mínimo devolvido pelo Google após o OAuth (OpenID Connect). */
export interface GoogleProfile {
  /** `sub` do Google — id estável do usuário no provedor. */
  sub: string;
  email: string;
  nome: string;
}

/**
 * Porta do provedor de identidade Google (OAuth 2 / code flow). Em dev, um
 * adapter **fake** simula o consentimento (página local) — mesmo desenho dos
 * gateways de pagamento/notificação: trocar o adapter, não o fluxo.
 */
export interface GoogleIdentityPort {
  /** Adapter simulado? (habilita a página de consentimento fictícia no web). */
  readonly sandbox: boolean;
  /** URL para onde enviar o usuário iniciar o consentimento. */
  buildAuthUrl(redirectUri: string, state: string): string;
  /** Troca o `code` do callback pelo perfil (token endpoint + id_token). */
  exchangeCode(code: string, redirectUri: string): Promise<GoogleProfile>;
}

export const GOOGLE_IDENTITY = Symbol("GOOGLE_IDENTITY");
