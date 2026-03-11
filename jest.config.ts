import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/setEnv.ts", "<rootDir>/tests/preSetup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^(@/|src/)(.*)$": "<rootDir>/src/$2",
  },

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // ── Coverage settings
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/utils/logger.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov"],

  // ── Timeouts
  testTimeout: 10_000,

  // ── Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  verbose: true,
};

export default config;
