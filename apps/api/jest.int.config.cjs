/**
 * Config de testes de INTEGRAÇÃO (exigem Postgres/Redis do Docker rodando).
 * Rodam com `pnpm --filter @obracerta/api test:int`, fora do `pnpm test` padrão
 * (e do CI), que não tem infra. Arquivos: `*.int-spec.ts`.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.int-spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.spec.json" }],
  },
  testEnvironment: "node",
  testTimeout: 15000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@obracerta/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
  },
};
