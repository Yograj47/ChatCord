const controllerConfig = require('./jest.config.json');

module.exports = {
  ...controllerConfig,
  moduleNameMapper: {
    ...controllerConfig.moduleNameMapper,
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  roots: ['<rootDir>/test/integration'],
  testMatch: ['**/*.integration.spec.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage/integration',
};
