import { pgEnum } from "drizzle-orm/pg-core";
import {
  UserType,
  UserStatus,
  ProfessionalPlan,
  ContractorPlan,
  BookingStatus,
  ReviewStatus,
  ReportStatus,
  SuspensionStatus,
} from "@obracerta/shared";

/**
 * Postgres enums espelhando os enums de domínio do `@obracerta/shared`.
 * Os valores são derivados do contrato compartilhado (não redigitados) para que
 * banco, validação e UI nunca entrem em drift.
 */
export const userTipoEnum = pgEnum("user_tipo", Object.values(UserType) as [string, ...string[]]);
export const userStatusEnum = pgEnum("user_status", Object.values(UserStatus) as [string, ...string[]]);
export const professionalPlanEnum = pgEnum(
  "professional_plan",
  Object.values(ProfessionalPlan) as [string, ...string[]],
);
export const contractorPlanEnum = pgEnum(
  "contractor_plan",
  Object.values(ContractorPlan) as [string, ...string[]],
);
export const bookingStatusEnum = pgEnum(
  "booking_status",
  Object.values(BookingStatus) as [string, ...string[]],
);
export const reviewStatusEnum = pgEnum(
  "review_status",
  Object.values(ReviewStatus) as [string, ...string[]],
);
export const reportStatusEnum = pgEnum(
  "report_status",
  Object.values(ReportStatus) as [string, ...string[]],
);
export const suspensionStatusEnum = pgEnum(
  "suspension_status",
  Object.values(SuspensionStatus) as [string, ...string[]],
);
