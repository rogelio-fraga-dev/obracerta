import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiSuccess } from "@obracerta/shared";
import { RAW_RESPONSE_KEY } from "../decorators/raw-response.decorator.js";

/**
 * Wraps every successful controller result in the shared success envelope
 * ({ success: true, data, error: null }) so the contract matches the Zod
 * `apiResponseSchema` consumed by apps/web. Errors are shaped by the filter.
 *
 * Handlers marcados com `@RawResponse()` (ex.: `/metrics` em texto Prometheus)
 * passam direto, sem envelope.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccess<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T> | T> {
    const raw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (raw) return next.handle();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        error: null,
      })),
    );
  }
}
