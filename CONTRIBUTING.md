# Contributing to Study Group App

Thank you for your interest in contributing to the Study Group App! This project is participating in Hacktoberfest 2024, and we welcome contributions that add meaningful value.

## 🎯 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 6.0+
- Git
- Basic knowledge of React, Node.js, and Git

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork: `git clone https://github.com/YOUR_USERNAME/study-group.git`

2. **Set up the development environment**
   ```bash
   # Backend setup
   cd backend
   npm install
   npm run dev
   
   # Frontend setup (in another terminal)
   cd frontend
   npm install
   npm start
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow the existing code style
   - Write tests for new features
   - Update documentation as needed

5. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd frontend
   npm test
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

## 📋 Contribution Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Follow conventional commit format

### Commit Messages
Use conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions
- `refactor:` for code refactoring

Examples:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login validation bug"
git commit -m "docs: update API documentation"
```

### Pull Request Guidelines
- Use descriptive titles
- Include detailed descriptions
- Add screenshots for UI changes
- Reference related issues
- Ensure all tests pass
- Update documentation as needed

## 🎃 Hacktoberfest 2024

This repository is participating in Hacktoberfest 2024! Here's how to contribute:

### Valid Contributions
- ✅ New features that add value
- ✅ Bug fixes
- ✅ Documentation improvements
- ✅ Test additions
- ✅ Code refactoring
- ✅ UI/UX improvements

### Invalid Contributions
- ❌ Spam or low-quality changes
- ❌ Simple typo fixes
- ❌ Whitespace-only changes
- ❌ Duplicate PRs

### Hacktoberfest Requirements
- Repository has `hacktoberfest` topic
- PRs must be merged before October 31, 2024
- Contributions must add meaningful value
- Follow conventional commit format

## 🏗️ Project Structure

```
study-group/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   └── tests/               # Backend tests
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── tests/               # Frontend tests
└── docs/                    # Documentation
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                   # Run all tests
npm run test:coverage      # Coverage report
```

## 📚 Documentation

- [High-Level Design](01_High_Level_Design.md)
- [Implementation Guide](10_Implementation_Guide.md)
- [Hacktoberfest Guide](Hacktoberfest_Contribution_Guide.md)

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node.js version, etc.)

## 💡 Feature Requests

We welcome feature requests! Please:
- Check existing issues first
- Provide clear description
- Explain the use case
- Consider implementation complexity

## 📞 Getting Help

- Check the documentation first
- Search existing issues
- Create a new issue with detailed information
- Join our discussions for questions

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to the Study Group App! 🚀
