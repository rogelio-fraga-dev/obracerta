import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import type { ApiSuccess } from "@obracerta/shared";

/**
 * Wraps every successful controller result in the shared success envelope
 * ({ success: true, data, error: null }) so the contract matches the Zod
 * `apiResponseSchema` consumed by apps/web. Errors are shaped by the filter.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        error: null,
      })),
    );
  }
}
