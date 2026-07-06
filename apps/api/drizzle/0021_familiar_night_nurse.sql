CREATE INDEX "booking_pending_professional_idx" ON "booking_requests" USING btree ("professional_id") WHERE "booking_requests"."status" = 'PENDENTE';--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_principal_idx" ON "addresses" USING btree ("user_id") WHERE "addresses"."principal" = true;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
-- Agenda sem sobreposição GARANTIDA PELO BANCO (não só pelo check-then-act da
-- aplicação): dois bloqueios de booking do mesmo profissional não podem colidir.
-- Escopo: só bloqueios derivados de booking (manuais podem sobrepor historicamente).
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_booking_no_overlap"
  EXCLUDE USING gist ("professional_id" WITH =, tstzrange("inicio", "fim") WITH &&)
  WHERE ("booking_id" IS NOT NULL);