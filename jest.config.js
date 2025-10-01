module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'app/**/*.js',
    'lib/**/*.js',
    '!app/**/layout.js',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/'
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  transformIgnorePatterns: [
    '/node_modules/'
  ]
};
