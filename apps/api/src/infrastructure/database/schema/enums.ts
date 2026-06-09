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
  SubscriptionStatus,
  PurchaseStatus,
  InvoiceStatus,
  RefundStatus,
  PaymentMethod,
  WorkUrgency,
  WorkOrderStatus,
  ProposalStatus,
  DocumentType,
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
export const subscriptionStatusEnum = pgEnum(
  "subscription_status",
  Object.values(SubscriptionStatus) as [string, ...string[]],
);
export const purchaseStatusEnum = pgEnum(
  "purchase_status",
  Object.values(PurchaseStatus) as [string, ...string[]],
);
export const invoiceStatusEnum = pgEnum(
  "invoice_status",
  Object.values(InvoiceStatus) as [string, ...string[]],
);
export const refundStatusEnum = pgEnum(
  "refund_status",
  Object.values(RefundStatus) as [string, ...string[]],
);
export const paymentMethodEnum = pgEnum(
  "payment_method",
  Object.values(PaymentMethod) as [string, ...string[]],
);
export const workUrgencyEnum = pgEnum(
  "work_urgency",
  Object.values(WorkUrgency) as [string, ...string[]],
);
export const workOrderStatusEnum = pgEnum(
  "work_order_status",
  Object.values(WorkOrderStatus) as [string, ...string[]],
);
export const proposalStatusEnum = pgEnum(
  "proposal_status",
  Object.values(ProposalStatus) as [string, ...string[]],
);
export const documentTypeEnum = pgEnum(
  "document_type",
  Object.values(DocumentType) as [string, ...string[]],
);
