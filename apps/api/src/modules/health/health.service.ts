import { Injectable } from "@nestjs/common";
import { PostgresService } from "../../infrastructure/database/postgres.service.js";
import { RedisService } from "../../infrastructure/cache/redis.service.js";

export type DependencyStatus = "up" | "down";

export interface HealthReport {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  dependencies: {
    postgres: DependencyStatus;
    redis: DependencyStatus;
  };
}

/**
 * Aggregates liveness/readiness of the API's infrastructure dependencies.
 * Pure orchestration over the infra adapters — no domain logic.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly postgres: PostgresService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthReport> {
    const [postgres, redis] = await Promise.all([
      this.safePing(() => this.postgres.ping()),
      this.safePing(() => this.redis.ping()),
    ]);

    const allUp = postgres === "up" && redis === "up";

    return {
      status: allUp ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: { postgres, redis },
    };
  }

  private async safePing(ping: () => Promise<boolean>): Promise<DependencyStatus> {
    try {
      return (await ping()) ? "up" : "down";
    } catch {
      return "down";
    }
  }
}
