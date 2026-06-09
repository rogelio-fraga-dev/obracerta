CREATE TYPE "public"."document_type" AS ENUM('ORCAMENTO', 'RECIBO');--> statement-breakpoint
CREATE TABLE "professional_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professional_id" uuid NOT NULL,
	"tipo" "document_type" NOT NULL,
	"cliente_nome" varchar(120) NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"observacoes" text,
	"itens" jsonb NOT NULL,
	"total_centavos" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professional_documents" ADD CONSTRAINT "professional_documents_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prof_documents_professional_idx" ON "professional_documents" USING btree ("professional_id");