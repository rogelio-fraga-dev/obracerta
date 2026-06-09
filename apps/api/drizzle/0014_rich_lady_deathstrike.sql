ALTER TYPE "public"."user_tipo" ADD VALUE 'EMPRESA';--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"cnpj" varchar(14),
	"razao_social" varchar(160),
	"nome_fantasia" varchar(160),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_cnpj_unique_idx" ON "company_profiles" USING btree ("cnpj") WHERE "company_profiles"."cnpj" is not null;