# Diagrama C4 — ObraCerta / QuemFaz (inicial)

> Artefato da Fase 0 (`docs/PLANO_DE_IMPLEMENTACAO.md` §8). Níveis 1 (Contexto) e 2
> (Container). Níveis 3 (Componente) e 4 (Código) entram quando os domínios forem
> implementados (Fase 1+).

## O que é o "C4"

C4 é uma forma de desenhar arquitetura de software em **4 níveis de zoom**, do mais
amplo ao mais detalhado — como um mapa que você vai aproximando:

1. **Contexto (System Context):** o sistema como uma "caixa preta" e quem/o que
   fala com ele (pessoas e sistemas externos). Responde: *"o que é isso e com quem
   conversa?"*
2. **Container:** abre a caixa e mostra as **unidades executáveis/armazenáveis**
   (app web, API, banco, cache). "Container" aqui **não é Docker** — é "coisa que
   roda ou guarda dado". Responde: *"de quais peças de alto nível isso é feito?"*
3. **Componente:** abre um container e mostra os blocos internos (módulos/serviços).
4. **Código:** classes/funções (raramente desenhado à mão; o código é a fonte).

**Por que usar:** comunica a arquitetura pra qualquer pessoa sem afogar em detalhe.
Cada nível tem o público certo (Contexto → negócio; Container → time técnico).

---

## Nível 1 — Contexto

Quem usa o ObraCerta e de quais serviços externos ele depende.

```mermaid
C4Context
    title Nível 1 - Contexto: ObraCerta

    Person(prof, "Profissional", "Prestador da construção civil que oferece serviços e recebe lances/obras")
    Person(contratante, "Contratante", "Quem busca e contrata profissionais")
    Person(admin, "Admin / Moderador", "Modera denúncias, suspensões e apelações")

    System(obracerta, "ObraCerta", "Marketplace vertical bilateral: reputacao verificada, agenda, lances sigilosos, avaliacao dupla-cega. Web responsivo + PWA")

    System_Ext(whatsapp, "WhatsApp Cloud API (Meta)", "OTP e notificacoes")
    System_Ext(sms, "Provedor SMS", "Fallback de OTP")
    System_Ext(asaas, "Asaas", "Assinaturas, Pix e faturas")
    System_Ext(cloudflare, "Cloudflare", "DNS, CDN, WAF, SSL")

    Rel(prof, obracerta, "Cadastra perfil, recebe lances/obras, responde avaliacoes", "HTTPS")
    Rel(contratante, obracerta, "Busca, contrata, avalia", "HTTPS")
    Rel(admin, obracerta, "Modera", "HTTPS")

    Rel(obracerta, whatsapp, "Envia OTP e notificacoes", "HTTPS")
    Rel(obracerta, sms, "Fallback de OTP", "HTTPS")
    Rel(obracerta, asaas, "Cria cobrancas; recebe webhooks", "HTTPS")
    Rel(cloudflare, obracerta, "Roteia trafego (proxy/WAF)", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

> Observação de privacidade (LGPD, plan §9): dados sensíveis como CPF nunca trafegam
> nas respostas públicas — ver `userSchema` em `packages/shared`.

---

## Nível 2 — Container

Abrindo a caixa "ObraCerta": as peças que rodam/guardam dado e como conversam.
Reflete o estado **da Fase 0** (a regra de negócio mora dentro da API a partir da Fase 1).

```mermaid
C4Container
    title Nivel 2 - Container: ObraCerta

    Person(prof, "Profissional", "")
    Person(contratante, "Contratante", "")

    System_Boundary(sb, "ObraCerta") {
        Container(web, "Web App + PWA", "Next.js 15 (App Router)", "Paginas publicas (SSR/SSG) e area logada instalavel. Rotas (public) e (app)")
        Container(api, "API", "NestJS (Node 22, hexagonal/DDD, monolito modular)", "Regras de negocio, autenticacao, envelope de resposta global. Hoje: /health")
        ContainerDb(db, "Banco de dados", "PostgreSQL 16 + PostGIS", "Dados relacionais + busca geo (ST_DWithin) e textual (pg_trgm/unaccent)")
        ContainerDb(redis, "Cache / filas", "Redis 7", "Sessoes, rate-limiting, jobs assincronos")
    }

    Container_Ext(shared, "packages/shared", "TypeScript + Zod", "Contrato compartilhado em tempo de build: schemas validam (runtime) e geram os tipos consumidos por web e api")

    System_Ext(whatsapp, "WhatsApp Cloud API", "")
    System_Ext(asaas, "Asaas", "")

    Rel(prof, web, "Usa", "HTTPS")
    Rel(contratante, web, "Usa", "HTTPS")
    Rel(web, api, "Chama endpoints (envelope {success,data,error})", "JSON/HTTPS")

    Rel(api, db, "Le/escreve (via Drizzle, atras de repository ports)", "SQL/TCP")
    Rel(api, redis, "Cacheia / enfileira", "RESP/TCP")
    Rel(api, whatsapp, "OTP e notificacoes", "HTTPS")
    Rel(api, asaas, "Cobrancas e webhooks", "HTTPS")

    Rel(web, shared, "Importa tipos/schemas", "build-time")
    Rel(api, shared, "Importa tipos/schemas", "build-time")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

### Notas de leitura

- **`packages/shared` não é um processo que roda** — é uma biblioteca compartilhada
  consumida em **tempo de build** por web e API. Desenhei como `Container_Ext`
  tracejado só para deixar visível a decisão "load-bearing" do type-safety end-to-end.
- **"Container" ≠ Docker.** O Postgres e o Redis *também* rodam em Docker localmente,
  mas aqui eles aparecem por serem unidades de dados da arquitetura, não por causa do
  Docker.
- **Drizzle atrás de ports:** a API não acopla a regra de negócio ao banco — fala com
  repositórios (interfaces). Trocar o ORM fica contido à infraestrutura (ver ADR-0001).
- **Deploy (futuro):** em produção, Cloudflare → Coolify (VPS São Paulo) servindo os
  containers `web` e `api`; Postgres e Redis gerenciados no mesmo host. Adiado: a
  Fase 0 é validada em localhost.

---

## Referências

- `docs/ADRs/0001-stack.md` — decisões de stack (inclui escolha do Drizzle).
- `docs/PLANO_DE_IMPLEMENTACAO.md` — §4 (modelo de dados), §8 (roadmap).
- `apps/api/README.md` — convenção de camadas hexagonais.
