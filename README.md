# CakeCost - Recipe Pricing Calculator for Confectioners

A mobile application for calculating the cost price of confectionery products with automatic recalculation when ingredient prices change.

## Tech Stack

- **Frontend:** Quasar Framework v2 (Vue 3 + TypeScript + Vite)
- **Mobile:** Capacitor (iOS + Android)
- **State Management:** Pinia
- **Database:** SQLite (@capacitor-community/sqlite)
- **Testing:** Vitest + @vue/test-utils
- **Development Approach:** TDD (Test-Driven Development)

## Project Status

✅ **Phase 0 Complete** (Setup and Configuration)

- [x] Quasar project with TypeScript initialized
- [x] Capacitor configured for mobile platforms
- [x] Vitest testing framework set up
- [x] SQLite database configured
- [x] Project folder structure created
- [x] Database schema created with migrations
- [x] Database schema tests written and passing (10/10 tests ✓)

## Getting Started

### Prerequisites

- Node.js v24.12.0 or higher (managed via nvm)
- npm v11.6.2 or higher

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests once (for CI/CD)

## Project Structure

```
src/
├── __tests__/              # Tests
│   ├── unit/              # Unit tests
│   ├── components/        # Component tests
│   └── integration/       # Integration tests
├── components/
│   ├── ingredients/       # Ingredient components
│   ├── recipes/           # Recipe components
│   ├── calculator/        # Order calculator
│   └── settings/          # Settings components
├── stores/                # Pinia stores
├── database/              # Database schema and migrations
├── utils/                 # Utility functions
├── pages/                 # Page components
├── router/                # Vue Router configuration
└── assets/
    └── i18n/             # Internationalization files
```

## Database Schema

The application uses SQLite with the following tables:

- **ingredients** - Stores ingredient data with purchase information
- **recipes** - Stores recipe data with pricing and profit calculations
- **recipe_items** - Links recipes to ingredients with amounts
- **settings** - Application settings (currency, language, theme)

## Testing

All tests are written following TDD principles:

```bash
# Run all tests
npm test

# Run specific test file
npm test schema.test.ts

# Run with coverage
npm run test:coverage
```

Current test coverage:
- Database schema: 10/10 tests passing ✓

## Development Roadmap

See [doc/ROADMAP_TDD.md](doc/ROADMAP_TDD.md) for the complete TDD development roadmap.

**Next Phases:**
- Phase 1: Core Foundation (Units conversion, Navigation, Themes)
- Phase 2: Ingredients Module
- Phase 3: Recipes Module
- Phase 4: Order Calculator
- Phase 5: Localization
- Phase 6: Monetization & Security
- Phase 7: Export/Import
- Phase 8: Polish & Release

## Documentation

- [Technical Specification](doc/TECH_SPECIFICATION.md)
- [TDD Roadmap](doc/ROADMAP_TDD.md)

## License

ISC
