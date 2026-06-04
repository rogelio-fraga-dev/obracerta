CREATE TYPE "public"."contractor_plan" AS ENUM('BASICO', 'COMPLETO', 'LANCE');--> statement-breakpoint
CREATE TYPE "public"."professional_plan" AS ENUM('INICIANTE', 'PRO', 'ESPECIALISTA');--> statement-breakpoint
CREATE TABLE "professional_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"especialidades" text[] DEFAULT '{}' NOT NULL,
	"anos_experiencia" integer,
	"bairro" varchar(120),
	"foto_url" varchar(500),
	"valores" text,
	"formacao_declarada" varchar(200),
	"completude_pct" integer DEFAULT 0 NOT NULL,
	"plano" "professional_plan" DEFAULT 'INICIANTE' NOT NULL,
	"slug_publico" varchar(80) NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_profiles_slug_publico_unique" UNIQUE("slug_publico")
);
--> statement-breakpoint
CREATE TABLE "contractor_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"plano" "contractor_plan" DEFAULT 'BASICO' NOT NULL,
	"plano_expira_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contractor_profiles" ADD CONSTRAINT "contractor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;