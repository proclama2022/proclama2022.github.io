# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:**
- React Test Renderer (included in `devDependencies`: `react-test-renderer@19.1.0`)
- Built-in Jest runtime via Expo
- No explicit Jest configuration file in project root

**Assertion Library:**
- Jest built-in matchers (no additional library installed)
- Snapshot testing used via `toMatchSnapshot()`

**Run Commands:**
- Test infrastructure present but no npm scripts defined for testing in `package.json`
- Suggested commands based on Expo standard:
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

## Test File Organization

**Location:**
- Co-located in adjacent `__tests__` directory
- Example: `components/__tests__/StyledText-test.js` for `components/StyledText.tsx`

**Naming:**
- Test file format: `{ComponentName}-test.js`
- Uses `.js` extension even in TypeScript project
- Placed in `__tests__` subdirectory of component directory

**Structure:**
```
components/
├── StyledText.tsx
├── Themed.tsx
├── EditScreenInfo.tsx
└── __tests__/
    └── StyledText-test.js
```

## Test Structure

**Suite Organization:**
```typescript
import * as React from 'react';
import renderer from 'react-test-renderer';

import { MonoText } from '../StyledText';

it(`renders correctly`, () => {
  const tree = renderer.create(<MonoText>Snapshot test!</MonoText>).toJSON();

  expect(tree).toMatchSnapshot();
});
```

**Patterns:**
- Single test per file (at least in existing test)
- Inline test definition using global `it()` function
- No test suites/describe blocks in current tests
- Descriptive test names in backtick strings

## Mocking

**Framework:** React Test Renderer provides shallow rendering capabilities

**Patterns:**
- No explicit mocking library detected in `devDependencies`
- Component testing uses snapshot testing approach
- External dependencies can be mocked manually if needed

**What to Mock:**
- External APIs (PlantNet API calls would need mocking)
- AsyncStorage operations in service tests
- Navigation props for screen components

**What NOT to Mock:**
- React Native built-in components (Text, View, etc.)
- Internal component logic
- Custom hook logic that doesn't depend on external services

## Fixtures and Factories

**Test Data:**
- No dedicated test fixture files found in codebase
- Snapshot testing suggests data comes from component props

**Location:**
- No fixtures directory exists (`__fixtures__` or similar)
- Recommended location for future fixtures: `components/__tests__/fixtures/` or `__tests__/fixtures/`

## Coverage

**Requirements:** None currently enforced (no coverage configuration found)

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Component rendering tests using React Test Renderer
- Snapshot testing for UI validation
- Scope: Individual component output verification
- Approach: Render component with props and compare snapshot

**Example from codebase:**
```typescript
it(`renders correctly`, () => {
  const tree = renderer.create(<MonoText>Snapshot test!</MonoText>).toJSON();
  expect(tree).toMatchSnapshot();
});
```

**Integration Tests:**
- Not implemented in current codebase
- Would test component interactions and data flow
- Services (plantnet, cache, rateLimiter) need integration tests

**E2E Tests:**
- Not configured
- Expo provides `expo test` and Detox integration options for E2E testing
- Would test complete user workflows (camera capture → plant identification → save)

## Common Patterns

**Async Testing:**
- React Test Renderer handles async operations through component state
- For testing async services directly, Jest async/await pattern would apply:
```typescript
it('should call API', async () => {
  const result = await identifyPlant({ imageUri: 'test.jpg' });
  expect(result.success).toBe(true);
});
```

**Error Testing:**
- Services return structured error responses suitable for testing:
```typescript
it('should handle API errors', async () => {
  const result = await identifyPlant({ imageUri: '', org: 'leaf' });
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

**Testing Service Functions:**
- Services like `cache.ts`, `rateLimiter.ts`, and `plantnet.ts` would be tested with Jest
- Mock AsyncStorage for storage service tests
- Mock fetch for API service tests

**Example test structure for services:**
```typescript
describe('rateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow identification when limit not reached', async () => {
    const { allowed } = await canIdentify();
    expect(allowed).toBe(true);
  });

  it('should block identification when limit reached', async () => {
    // Setup: call incrementIdentificationCount() 5 times
    const { allowed } = await canIdentify();
    expect(allowed).toBe(false);
  });
});
```

## Testing Notes

**Current State:**
- Minimal test coverage (1 component test)
- Focus on snapshot testing for UI components
- No service/business logic testing configured
- No E2E testing set up

**Testing Gaps:**
- Service functions (plantnet API, cache, rate limiter) lack unit tests
- No integration tests for PlantNet API flow
- No E2E tests for complete user workflows
- No error handling verification for network failures

**Recommended Testing Infrastructure:**
- Add Jest configuration file (`jest.config.js`) if not using Expo defaults
- Create test utilities for mocking AsyncStorage
- Create fixtures for PlantNet API response data
- Implement tests for service layer (high priority for reliability)
- Add Detox for E2E testing mobile-specific workflows

