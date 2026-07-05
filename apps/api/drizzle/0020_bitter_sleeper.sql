CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_tipo_pk" PRIMARY KEY("user_id","tipo")
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;