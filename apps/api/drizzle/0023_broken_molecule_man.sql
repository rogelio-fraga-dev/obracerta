ALTER TABLE "company_profiles" ADD COLUMN "slug" varchar(90);--> statement-breakpoint
ALTER TABLE "company_professionals" ADD COLUMN "confirmado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company_professionals" ADD COLUMN "confirmado_em" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "company_slug_unique_idx" ON "company_profiles" USING btree ("slug") WHERE "company_profiles"."slug" is not null;--> statement-breakpoint
CREATE INDEX "company_professionals_professional_idx" ON "company_professionals" USING btree ("professional_id");--> statement-breakpoint
-- Backfill: gera slug para empresas já existentes (diretório público). Base =
-- nome fantasia/razão social sem acento/kebab; colisões ganham sufixo numérico.
UPDATE "company_profiles" cp SET "slug" = sub.final_slug
FROM (
  SELECT user_id,
    CASE WHEN rn = 1 THEN base_slug ELSE base_slug || '-' || rn END AS final_slug
  FROM (
    SELECT user_id, base_slug,
      row_number() OVER (PARTITION BY base_slug ORDER BY criado_em) AS rn
    FROM (
      SELECT user_id, criado_em,
        coalesce(
          nullif(
            regexp_replace(
              trim(both '-' from
                regexp_replace(
                  lower(translate(coalesce(nullif(nome_fantasia,''), nullif(razao_social,''), 'empresa'),
                    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
                '[^a-z0-9]+', '-', 'g')
              ),
            '-+', '-', 'g'),
          ''),
        'empresa') AS base_slug
      FROM "company_profiles" WHERE "slug" IS NULL
    ) a
  ) b
) sub
WHERE cp.user_id = sub.user_id;
