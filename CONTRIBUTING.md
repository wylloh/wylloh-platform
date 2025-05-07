# Contributing to Wylloh Protocol

Thank you for your interest in contributing to the Wylloh protocol! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## How to Contribute

### 1. Fork and Clone

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/wylloh-platform.git
   cd wylloh-platform
   ```

### 2. Setup Development Environment

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Install development tools:
   ```bash
   yarn global add @commitlint/cli @commitlint/config-conventional
   ```

### 3. Create a Branch

Create a new branch for your feature or fix:
```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Adding or modifying tests
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### 4. Development Guidelines

#### Smart Contracts

1. Follow Solidity style guide:
   - Use latest stable Solidity version
   - Follow OpenZeppelin patterns
   - Include NatSpec comments
   - Write comprehensive tests

2. Security considerations:
   - No hardcoded values
   - Proper access control
   - Gas optimization
   - Reentrancy protection

#### Frontend

1. Follow React best practices:
   - Functional components
   - Hooks for state management
   - TypeScript for type safety
   - Proper error handling

2. UI/UX guidelines:
   - Responsive design
   - Accessibility standards
   - Consistent styling
   - Clear error messages

### 5. Testing

1. Run tests:
   ```bash
   yarn test
   ```

2. Test coverage:
   ```bash
   yarn test:coverage
   ```

3. Linting:
   ```bash
   yarn lint
   ```

### 6. Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### 7. Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Create pull request

PR template:
```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Breaking change

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Documentation
- [ ] README updated
- [ ] API documentation updated
- [ ] Code comments added

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
```

### 8. Review Process

1. Code review by maintainers
2. Address feedback
3. Update PR as needed
4. Merge after approval

## Development Workflow

### Local Development

1. Start development environment:
   ```bash
   yarn dev
   ```

2. Run tests in watch mode:
   ```bash
   yarn test:watch
   ```

3. Check types:
   ```bash
   yarn type-check
   ```

### Smart Contract Development

1. Deploy to local network:
   ```bash
   yarn deploy:local
   ```

2. Run contract tests:
   ```bash
   yarn test:contracts
   ```

3. Verify contracts:
   ```bash
   yarn verify:contracts
   ```

## Documentation

### Writing Documentation

1. Use Markdown format
2. Include code examples
3. Add diagrams when helpful
4. Keep it up to date

### Documentation Structure

- `docs/` - Main documentation
- `docs/api/` - API documentation
- `docs/contracts/` - Smart contract documentation
- `docs/guides/` - User guides

## Support

For help with contributing:
- GitHub Issues
- Discord community
- Email: contact@wylloh.com

## License

By contributing, you agree that your contributions will be licensed under the project's Apache License 2.0. 