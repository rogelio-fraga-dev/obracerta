import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthService, type HealthReport } from "./health.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Liveness + dependency readiness. Returns 200 when healthy and 503 when any
   * dependency is down so load balancers / uptime monitors react correctly.
   * `passthrough: true` keeps the response-envelope interceptor in the pipeline.
   */
  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const report = await this.healthService.check();
    res.status(report.status === "ok" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return report;
  }
}
