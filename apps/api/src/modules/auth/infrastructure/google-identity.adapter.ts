import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import type { GoogleIdentityPort, GoogleProfile } from "../domain/ports/google-identity.port.js";

/**
 * Adapter **real** do Google (OAuth 2 code flow / OpenID Connect). Ativado
 * quando `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` estão no env (auth.module).
 *
 * O `id_token` vem direto do token endpoint do Google via TLS — nesse fluxo a
 * validação de assinatura do JWT é dispensável (recomendação do próprio guia
 * OIDC do Google); ainda assim validamos `aud` e expiração.
 */
@Injectable()
export class GoogleIdentityAdapter implements GoogleIdentityPort {
  readonly sandbox = false;
  private readonly logger = new Logger("GoogleIdentity");

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  buildAuthUrl(redirectUri: string, state: string): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  async exchangeCode(code: string, redirectUri: string): Promise<GoogleProfile> {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      this.logger.warn(`Token endpoint do Google falhou (${res.status}).`);
      throw new UnauthorizedException("Não foi possível autenticar com o Google.");
    }
    const data = (await res.json()) as { id_token?: string };
    if (!data.id_token) {
      throw new UnauthorizedException("Resposta do Google sem id_token.");
    }

    const payload = decodeJwtPayload(data.id_token);
    if (payload.aud !== this.clientId || (payload.exp ?? 0) * 1000 < Date.now()) {
      throw new UnauthorizedException("id_token do Google inválido.");
    }
    if (!payload.email) {
      throw new UnauthorizedException("Conta Google sem e-mail disponível.");
    }
    return {
      sub: payload.sub ?? `google:${payload.email}`,
      email: payload.email.toLowerCase(),
      nome: payload.name ?? payload.email.split("@")[0]!,
    };
  }
}

interface IdTokenPayload {
  sub?: string;
  aud?: string;
  exp?: number;
  email?: string;
  name?: string;
}

/** Decodifica o payload de um JWT (sem verificar assinatura — ver doc da classe). */
function decodeJwtPayload(jwt: string): IdTokenPayload {
  const part = jwt.split(".")[1];
  if (!part) throw new UnauthorizedException("id_token malformado.");
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as IdTokenPayload;
}
