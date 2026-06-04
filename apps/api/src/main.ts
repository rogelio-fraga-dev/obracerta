import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import type { AppConfig } from "./config/configuration.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config: ConfigService<AppConfig, true> = app.get(ConfigService);

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
