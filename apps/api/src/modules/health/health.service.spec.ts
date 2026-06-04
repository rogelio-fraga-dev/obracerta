import { Test } from "@nestjs/testing";
import { HealthService } from "./health.service.js";
import { PostgresService } from "../../infrastructure/database/postgres.service.js";
import { RedisService } from "../../infrastructure/cache/redis.service.js";

describe("HealthService", () => {
  function build(postgresUp: boolean, redisOk: () => Promise<boolean>) {
    return Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PostgresService, useValue: { ping: async () => postgresUp } },
        { provide: RedisService, useValue: { ping: redisOk } },
      ],
    }).compile();
  }

  it("reports ok when all dependencies are up", async () => {
    const moduleRef = await build(true, async () => true);
    const service = moduleRef.get(HealthService);

    const report = await service.check();

    expect(report.status).toBe("ok");
    expect(report.dependencies).toEqual({ postgres: "up", redis: "up" });
  });

  it("reports degraded and marks redis down when its ping throws", async () => {
    const moduleRef = await build(true, async () => {
      throw new Error("connection refused");
    });
    const service = moduleRef.get(HealthService);

    const report = await service.check();

    expect(report.status).toBe("degraded");
    expect(report.dependencies.postgres).toBe("up");
    expect(report.dependencies.redis).toBe("down");
  });
});
