import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { GoogleIdentityPort, GoogleProfile } from "../domain/ports/google-identity.port.js";

/**
 * Adapter **fake** do Google (sem credenciais reais): manda o usuário para uma
 * página local de "consentimento simulado" (no web, mesma origem do callback),
 * que devolve um `code` = base64url de `{email, nome}`. Estrutura idêntica ao
 * fluxo real — plugar o adapter real não muda BFF nem front.
 */
@Injectable()
export class FakeGoogleIdentityAdapter implements GoogleIdentityPort {
  readonly sandbox = true;
  private readonly logger = new Logger("GoogleIdentity");

  buildAuthUrl(redirectUri: string, state: string): string {
    // Página de consentimento simulada vive na origem do callback (o web/BFF).
    const origin = new URL(redirectUri).origin;
    const url = new URL("/entrar/google-simulado", origin);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    this.logger.log(`[fake] consentimento simulado → ${url.pathname}`);
    return url.toString();
  }

  exchangeCode(code: string, _redirectUri: string): Promise<GoogleProfile> {
    try {
      const json = Buffer.from(code, "base64url").toString("utf8");
      const data = JSON.parse(json) as { email?: string; nome?: string };
      if (!data.email) throw new Error("email ausente");
      const email = data.email.trim().toLowerCase();
      return Promise.resolve({
        sub: `fake-google:${email}`,
        email,
        nome: (data.nome ?? "").trim() || email.split("@")[0]!,
      });
    } catch {
      throw new BadRequestException("Código do Google inválido.");
    }
  }
}
