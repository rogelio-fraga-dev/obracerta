# Deploy — Coolify (VPS São Paulo)

Manifestos e notas de deploy (plan §3.2 / §8 Fase 0). A configurar quando a VPS for provisionada.

## Plano

- **Host:** VPS região São Paulo, 8 GB RAM (Hostinger Cloud BR / Magalu / Latitude).
- **Orquestração:** Coolify + Docker (CI/CD, zero-downtime, rollback).
- **Reverse proxy:** Traefik (via Coolify) com TLS Let's Encrypt.
- **CDN/WAF:** Cloudflare na frente (cache do perfil público, WAF, DDoS).

## Serviços

| Serviço | Imagem / Build | Porta |
|---------|----------------|-------|
| `api` | `infra/docker/Dockerfile.api` | 3333 |
| `web` | `infra/docker/Dockerfile.web` | 3000 |
| `postgres` | gerenciado (Neon/Supabase/RDS SP) ou container | 5432 |
| `redis` | container | 6379 |

## Próximos passos (Fase 0)

- [ ] Provisionar VPS SP + instalar Coolify.
- [ ] Apontar domínio + Cloudflare + SSL.
- [ ] Configurar os 2 build packs (Dockerfile.api / Dockerfile.web).
- [ ] Secrets via Coolify env (nunca no repo).
- [ ] Deploy "hello world" ponta a ponta + medir latência vs. Hetzner.
