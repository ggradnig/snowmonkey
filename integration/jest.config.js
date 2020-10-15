// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathsToModuleNameMapper } = require("ts-jest/utils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require("../tsconfig.json");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  moduleDirectories: ["node_modules", "../"],
};
