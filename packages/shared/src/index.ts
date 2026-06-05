/**
 * @obracerta/shared — tipos e schemas Zod compartilhados front↔back.
 *
 * Re-exports `zod` so consumers can import a single instance from here if desired.
 */
export { z } from "zod";

export * from "./primitives.js";
export * from "./enums.js";
export * from "./pagination.js";
export * from "./api-response.js";
export * from "./user.js";
export * from "./auth.js";
export * from "./profiles.js";
export * from "./availability.js";
export * from "./booking.js";
export * from "./terms.js";
export * from "./penalties.js";
export * from "./reviews.js";
export * from "./reputation.js";
export * from "./moderation.js";
