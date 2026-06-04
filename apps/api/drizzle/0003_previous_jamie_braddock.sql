ALTER TABLE "booking_requests" DROP CONSTRAINT "booking_requests_contractor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_requests" DROP CONSTRAINT "booking_requests_professional_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "terms_acceptances" DROP CONSTRAINT "terms_acceptances_booking_id_booking_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "terms_acceptances" DROP CONSTRAINT "terms_acceptances_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "booking_status_expira_idx";--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_professional_id_users_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_booking_id_booking_requests_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_pending_expiry_idx" ON "booking_requests" USING btree ("expira_em") WHERE "booking_requests"."status" = 'PENDENTE';--> statement-breakpoint
CREATE INDEX "booking_pending_contractor_esp_idx" ON "booking_requests" USING btree ("contractor_id","especialidade") WHERE "booking_requests"."status" = 'PENDENTE';--> statement-breakpoint
CREATE INDEX "penalties_booking_idx" ON "penalties" USING btree ("booking_id");--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_unique_slot" UNIQUE("professional_id","dia_semana","hora_inicio","hora_fim");--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_one_per_user_per_booking" UNIQUE("booking_id","user_id");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_seq_unique" UNIQUE("seq");--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_dia_semana_check" CHECK ("availability"."dia_semana" between 0 and 6);--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_hora_check" CHECK ("availability"."hora_inicio" < "availability"."hora_fim");--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_range_check" CHECK ("schedule_blocks"."inicio" < "schedule_blocks"."fim");--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_motivo_check" CHECK ("schedule_blocks"."booking_id" is not null or "schedule_blocks"."motivo" is not null);--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_chain_continuity_check" CHECK ("audit_log"."seq" = 1 or "audit_log"."hash_prev" is not null);--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_pontos_check" CHECK ("penalties"."pontos" > 0);