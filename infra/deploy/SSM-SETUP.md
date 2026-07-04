# Deploy via CI usando AWS SSM (sem abrir a porta 22)

O job `deploy` do `.github/workflows/deploy.yml` manda o comando de deploy para a
EC2 pelo **AWS Systems Manager (SSM) Run Command**, em vez de SSH. Vantagem:
**nenhuma porta de entrada aberta** no security group — o agente SSM da instância
faz uma conexão de saída para a AWS e recebe o comando.

Fluxo: GitHub Actions assume uma **role AWS via OIDC** (sem chave de longa duração)
→ `aws ssm send-command` → o agente na EC2 roda `infra/deploy/remote-deploy.sh`
como `ec2-user`.

Você precisa configurar 3 coisas uma vez. Os comandos abaixo rodam da sua máquina
(ou do CloudShell) com um usuário AWS que tenha permissão de IAM/EC2/SSM.

> Valores já preenchidos: repo `rogelio-fraga-dev/obracerta`, branch `master`,
> região `us-east-1`. Ajuste se algo mudar.

---

## 1. Garantir que a EC2 está gerenciada pelo SSM

O AL2023 já vem com o agente SSM. Falta a instância ter uma **instance profile**
com a policy `AmazonSSMManagedInstanceCore`.

```bash
INSTANCE_ID=i-xxxxxxxxxxxxxxxxx   # o id da sua EC2

# A instância já aparece no SSM?
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --query "InstanceInformationList[].PingStatus" --region us-east-1
# → "Online" = pronto (pule para o passo 2).
```

Se **não** aparecer, anexe uma instance profile com a policy do SSM:

```bash
# Cria a role da instância (se ainda não existir)
aws iam create-role --role-name obracerta-ec2-ssm \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'
aws iam attach-role-policy --role-name obracerta-ec2-ssm \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam create-instance-profile --instance-profile-name obracerta-ec2-ssm
aws iam add-role-to-instance-profile \
  --instance-profile-name obracerta-ec2-ssm --role-name obracerta-ec2-ssm

# Anexa à instância (não reinicia a EC2)
aws ec2 associate-iam-instance-profile \
  --instance-id "$INSTANCE_ID" \
  --iam-instance-profile Name=obracerta-ec2-ssm --region us-east-1
```

Aguarde ~2min e repita o `describe-instance-information` até dar `Online`.

---

## 2. Criar o provedor OIDC do GitHub + a role de deploy

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 2.1 Provedor OIDC do GitHub (ignore o erro se já existir na conta)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 || true

# 2.2 Role que o GitHub Actions assume — confia SÓ neste repo
cat > trust.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:rogelio-fraga-dev/obracerta:*" }
    }
  }]
}
JSON
aws iam create-role --role-name github-actions-obracerta-deploy \
  --assume-role-policy-document file://trust.json

# 2.3 Permissão mínima: mandar o comando e ler o resultado
cat > perm.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:us-east-1:${ACCOUNT_ID}:instance/${INSTANCE_ID}",
        "arn:aws:ssm:us-east-1::document/AWS-RunShellScript"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"],
      "Resource": "*"
    }
  ]
}
JSON
aws iam put-role-policy --role-name github-actions-obracerta-deploy \
  --policy-name ssm-deploy --policy-document file://perm.json

# O ARN que vai virar secret no GitHub:
echo "arn:aws:iam::${ACCOUNT_ID}:role/github-actions-obracerta-deploy"
```

---

## 3. Secrets/variáveis no GitHub

Em **Settings → Secrets and variables → Actions**:

| Tipo | Nome | Valor |
|------|------|-------|
| Secret | `AWS_DEPLOY_ROLE_ARN` | o ARN impresso no fim do passo 2 |
| Secret | `EC2_INSTANCE_ID` | o `i-...` da sua EC2 |
| Variable | `AWS_REGION` | `us-east-1` (opcional; é o default) |

Os secrets antigos `EC2_HOST` / `EC2_USER` / `EC2_SSH_KEY` deixam de ser usados
(pode remover).

---

## Pronto

No próximo push para `master`, o pipeline roda **verify → build+push (GHCR) →
deploy (SSM)**. Para testar manualmente sem push: **Actions → Deploy → Run
workflow**.

Deploy manual de emergência (do seu PC, com a porta 22 liberada para o seu IP)
continua funcionando via `scripts/deploy-ship.sh`.
