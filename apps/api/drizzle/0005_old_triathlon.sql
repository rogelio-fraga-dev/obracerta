CREATE TYPE "public"."report_status" AS ENUM('ABERTA', 'EM_ANALISE', 'PROCEDENTE', 'IMPROCEDENTE');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDENTE', 'REVELADA', 'OCULTA');--> statement-breakpoint
CREATE TYPE "public"."suspension_status" AS ENUM('ATIVA', 'APELADA', 'REVOGADA', 'EXPIRADA');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"alvo_id" uuid NOT NULL,
	"papel_autor" "user_tipo" NOT NULL,
	"nota" integer NOT NULL,
	"comentario" text,
	"status" "review_status" DEFAULT 'PENDENTE' NOT NULL,
	"prazo_em" timestamp with time zone NOT NULL,
	"revelada_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_one_per_author_per_booking" UNIQUE("booking_id","autor_id"),
	CONSTRAINT "reviews_nota_check" CHECK ("reviews"."nota" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_responses_one_per_review" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"codigo" varchar(40) NOT NULL,
	"concedido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"revogado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" varchar(60) NOT NULL,
	"referencia_id" varchar(64),
	"dados" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reputation_events_seq_unique" UNIQUE("seq")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"denunciante_id" uuid,
	"entidade" varchar(20) NOT NULL,
	"entidade_id" varchar(64) NOT NULL,
	"motivo" varchar(80) NOT NULL,
	"detalhe" text,
	"status" "report_status" DEFAULT 'ABERTA' NOT NULL,
	"resolvido_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_id" uuid,
	"motivo" varchar(120) NOT NULL,
	"status" "suspension_status" DEFAULT 'ATIVA' NOT NULL,
	"inicio_em" timestamp with time zone DEFAULT now() NOT NULL,
	"fim_em" timestamp with time zone,
	"apelacao_texto" text,
	"apelada_em" timestamp with time zone,
	"resolvido_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_booking_requests_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_autor_id_users_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_alvo_id_users_id_fk" FOREIGN KEY ("alvo_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_autor_id_users_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_denunciante_id_users_id_fk" FOREIGN KEY ("denunciante_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_suspensions" ADD CONSTRAINT "account_suspensions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_suspensions" ADD CONSTRAINT "account_suspensions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_alvo_idx" ON "reviews" USING btree ("alvo_id");--> statement-breakpoint
CREATE INDEX "reviews_booking_idx" ON "reviews" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "reviews_pending_prazo_idx" ON "reviews" USING btree ("prazo_em") WHERE "reviews"."status" = 'PENDENTE';--> statement-breakpoint
CREATE INDEX "review_responses_review_idx" ON "review_responses" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "badges_user_idx" ON "badges" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "badges_one_active_per_code_idx" ON "badges" USING btree ("user_id","codigo") WHERE "badges"."revogado_em" is null;--> statement-breakpoint
CREATE INDEX "reputation_events_user_idx" ON "reputation_events" USING btree ("user_id","criado_em");--> statement-breakpoint
CREATE INDEX "reports_entidade_idx" ON "reports" USING btree ("entidade","entidade_id");--> statement-breakpoint
CREATE INDEX "reports_open_idx" ON "reports" USING btree ("criado_em") WHERE "reports"."status" = 'ABERTA';--> statement-breakpoint
CREATE INDEX "account_suspensions_user_idx" ON "account_suspensions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_suspensions_active_idx" ON "account_suspensions" USING btree ("fim_em") WHERE "account_suspensions"."status" = 'ATIVA';