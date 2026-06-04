import { z } from "zod";
import { paginationMetaSchema } from "./pagination.js";

/**
 * Consistent API response envelope used by every endpoint (rule: patterns.md).
 *
 * Success: { success: true, data, error: null, meta? }
 * Error:   { success: false, data: null, error: { code, message, details? } }
 */

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Builds the success-envelope schema for a given data schema. */
export function apiSuccessSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    data,
    error: z.null(),
    meta: paginationMetaSchema.optional(),
  });
}

/** Discriminated envelope schema (success | error) for a given data schema. */
export function apiResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.discriminatedUnion("success", [
    apiSuccessSchema(data),
    z.object({
      success: z.literal(false),
      data: z.null(),
      error: apiErrorSchema,
    }),
  ]);
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta?: z.infer<typeof paginationMetaSchema>;
};

export type ApiFailure = {
  success: false;
  data: null;
  error: ApiError;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
