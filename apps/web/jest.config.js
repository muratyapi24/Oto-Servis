/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@repo/(.*)$": "<rootDir>/../../packages/$1/src",
    "^otplib$": "<rootDir>/__mocks__/otplib.cjs",
    "^meilisearch$": "<rootDir>/__mocks__/meilisearch.cjs",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { 
      tsconfig: { 
        module: "commonjs",
        jsx: "react"
      } 
    }],
  },
  transformIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  extensionsToTreatAsEsm: [],
};

export default config;
