// jest.config.ts
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  verbose: true,
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
};
