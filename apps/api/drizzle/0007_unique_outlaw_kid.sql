CREATE TYPE "public"."proposal_status" AS ENUM('ENVIADA', 'ACEITA', 'RECUSADA', 'RETIRADA');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('ABERTA', 'ADJUDICADA', 'CONCLUIDA', 'CANCELADA', 'EXPIRADA');--> statement-breakpoint
CREATE TYPE "public"."work_urgency" AS ENUM('URGENTE', 'NORMAL', 'FLEXIVEL');--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"cidade_id" uuid NOT NULL,
	"especialidade" varchar(60) NOT NULL,
	"titulo" varchar(140) NOT NULL,
	"descricao" text,
	"urgencia" "work_urgency" NOT NULL,
	"bairro" varchar(120),
	"geo" geometry(point),
	"piso_centavos" integer,
	"status" "work_order_status" DEFAULT 'ABERTA' NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_piso_check" CHECK ("work_orders"."piso_centavos" is null or "work_orders"."piso_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"valor_centavos" integer NOT NULL,
	"prazo_dias" integer,
	"mensagem" text,
	"status" "proposal_status" DEFAULT 'ENVIADA' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_one_per_professional_per_order" UNIQUE("work_order_id","professional_id"),
	CONSTRAINT "proposals_valor_check" CHECK ("proposals"."valor_centavos" > 0)
);
--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "geo" geometry(point);--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "raio_atendimento_km" integer;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_cidade_id_cities_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_orders_contractor_idx" ON "work_orders" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "work_orders_cidade_esp_idx" ON "work_orders" USING btree ("cidade_id","especialidade");--> statement-breakpoint
CREATE INDEX "work_orders_open_expiry_idx" ON "work_orders" USING btree ("expira_em") WHERE "work_orders"."status" = 'ABERTA';--> statement-breakpoint
CREATE INDEX "work_orders_geo_idx" ON "work_orders" USING gist ("geo");--> statement-breakpoint
CREATE INDEX "proposals_work_order_idx" ON "proposals" USING btree ("work_order_id");--> statement-breakpoint
CREATE INDEX "proposals_professional_idx" ON "proposals" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "professional_geo_idx" ON "professional_profiles" USING gist ("geo");