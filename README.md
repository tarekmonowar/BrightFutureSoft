# Testing — WhatsApp API Backend

This project includes a centralized test suite (Jest + ts-jest + Supertest) with
clear separation between unit and integration tests, plus manual mocks so tests
run without external services (Redis, BullMQ, Socket.IO, WhatsApp client).

Quick summary

- Tests live in: tests/
  - tests/unit/ — unit tests
  - tests/integration/ — integration tests (exercise full Express stack)
  - tests/mocks/ — manual module mocks
  - tests/setEnv.ts, tests/preSetup.ts, tests/setup.ts — test environment &
    mocks
- Jest config: jest.config.ts (preset: ts-jest, verbose mode)
- Test scripts (package.json):
  - npm test — run all tests
  - npm run test:unit — run unit tests only
  - npm run test:integration — run integration tests only
  - npm run test:coverage — run tests + coverage
  - npm run test:watch — watch mode

Pre-requirements

- Node 18+
- Install deps:

```bash
# Install project deps
npm ci
```

Run tests (all)

```bash
# Run the entire test suite (unit + integration)
npm test
```

Jest is configured to be verbose so each test case is printed. Integration tests
use Supertest and the mocks in tests/\* so no external Redis/Bull/WhatsApp is
required to run them.

Run only unit or only integration

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

Run a single test file

```bash
# Run a single test file by path
npx jest --config jest.config.ts tests/integration/health.route.test.ts

# Or using npm:
npm test -- tests/integration/health.route.test.ts
```

Run tests by test name (useful to run a specific `it` block)

```bash
# Run tests whose name matches the pattern
npm test -- -t "should return HTTP 200"
```

Watch mode

```bash
npm run test:watch
```

Coverage report

```bash
npm run test:coverage
# Coverage output written to the coverage/ directory
```

Debugging failing tests

- Re-run the failing test file directly (see "Run a single test file").
- Use --runInBand to run tests serially when investigating ordering/resource
  issues:

```bash
npx jest --runInBand tests/unit/message.service.test.ts
```

- In VS Code you can run/debug individual tests from the editor test gutter (if
  using the Jest or Node test runner extensions).

What the client needs to know to validate locally

1. Clone the repo and install deps:

```bash
git clone <repo>
cd BrightSoft
npm ci
```

2. Run the full test suite:

```bash
npm test
```

3. If a developer or QA needs to re-run only a subset, use:

- Unit tests: npm run test:unit
- Integration tests: npm run test:integration
- One file: npm test -- tests/integration/whatsapp.sendMessage.test.ts
- One test by name: npm test -- -t "Authentication (X-API-Key)"

Notes about environment / mocks

- Tests do not require running Redis, BullMQ, or a real WhatsApp client. Those
  modules are mocked in tests/preSetup.ts and tests/setup.ts.
- tests/setEnv.ts provides test-specific environment variables so test runs are
  deterministic.
- To add tests:
  - Put unit-level tests in tests/unit and use .test.ts suffix
  - Put integration tests in tests/integration
  - Add shared mocks in tests/mocks or extend tests/setup.ts and preSetup.ts

If anything fails on the client machine

- Ensure Node version >= 18
- Run npm ci to ensure devDependencies (jest, ts-jest, supertest, @types) are
  installed
- Run the failing test directly to see detailed output:

```bash
npx jest --config jest.config.ts tests/path/to/file.test.ts -t "exact test name"
```

Contact

- Provide the failing test name, test file path, and the printed Jest output
  when asking for help. This accelerates reproduction and fixes.
