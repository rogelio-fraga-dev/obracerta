#!/bin/bash
# EC2 User data — cole no campo "Advanced details > User data" ao criar a instância.
# Testado em Amazon Linux 2023. Instala Docker + Compose plugin e cria swap
# (essencial no free tier de 1 GB: evita travar ao rodar os containers).
set -euxo pipefail

# ── Swap de 4 GB (free tier t2.micro/t3.micro tem só 1 GB de RAM) ──
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Docker ──
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# ── Docker Compose plugin (v2) ──
mkdir -p /usr/libexec/docker/cli-plugins
curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Pasta de deploy (você vai copiar infra/docker/ para cá).
mkdir -p /home/ec2-user/obracerta
chown -R ec2-user:ec2-user /home/ec2-user/obracerta

echo "Bootstrap OK. Faça logout/login (ou 'newgrp docker') para usar docker sem sudo."
