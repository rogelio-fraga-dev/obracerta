-- Extensões necessárias (plan §3.2). Executado uma vez na criação do volume.
-- PostGIS: busca geoespacial (raio de atendimento / bairro).
-- pg_trgm: busca PT-BR tolerante a erro de digitação.
-- unaccent: busca ignorando acentos.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
