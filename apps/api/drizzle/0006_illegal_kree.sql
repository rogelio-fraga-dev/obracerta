CREATE TYPE "public"."invoice_status" AS ENUM('PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA', 'ESTORNADA');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('PIX', 'CARTAO', 'BOLETO');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('PENDENTE', 'ATIVO', 'EXPIRADO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('SOLICITADO', 'APROVADO', 'RECUSADO', 'CONCLUIDO');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('EM_GRACA', 'ATIVA', 'INADIMPLENTE', 'CANCELADA');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plano" "professional_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'EM_GRACA' NOT NULL,
	"gateway" varchar(20) NOT NULL,
	"gateway_id" varchar(64),
	"valor_centavos" integer NOT NULL,
	"grace_until" timestamp with time zone,
	"proxima_cobranca" timestamp with time zone,
	"cancelado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_valor_check" CHECK ("subscriptions"."valor_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plano" "contractor_plan" NOT NULL,
	"status" "purchase_status" DEFAULT 'PENDENTE' NOT NULL,
	"gateway" varchar(20) NOT NULL,
	"gateway_id" varchar(64),
	"valor_centavos" integer NOT NULL,
	"expira_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_valor_check" CHECK ("purchases"."valor_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"purchase_id" uuid,
	"gateway" varchar(20) NOT NULL,
	"gateway_id" varchar(64),
	"valor_centavos" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'PENDENTE' NOT NULL,
	"metodo" "payment_method",
	"vencimento_em" timestamp with time zone NOT NULL,
	"pago_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_valor_check" CHECK ("invoices"."valor_centavos" > 0),
	CONSTRAINT "invoices_one_origin_check" CHECK (num_nonnulls("invoices"."subscription_id", "invoices"."purchase_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"valor_centavos" integer NOT NULL,
	"motivo" varchar(120) NOT NULL,
	"status" "refund_status" DEFAULT 'SOLICITADO' NOT NULL,
	"gateway_id" varchar(64),
	"solicitado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone,
	CONSTRAINT "refunds_valor_check" CHECK ("refunds"."valor_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway" varchar(20) NOT NULL,
	"event_id" varchar(120) NOT NULL,
	"tipo" varchar(60) NOT NULL,
	"payload" jsonb,
	"processado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_events_idempotency" UNIQUE("gateway","event_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_one_active_per_user_idx" ON "subscriptions" USING btree ("user_id") WHERE "subscriptions"."status" <> 'CANCELADA';--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_gateway_ref_idx" ON "subscriptions" USING btree ("gateway","gateway_id") WHERE "subscriptions"."gateway_id" is not null;--> statement-breakpoint
CREATE INDEX "purchases_user_idx" ON "purchases" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_gateway_ref_idx" ON "purchases" USING btree ("gateway","gateway_id") WHERE "purchases"."gateway_id" is not null;--> statement-breakpoint
CREATE INDEX "invoices_user_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_subscription_idx" ON "invoices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "invoices_due_idx" ON "invoices" USING btree ("status","vencimento_em");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_gateway_ref_idx" ON "invoices" USING btree ("gateway","gateway_id") WHERE "invoices"."gateway_id" is not null;--> statement-breakpoint
CREATE INDEX "refunds_invoice_idx" ON "refunds" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "refunds_user_idx" ON "refunds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_events_tipo_idx" ON "payment_events" USING btree ("tipo");