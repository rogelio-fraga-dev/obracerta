import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiFailure } from "@obracerta/shared";

/**
 * Catch-all exception filter producing the shared error envelope
 * ({ success: false, data: null, error: { code, message } }).
 *
 * Expected client errors (HttpException) keep their status/message; unexpected
 * errors are logged with context and returned as a generic 500 (no leak, §2.5).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttp) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiFailure = {
      success: false,
      data: null,
      error: {
        code: HttpStatus[status] ?? "INTERNAL_SERVER_ERROR",
        message: isHttp ? extractMessage(exception) : "Erro interno do servidor",
      },
    };

    response.status(status).json(body);
  }
}

function extractMessage(exception: HttpException): string {
  const res = exception.getResponse();
  if (typeof res === "string") return res;
  if (typeof res === "object" && res !== null && "message" in res) {
    const message = (res as { message: unknown }).message;
    return Array.isArray(message) ? message.join("; ") : String(message);
  }
  return exception.message;
}
