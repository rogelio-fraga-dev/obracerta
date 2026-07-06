import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

/**
 * Throttler que enxerga o IP do USUÁRIO, não o do BFF. Todo o tráfego chega à
 * API via servidor Next (server-to-server), então `req.ip` é sempre o mesmo IP
 * do container web — um único atacante esgotaria o balde de login do site
 * inteiro. O BFF repassa o IP real do navegador em `x-client-ip` (rede interna
 * confiável; a API não é exposta diretamente ao público).
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Request): Promise<string> {
    const forwarded = req.headers["x-client-ip"];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip?.trim() || req.ip || "unknown";
  }
}
