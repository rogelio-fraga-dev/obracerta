import nest from "@obracerta/config/eslint/nest";

export default [
  ...nest,
  {
    ignores: ["dist/**", "coverage/**", "jest.config.cjs"],
  },
];
