CREATE TYPE "public"."booking_status" AS ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'EXPIRADO', 'INICIADO', 'CONCLUIDO', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"hora_inicio" varchar(5) NOT NULL,
	"hora_fim" varchar(5) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"especialidade" varchar(60) NOT NULL,
	"descricao" text,
	"data_servico" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'PENDENTE' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"motivo_recusa" varchar(300),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"booking_id" uuid,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone NOT NULL,
	"motivo" varchar(200),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terms_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"papel" "user_tipo" NOT NULL,
	"termo_versao" varchar(20) NOT NULL,
	"ip" varchar(45),
	"aceito_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"ator_user_id" uuid,
	"acao" varchar(80) NOT NULL,
	"entidade" varchar(60) NOT NULL,
	"entidade_id" varchar(64),
	"dados" jsonb,
	"hash_prev" varchar(64),
	"hash" varchar(64) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penalties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"booking_id" uuid,
	"motivo" varchar(80) NOT NULL,
	"pontos" integer DEFAULT 1 NOT NULL,
	"detalhe" varchar(300),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_booking_id_booking_requests_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_booking_id_booking_requests_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_ator_user_id_users_id_fk" FOREIGN KEY ("ator_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_booking_id_booking_requests_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_professional_idx" ON "availability" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "booking_professional_idx" ON "booking_requests" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "booking_contractor_idx" ON "booking_requests" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "booking_status_expira_idx" ON "booking_requests" USING btree ("status","expira_em");--> statement-breakpoint
CREATE INDEX "schedule_blocks_professional_idx" ON "schedule_blocks" USING btree ("professional_id","inicio");--> statement-breakpoint
CREATE INDEX "terms_booking_idx" ON "terms_acceptances" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "audit_entidade_idx" ON "audit_log" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE INDEX "penalties_professional_idx" ON "penalties" USING btree ("professional_id");