CREATE TYPE "public"."user_status" AS ENUM('ATIVO', 'SUSPENSO', 'REMOVIDO');--> statement-breakpoint
CREATE TYPE "public"."user_tipo" AS ENUM('PROFISSIONAL', 'CONTRATANTE');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(120) NOT NULL,
	"uf" char(2) NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_nome_uf_unique" UNIQUE("nome","uf")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_completo" varchar(120) NOT NULL,
	"whatsapp" varchar(20) NOT NULL,
	"email" varchar(255),
	"cidade_id" uuid,
	"tipo" "user_tipo" NOT NULL,
	"cpf" varchar(11),
	"status" "user_status" DEFAULT 'ATIVO' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_whatsapp_unique" UNIQUE("whatsapp")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cidade_id_cities_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;