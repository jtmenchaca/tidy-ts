# Contributing to Tidy-TS

Thank you for your interest in contributing to Tidy-TS! We welcome contributions from the community.

## How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/jtmenchaca/tidy-ts/issues) page
- Provide a clear description of the problem
- Include steps to reproduce if applicable
- Specify your environment (Node.js, Deno, Bun, browser)

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the use case and expected behavior
- Consider if the feature aligns with the project's goals

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/jtmenchaca/tidy-ts.git
cd tidy-ts

# Run tests
deno task ci

# Run specific test suites
deno task test-src          # Test source code
deno task test-examples     # Test examples
deno task test-stats-tests  # Test statistical tests
deno task test-glm          # Test GLM tests
deno task test-gee          # Test GEE tests
```

### CI/CD Pipeline
```
Push to GitHub
      ↓
CI workflow starts
      ↓
Pulls Docker image (R + Deno + packages pre-installed)
      ↓
Restores Deno dependency cache
      ↓
Checks out code
      ↓
Runs deno task ci
      ↓
Reports pass/fail
```

The Docker image contains R runtime, all R packages, Deno 2.5.3, and test directories pre-configured. This makes CI runs fast (~1-2 minutes) instead of reinstalling everything each time.

## Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Ensure type safety throughout

## Testing
- All new features must include tests
- Use descriptive test names, following the naming conventions of our existing tests
- Follow the existing test patterns

## Questions?
Feel free to open an issue for any questions about contributing!
