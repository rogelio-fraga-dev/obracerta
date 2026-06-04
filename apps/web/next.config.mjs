/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are pre-built (tsup), but transpiling lets us consume
  // their TS/JSX directly during dev without a separate build step.
  transpilePackages: ["@obracerta/ui", "@obracerta/shared", "@obracerta/design-tokens"],
  // Linting runs as a dedicated monorepo task (turbo lint), not during build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
