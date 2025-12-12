# Testing Guide for DMentor AI

## Overview

The test suite for DMentor AI includes:
- Unit tests for personality system
- Code analyzer tests
- Extension activation tests
- Integration tests

## Running Tests

### Full Test Suite

Run the complete test suite (compile, lint, test, and build check):
```bash
npm test
```

This command will:
1. Clean previous build outputs
2. Compile TypeScript
3. Run ESLint
4. Execute all tests
5. Verify the build is valid

### Individual Test Commands

```bash
# Compile only
npm run compile

# Lint only
npm run lint

# Run tests only (requires compilation first)
npm run test:run

# Build verification
npm run build:check

# Clean build artifacts
npm run clean
```

## Test Structure

```
src/test/
├── runTest.ts           # Test runner entry point
└── suite/
    ├── index.ts         # Test suite configuration
    ├── extension.test.ts       # Extension activation tests
    ├── personalities.test.ts   # Personality system tests
    └── analyzer.test.ts        # Code analyzer tests
```

## Writing Tests

### Example Test

```typescript
import * as assert from 'assert';
import { StrictMentor } from '../../personalities/strictMentor';

suite('Personality Tests', () => {
    test('StrictMentor should respond to issues', () => {
        const mentor = new StrictMentor();
        const context: SuggestionContext = {
            filePath: 'test.js',
            lineNumber: 1,
            code: 'test code',
            issueType: 'bug',
            severity: 'critical',
            description: 'Test bug',
            suggestion: 'Fix it'
        };

        const response = mentor.respondToIssue(context);
        assert.ok(response);
        assert.ok(response.message);
    });
});
```

## Test Coverage

Current test coverage includes:
- ✅ Extension activation
- ✅ All 6 personality types
- ✅ Code analyzer basic functionality
- ✅ Security vulnerability detection
- ✅ Accessibility issue detection

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Run tests
  run: npm test
```

## Debugging Tests

1. Open VS Code
2. Go to Run and Debug (F5)
3. Select "Extension Tests"
4. Press F5 to start debugging

## Troubleshooting

### Tests not running
- Ensure dependencies are installed: `npm install`
- Check that TypeScript compiled: `npm run compile`
- Verify test files are in `src/test/suite/` and compiled to `out/test/suite/`

### Extension not activating in tests
- Check that `package.json` has correct extension ID
- Verify activation events are configured
- Ensure test environment has proper VS Code context

### Build check failing
- Ensure all imports are correct
- Check for circular dependencies
- Verify all required dependencies are installed

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Test edge cases**: Don't just test happy paths
4. **Mock external dependencies**: Use mocks for VS Code API when needed
5. **Clean up**: Dispose of resources in `teardown` hooks

## Adding New Tests

1. Create test file in `src/test/suite/`
2. Follow naming convention: `*.test.ts`
3. Import necessary modules
4. Write test cases using Mocha's TDD interface
5. Run `npm test` to verify

## Performance

- Tests should complete in under 10 seconds
- Use appropriate timeouts for async operations
- Clean up resources to prevent memory leaks

