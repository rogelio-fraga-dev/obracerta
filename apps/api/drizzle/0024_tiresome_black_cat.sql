CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" varchar(24) NOT NULL,
	"descricao" varchar(160),
	"tipo" varchar(16) NOT NULL,
	"valor" integer NOT NULL,
	"valido_ate" timestamp with time zone,
	"usos_max" integer,
	"usos_count" integer DEFAULT 0 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referred_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'RECOMPENSADO' NOT NULL,
	"cupom_indicador_id" uuid,
	"cupom_indicado_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "codigo_indicacao" varchar(12);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "indicado_por" uuid;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verificacao_status" varchar(20) DEFAULT 'NAO_ENVIADO' NOT NULL;--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verificacao_foto_url" varchar(500);--> statement-breakpoint
ALTER TABLE "professional_profiles" ADD COLUMN "verificado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "foto_url" varchar(500);--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "sub_servico" varchar(80);--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_cupom_indicador_id_coupons_id_fk" FOREIGN KEY ("cupom_indicador_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_cupom_indicado_id_coupons_id_fk" FOREIGN KEY ("cupom_indicado_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupon_redemptions_user_idx" ON "coupon_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_pair_idx" ON "coupon_redemptions" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_codigo_idx" ON "coupons" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referred_idx" ON "referrals" USING btree ("referred_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_codigo_indicacao_idx" ON "users" USING btree ("codigo_indicacao") WHERE "users"."codigo_indicacao" is not null;--> statement-breakpoint
CREATE INDEX "users_indicado_por_idx" ON "users" USING btree ("indicado_por");