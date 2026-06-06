import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module.js";
import type { AppConfig } from "./config/configuration.js";

interface TracedRequest extends Request {
  requestId?: string;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config: ConfigService<AppConfig, true> = app.get(ConfigService);

  // Correlation id (observabilidade Fase 6): reaproveita o `x-request-id` recebido
  // ou gera um; ecoa na resposta. O MetricsInterceptor o inclui no log estruturado.
  app.use((req: TracedRequest, res: Response, next: NextFunction) => {
    const incoming = req.headers["x-request-id"];
    req.requestId = (typeof incoming === "string" && incoming) || randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  // Security headers (hardening Fase 6). API só responde JSON, então o foco é
  // anti-sniffing/clickjacking/leak de referrer; o CSP do HTML é do Next (Fase 7).
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.removeHeader("X-Powered-By");
    next();
  });

  // The global filter + interceptor are registered in AppModule (DI-aware).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: config.get("corsOrigins", { infer: true }),
    credentials: true,
  });

  const port = config.get("port", { infer: true });
  await app.listen(port);
  new Logger("Bootstrap").log(`API listening on http://localhost:${port}`);
}

void bootstrap();
