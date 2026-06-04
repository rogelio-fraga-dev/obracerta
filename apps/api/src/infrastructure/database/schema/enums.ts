import { pgEnum } from "drizzle-orm/pg-core";
import { UserType, UserStatus } from "@obracerta/shared";

/**
 * Postgres enums espelhando os enums de domínio do `@obracerta/shared`.
 * Os valores são derivados do contrato compartilhado (não redigitados) para que
 * banco, validação e UI nunca entrem em drift.
 */
export const userTipoEnum = pgEnum("user_tipo", Object.values(UserType) as [string, ...string[]]);
export const userStatusEnum = pgEnum("user_status", Object.values(UserStatus) as [string, ...string[]]);
