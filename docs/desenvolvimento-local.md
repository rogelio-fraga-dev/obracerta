# Desenvolvimento local — ObraCerta

Guia único para rodar o sistema inteiro (back + front) em `localhost` e as
credenciais de teste geradas pelo seed. Consolida os antigos `COMO-RODAR.txt` e
`docs/credenciais-local.txt`. Sem deploy — tudo local.

> As senhas abaixo são **defaults de desenvolvimento** (dados fictícios do seed).
> Num ambiente exposto (demo na nuvem), defina `SEED_ADMIN_PASSWORD` e
> `SEED_USER_PASSWORD` **antes** de rodar o seed — senão o admin fica com senha pública.

---

## 0. Pré-requisitos (uma vez por máquina)

- **Node.js ≥ 22** (LTS) — https://nodejs.org
- **pnpm ≥ 9** — `npm i -g pnpm@9.15.0` (no Windows, `corepack enable` às vezes pede admin; o `npm i -g` é o caminho que funciona)
- **Docker Desktop** — precisa estar **aberto/rodando** antes do passo 4
- **Git**

Conferir: `node -v` (v22.x) · `pnpm -v` (9.x) · `docker --version`

## 1. Clonar

```bash
git clone https://github.com/rogelio-fraga-dev/obracerta.git
cd obracerta
```

## 2. Criar o `.env`

O `.env` **não vai pro git** (ignorado de propósito). Use o template — os valores
padrão **já funcionam** para dev local:

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
```

> **Windows:** se a migração/seed reclamar de conexão, troque no `.env` `localhost`
> por `127.0.0.1` em `DATABASE_URL` e `REDIS_URL` — o `localhost` às vezes resolve
> para IPv6 (`::1`) e quebra o cliente do Postgres.

## 3. Instalar dependências

```bash
pnpm install
```

## 4. Subir a infra (Postgres + Redis + MinIO)

Com o Docker Desktop aberto:

```bash
pnpm docker:up      # Postgres 16/PostGIS :5432 · Redis :6379 · MinIO :9000/:9001
pnpm docker:down    # parar
pnpm docker:logs    # logs
```

> **Conflito de porta:** se a `5432` já estiver ocupada por outro projeto, pare o
> outro container antes — os dois não coexistem na mesma porta.

## 5. Criar as tabelas (migrações)

```bash
pnpm --filter @obracerta/api db:migrate
```

## 6. Popular o banco (seed com usuários de teste)

```bash
# Linux/macOS
DATABASE_URL=postgresql://obracerta:obracerta@127.0.0.1:5432/obracerta \
  pnpm --filter @obracerta/api exec tsx src/infrastructure/database/seed-completo.ts

# Windows (PowerShell)
$env:DATABASE_URL="postgresql://obracerta:obracerta@127.0.0.1:5432/obracerta"
pnpm --filter @obracerta/api exec tsx src/infrastructure/database/seed-completo.ts
```

## 7. Rodar (back + front juntos)

```bash
pnpm dev      # Front: http://localhost:3000 · API: http://localhost:3333 (GET /health)
```

Separado: `pnpm --filter @obracerta/api dev` · `pnpm --filter @obracerta/web dev`.

## 8. Checagens (opcional)

```bash
pnpm --filter @obracerta/api test
pnpm --filter @obracerta/shared test
pnpm typecheck
pnpm lint
```

> **Não** rode `next build` com o `pnpm dev` no ar — corrompe o `.next` do dev.
> Para validar o front use `typecheck`/`lint`.

---

## Credenciais de teste (geradas pelo seed)

Login por **e-mail + senha** em `http://localhost:3000/entrar` (aba "E-mail e senha").
O campo é `password`. Todas as senhas = `senha@123`, **exceto o admin** (`admin@123`).

| Papel | E-mail | Senha | Observação |
|---|---|---|---|
| Admin (total) | `admin@example.com` | `admin@123` | painel `/admin`, moderação, financeiro, analytics |
| Contratante PF (LANCE) | `carlos@example.com` | `senha@123` | tem obras publicadas (aberta/adjudicada/concluída) |
| Contratante PF (COMPLETO) | `aline@example.com` | `senha@123` | — |
| Empresa PJ | `empresa@example.com` | `senha@123` | CNPJ `11444777000161` · Construtora Forte |
| Profissional PRO | `joana@example.com` | `senha@123` | `/joana-gesseira-silva` · avaliação respondida |
| Profissional INICIANTE | `pedro@example.com` | `senha@123` | `/pedro-pereira` |
| Profissional ESPECIALISTA | `marcos@example.com` | `senha@123` | `/marcos-eletricista` · ferramentas + portfólio |
| Profissional PRO (SUSPENSO) | `roberto@example.com` | `senha@123` | login bloqueado — use como admin p/ ver moderação |

CNPJ válido para testar cadastro de Empresa: `11444777000161`.
Login por WhatsApp (OTP) também funciona local — o código de 6 dígitos aparece no log da API.

## Repopular o banco (reset)

Repita os passos 4 → 5 → 6.
