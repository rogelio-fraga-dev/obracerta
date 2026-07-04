import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build de produção enxuto: só o servidor + node_modules realmente usados
  // (traçados). Reduz RAM e tamanho da imagem Docker na EC2 e acelera o pull do GHCR.
  output: "standalone",
  // Monorepo: o tracing precisa enxergar a raiz do repo para incluir os workspaces.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  reactStrictMode: true,
  // Workspace packages are pre-built (tsup), but transpiling lets us consume
  // their TS/JSX directly during dev without a separate build step.
  transpilePackages: ["@obracerta/ui", "@obracerta/shared", "@obracerta/design-tokens"],
  // Linting runs as a dedicated monorepo task (turbo lint), not during build.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Upload de foto (perfil/portfólio/pedido) via Server Action: o default de
    // 1MB rejeitava fotos reais (a UI promete até 5MB). 6mb = 5MB + overhead multipart.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
