/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    // NodeNext uses .js specifiers for .ts sources — strip for Jest resolution.
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@obracerta/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
  },
};
