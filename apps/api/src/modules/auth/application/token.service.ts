import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthTokens, JwtClaims, User } from "@obracerta/shared";
import type { AppConfig } from "../../../config/configuration.js";
import { RedisService } from "../../../infrastructure/cache/redis.service.js";

const refreshKey = (token: string): string => `session:refresh:${token}`;
const SECONDS_PER_DAY = 86_400;

/**
 * Emissão e rotação de tokens. Padrão access (JWT curto) + refresh (token opaco
 * com sessão em Redis). O refresh é rotacionado a cada uso (mitiga replay).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async issue(user: User): Promise<AuthTokens> {
    const claims: JwtClaims = { sub: user.id, whatsapp: user.whatsapp };
    const accessToken = await this.jwt.signAsync(claims);

    const refreshToken = randomUUID();
    const days = this.config.get("jwtRefreshTtlDays", { infer: true });
    await this.redis.client.set(refreshKey(refreshToken), user.id, "EX", days * SECONDS_PER_DAY);

    return { accessToken, refreshToken };
  }

  /** Valida e consome (rotaciona) um refresh token; devolve o userId associado. */
  async consumeRefresh(refreshToken: string): Promise<string | null> {
    const key = refreshKey(refreshToken);
    const userId = await this.redis.client.get(key);
    if (!userId) return null;
    await this.redis.client.del(key);
    return userId;
  }

  /** Revoga uma sessão (logout). */
  async revoke(refreshToken: string): Promise<void> {
    await this.redis.client.del(refreshKey(refreshToken));
  }
}
