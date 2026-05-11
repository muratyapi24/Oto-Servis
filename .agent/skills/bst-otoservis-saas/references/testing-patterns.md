# Testing Patterns — BST Otoservis

## Test Framework

- **Runner:** Jest
- **Config:** `apps/web/jest.config.js`
- **Mocks:** `apps/web/__mocks__/`
- **Test dir:** `apps/web/__tests__/`

## Running Tests

```bash
pnpm --filter web exec jest --runInBand         # All tests (sequential)
pnpm --filter web exec jest path/to/test.ts     # Single file
pnpm --filter web exec jest --watch             # Watch mode
pnpm --filter web exec jest --coverage          # With coverage
```

## Test Categories

### Unit Tests
- Finance calculations (`finance.test.ts`)
- Commission calculations (`commission.test.ts`)
- Quote pricing (`quotes.test.ts`)
- TOTP 2FA logic (`totp.test.ts`)
- Cache operations (`cache.test.ts`)

### Integration Tests
- Service lifecycle (`service-lifecycle.test.ts`)
- Stock integrity (`stock-integrity.test.ts`)
- Appointment conflicts (`appointments.test.ts`)
- Approval token flow (`approval.test.ts`)

### Security Tests
- RBAC role enforcement (`rbac.test.ts`)
- Rate limiting (`rate-limit.test.ts`)
- Tenant isolation (within `rbac.test.ts`)

### Infrastructure Tests
- Health endpoint (`health.test.ts`)
- SSE (`sse.test.ts`)
- Push notifications (`push.test.ts`)
- PWA manifest (`pwa.test.ts`)
- Sentry integration (`sentry.test.ts`)
- Background jobs (`jobs.test.ts`)
- Search sync (`search.test.ts`)
- Storage S3 (`storage.test.ts`)
- Location multi-branch (`location.test.ts`)

## Writing a New Test

```typescript
// __tests__/module-name.test.ts
import { prismaMock } from "../__mocks__/@repo/database";

describe("ModuleName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createRecord", () => {
    it("should create record with valid data", async () => {
      // Arrange
      prismaMock.model.create.mockResolvedValue({
        id: "test-id",
        tenantId: "tenant-1",
        name: "Test",
      });

      // Act
      const result = await createRecord({ name: "Test" });

      // Assert
      expect(result.success).toBeDefined();
      expect(prismaMock.model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: "tenant-1" }),
        })
      );
    });

    it("should reject unauthorized access", async () => {
      // Mock no session
      // Assert error returned
    });
  });
});
```

## Mocking Patterns

### Prisma Mock
The `__mocks__/@repo/database` module provides `prismaMock` with all models.

### Auth Mock
Mock `auth()` from `@/auth` to return controlled sessions.

### External Services
Mock Twilio, Resend, Stripe, S3 clients in respective `__mocks__/` files.

## Known Issues

- ESM dependencies (`otplib`, `meilisearch`) need transform configuration
- `fast-check` float constraints: use `fc.double()` instead of `fc.float()`
- Run with `--runInBand` to avoid parallel test interference
