# Deploy de demo numa EC2 com Docker + HTTPS

Objetivo: subir o ObraCerta numa única EC2 e gerar **um link HTTPS público**
(`https://app.SEU-IP.sslip.io`) para mostrar à stakeholder. Só você e ela acessam.

Arquitetura: 1 EC2 rodando 6 containers (Postgres/PostGIS, Redis, MinIO, API, Web,
Caddy). **Só o Caddy fica exposto** (80/443). A API é interna — o navegador só fala
com o front (BFF), então não há CORS nem IP "assado" no build.

> **Estratégia:** as imagens são **buildadas na própria EC2** (sem Docker Hub).
> Por isso a instância precisa de **4 GB+ de RAM**. Recomendado: **`c7i-flex.large`
> (4 GiB)** ou `m7i-flex.large` (8 GiB). **Não use t3.micro/small** (1–2 GB) — o
> `next build` estoura a memória. Pare a instância (Stop) fora das demos: o free tier
> cobre as horas e o disco custa centavos.

---

## Parte 1 — Criar a EC2 (console AWS)

1. **EC2 → Launch instance.**
2. **Name:** `obracerta-demo`.
3. **AMI:** *Amazon Linux 2023* (free tier eligible).
4. **Instance type:** `c7i-flex.large` (4 GiB). *(m7i-flex.large se quiser folga.)*
5. **Key pair:** crie um novo (`obracerta-key`), baixe o `.pem` e guarde — é como
   você entra via SSH.
6. **Network settings → Edit → Security group** (novo, `obracerta-sg`), inbound:

   | Tipo  | Porta | Origem | Por quê |
   |-------|-------|--------|---------|
   | SSH   | 22    | **My IP** | só você administra |
   | HTTP  | 80    | Anywhere (0.0.0.0/0) | Let's Encrypt valida o certificado por aqui |
   | HTTPS | 443   | Anywhere (0.0.0.0/0) | o link da stakeholder |

   > O TLS automático precisa de 80/443 abertas pro mundo (o Let's Encrypt precisa
   > alcançar o host). **Não** abra 5432/6379/9000 — ficam internos.

7. **Configure storage:** 30 GB gp3 (free tier cobre até 30 GB).
8. **Advanced details → User data:** cole o conteúdo de
   [`infra/docker/ec2-user-data.sh`](../infra/docker/ec2-user-data.sh)
   (instala Docker + Compose e cria swap).
9. **Launch instance.**

### Elastic IP (recomendado — IP fixo)

Sem isso o IP muda toda vez que liga/desliga (e o link sslip.io muda junto).
**EC2 → Elastic IPs → Allocate → Associate** à instância. Associado a uma instância
**ligada**, é grátis no free tier. Anote o **IPv4 público**. Ex.: `54.207.10.20`.

---

## Parte 2 — Colocar o código na EC2

Entre via SSH (troque `SEU_IP` e o caminho do `.pem`):

```bash
ssh -i obracerta-key.pem ec2-user@SEU_IP
```

**Opção A — git clone** (se o repo está no GitHub; mais fácil de atualizar depois):

```bash
cd ~
git clone <URL_DO_SEU_REPO> obracerta   # repo privado pede token/PAT
cd obracerta
```

**Opção B — enviar o código da sua máquina** (sem depender do GitHub). Na **sua
máquina** (Git Bash), a partir da raiz do repo:

```bash
tar --exclude=node_modules --exclude=.next --exclude=.turbo --exclude=.git \
    -czf /tmp/obracerta-src.tgz .
scp -i obracerta-key.pem /tmp/obracerta-src.tgz ec2-user@SEU_IP:~/
```

Depois, na EC2:

```bash
mkdir -p ~/obracerta && tar -xzf ~/obracerta-src.tgz -C ~/obracerta && cd ~/obracerta
```

---

## Parte 3 — Configurar, buildar e subir (na EC2, dentro de `~/obracerta`)

1. Crie o `.env.prod` a partir do exemplo:

   ```bash
   cp infra/docker/.env.prod.example infra/docker/.env.prod
   nano infra/docker/.env.prod
   ```

   Preencha (exemplo com IP `54.207.10.20` — repare nos **hífens**):

   ```
   PUBLIC_HOST=app.54-207-10-20.sslip.io
   FILES_HOST=files.54-207-10-20.sslip.io
   PUBLIC_URL=https://app.54-207-10-20.sslip.io
   FILES_URL=https://files.54-207-10-20.sslip.io
   ACME_EMAIL=voce@exemplo.com

   POSTGRES_PASSWORD=<openssl rand -hex 16>
   JWT_SECRET=<openssl rand -hex 32>
   S3_SECRET_KEY=<openssl rand -hex 16>
   ```

   > Gere segredos na própria EC2: `openssl rand -hex 16` / `-hex 32`.

2. Builde e suba (rode da **raiz** `~/obracerta`; o build é o passo demorado, ~3–6 min):

   ```bash
   docker compose --env-file infra/docker/.env.prod \
     -f infra/docker/docker-compose.prod.yml up -d --build
   ```

3. Migrations + seed (popula dados de demo):

   ```bash
   docker compose --env-file infra/docker/.env.prod \
     -f infra/docker/docker-compose.prod.yml \
     run --rm api sh -lc "pnpm db:migrate && pnpm db:seed"
   ```

4. Acompanhe até o Caddy emitir o certificado (~30–60s na 1ª vez):

   ```bash
   docker compose --env-file infra/docker/.env.prod \
     -f infra/docker/docker-compose.prod.yml logs -f caddy web api
   ```

Pronto: abra **`https://app.SEU-IP.sslip.io`**. Credenciais de demo em
`docs/credenciais-local.txt`.

---

## Operação do dia a dia

Atalho: exporte uma vez por sessão SSH para encurtar os comandos:

```bash
cd ~/obracerta
alias dcp='docker compose --env-file infra/docker/.env.prod -f infra/docker/docker-compose.prod.yml'

dcp ps                 # status dos containers
dcp logs -f web api    # logs
dcp down               # parar tudo
dcp up -d --build      # rebuild + subir (depois de atualizar o código)
docker stats --no-stream && free -h   # uso de RAM (importante)
```

Atualizar o código: `git pull` (Opção A) ou reenviar o tar (Opção B) e rodar
`dcp up -d --build` de novo.

> **Custo:** pare a instância (**Stop**, não Terminate) fora das demos — você só paga
> o disco (centavos). Mantenha o Elastic IP associado para não perder o link.

## Troubleshooting

- **Build morre / "killed":** falta de RAM no build. Confirme que está numa instância
  4 GB+ e que o swap subiu (`free -h` deve mostrar swap). Suba pra `m7i-flex.large`.
- **Certificado não emite / "not secure":** 80 e 443 precisam estar abertos pra
  `0.0.0.0/0` no security group, e `PUBLIC_HOST` com hífens. Veja `dcp logs caddy`.
- **Site lento / container reiniciando:** RAM apertada. `free -h` / `docker stats`.
  Comente o `minio` no compose (perde só upload de fotos) ou suba o tipo da instância.
- **API não sobe:** `dcp logs api` — geralmente env faltando no `.env.prod` (o boot
  valida com Zod e falha rápido).
