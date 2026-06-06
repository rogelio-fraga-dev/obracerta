import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { catchError, tap, throwError } from "rxjs";
import { MetricsService } from "../application/metrics.service.js";

interface TracedRequest extends Request {
  requestId?: string;
}

/**
 * Interceptor global de observabilidade (roadmap §10). Para cada requisição: mede a
 * duração, registra a métrica (por método/rota/status) e emite um **log estruturado**
 * (JSON) com o `requestId` (correlation id). A `rota` usada é o PADRÃO (`/x/:id`),
 * não a URL crua — mantém a cardinalidade das métricas baixa.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger("http");

  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): ReturnType<CallHandler["handle"]> {
    if (context.getType() !== "http") return next.handle();
    const start = Date.now();
    const req = context.switchToHttp().getRequest<TracedRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const method = req.method;
    const route = req.route?.path ?? "unmatched";

    const finish = (status: number): void => {
      const durationMs = Date.now() - start;
      this.metrics.record(method, route, status, durationMs);
      this.logger.log(
        JSON.stringify({ requestId: req.requestId, method, route, status, durationMs }),
      );
    };

    return next.handle().pipe(
      tap(() => finish(res.statusCode)),
      catchError((err: unknown) => {
        finish(err instanceof HttpException ? err.getStatus() : 500);
        return throwError(() => err);
      }),
    );
  }
}
