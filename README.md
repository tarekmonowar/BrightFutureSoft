# WhatsApp API Backend

A compact, production-oriented REST + real-time backend that provides a safe
HTTP API for sending messages via a WhatsApp Web client. The project focuses on
reliable delivery by queuing outgoing messages (BullMQ + Redis), processing them
with a background worker, and exposing status and control points for clients
through HTTP and Socket.IO.

**Problems this project solves**

- Provides a simple REST API to enqueue messages for delivery through WhatsApp
  Web, decoupling web requests from delivery and improving reliability under
  load.
- Persists WhatsApp session state locally so the service can recover after
  restarts without re-authenticating every time.
- Emits real-time events (QR code, status changes) to lightweight clients so
  operator UIs can display authentication state and onboarding instructions.
- Protects the API with a simple API key and per-endpoint rate limiting to
  reduce abuse and accidental overload.

**Technology & why used**

- **Node.js + Express**: minimal, well-supported web framework for building REST
  APIs.
- **whatsapp-web.js (LocalAuth)**: drives a headless WhatsApp Web client and
  persists credentials locally. LocalAuth keeps sessions across restarts without
  external identity providers — practical for small deployments and automated
  workers.
- **BullMQ + Redis**: reliable job queue for background processing. Using a
  queue decouples HTTP requests from the actual send operation, enables
  retries/backoff, and makes throughput control easy via worker concurrency.
- **Worker process (BullMQ Worker)**: processes queued send jobs concurrently
  and isolates delivery logic from request handling.
- **express-rate-limit**: per-route rate limiter (plus a global limiter) to
  prevent abuse and protect downstream systems (WhatsApp client, Redis).
- **Socket.IO**: broadcasts WhatsApp client events (QR, ready, authenticated,
  disconnected) so UI clients can react in real time (scan QR, show status).
- **Local API Key**: simple `X-API-Key` header authentication for protected
  endpoints. This keeps the API simple to integrate with scripts and internal
  tools; swap to OAuth or JWT if you need multi-tenant or user-scoped auth.

# How to clone & run

1. Clone and install:

```bash
git clone https://github.com/tarekmonowar/BrightFutureSoft.git
cd BrightFutureSoft
npm ci
```

2. Copy the provided `.env` or create one from the environment schema. There is
   a working example in `.env` used for local/dev runs.

3. Run in development (auto-reload):

```bash
npm run dev
```

4. Build and run production:

```bash
npm run build
npm start
```

**Important environment variables** The application validates environment
variables at startup.

- **PORT** — HTTP port (default: `3000`).
- **NODE_ENV** — environment (`development|production|test`).
- **REDIS_URL** — Redis connection URL (used by BullMQ and ioredis).
- **API_KEY** — API key string required for protected endpoints (`X-API-Key`).
- **LOG_LEVEL** — pino log level (`info`, `debug`, ...).
- **RATE_LIMIT_WINDOW_MS** — rate-limit window in ms.
- **RATE_LIMIT_MAX** — allowed requests per `RATE_LIMIT_WINDOW_MS`.
- **WHATSAPP_CLIENT_ID** — client id used by `whatsapp-web.js` `LocalAuth`.
- **MESSAGE_QUEUE_CONCURRENCY** — worker concurrency for message processing.

Example (local `.env`):

```
PORT=5000
NODE_ENV=development
API_KEY=your-api-key-here
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
WHATSAPP_CLIENT_ID=my-whatsapp-session
MESSAGE_QUEUE_CONCURRENCY=5

```

**HTTP API Endpoints** All endpoints are relative to the server base URL (e.g.
`http://localhost:5000`).

- **GET /health** — application health
  - Headers: none
  - Request body: none
  - Response 200 JSON (HealthResponse): { "status": "ok", "uptime": 123, //
    seconds "timestamp": "...", "version": "1.0.0" }

- **GET /api/v1/whatsapp/status** — WhatsApp client status
  - Headers: none
  - Request body: none
  - Response 200 JSON: { "success": true, "data": { "status":
    "INITIALIZING|QR_READY|AUTHENTICATED|READY|...", "timestamp": "...", // If
    WhatsApp has generated a QR, the `qr` field contains a // data-URL string
    that can be displayed by a browser "qr": "data:image/png;base64,..." //
    optional } }

- **POST /api/v1/whatsapp/send-message** — enqueue a message to send
  - Headers:
    - `Content-Type: application/json`
    - `X-API-Key: <API_KEY>` — required (simple local auth)
  - Body (JSON): { "to": "447700900123", // phone number without @c.us
    "message": "Hello world" }
  - Behaviour: validates body, checks WhatsApp client is READY, enqueues a job
    to BullMQ and returns 202 if accepted.
  - Success response 202 JSON (SendMessageResponse): { "success": true, "jobId":
    "<uuid>", "message": "Message accepted and queued for delivery" }
  - Rate limiting: this endpoint uses a stricter rate limiter. If the limit is
    exceeded the response is 429 with JSON
    `{ success: false, error: "Too many requests..." }`.

Notes: the send endpoint only enqueues messages — actual delivery is handled by
the background worker. Check job completion in logs; extend with a job
completion webhook or status endpoint if you need delivery callbacks.

**Socket.IO events (real-time client integration)**

- Connect a Socket.IO client to the same server to receive WhatsApp events.
- Events broadcast from server (see
  [src/sockets/events.ts](src/sockets/events.ts)):
  - `whatsapp:status` — initial connection status
  - `whatsapp:qr` — QR code payload `{ qr: string }` (data-URL)
  - `whatsapp:ready` — client ready
  - `whatsapp:authenticated` — authenticated
  - `whatsapp:disconnected` — `{ reason }`
  - `whatsapp:loading` — loading progress `{ percent, message }`
  - `whatsapp:auth_failure` — `{ message }`

Example (browser client):

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
socket.on("whatsapp:qr", ({ qr }) => {
  /* show QR image */
});
socket.on("whatsapp:ready", () => {
  /* update UI */
});
```

**How the queue & worker operate**

- Queue name: `whatsapp:messages` (see
  [src/modules/message/message.queue.ts](src/modules/message/message.queue.ts)).
- Producer: `enqueueMessage()` creates a job with `jobId = UUID` and returns
  immediately with `202 Accepted`.
- Worker: [src/modules/message/message.worker.ts] processes jobs and calls the
  WhatsApp service `sendMessage(to, text)`; concurrency and small per-worker
  limits are configured via environment variables.

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

**Client setup notes**

- To onboard a human operator: visit the UI that connects to the Socket.IO
  server, display the `whatsapp:qr` data-URL as an image, and ask the operator
  to scan it with their phone. Once scanned the service will emit
  `whatsapp:ready`.
- `LocalAuth` stores WhatsApp session data under `./.wwebjs_auth` by default —
  keep that directory persistent across restarts.

**Where to look in the code**

- Server bootstrap: [src/server.ts](src/server.ts)
- App setup & middleware: [src/app.ts](src/app.ts)
- REST routes: [src/routes/index.ts](src/routes/index.ts)
- WhatsApp client:
  [src/modules/whatsapp/whatsapp.service.ts](src/modules/whatsapp/whatsapp.service.ts)
- Queue/Worker:
  [src/modules/message/message.queue.ts](src/modules/message/message.queue.ts)
  and
  [src/modules/message/message.worker.ts](src/modules/message/message.worker.ts)

Thank you for checking out this project! I hope it serves as a useful starting
point for anyone looking to build a WhatsApp Web API backend with Node.js.
Please feel free to contact me with any questions or feedback.

# Tarek Monowar

Full-stack developer
