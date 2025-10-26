# Onboarding Form App

A simple three-page onboarding form application built with Next.js, TypeScript, and React.

## Features

- **Three-page flow**: Greeting → Onboarding Form → Welcome
- **Strict TypeScript**: Full type safety across the codebase
- **Zod validation**: Schema-based validation for all form fields
- **Custom React hooks**: Clean separation of concerns with `useOnboardingForm`
- **On-blur validation**: Real-time field validation as users complete each field
- **Async validation**: Corporation number validation via external API
- **Comprehensive tests**: React Testing Library tests for all components and logic
- **CI/CD**: GitHub Actions for automated testing and deployment to Vercel

## Form Fields

1. **First Name** (required, max 50 characters)
2. **Last Name** (required, max 50 characters)
3. **Phone Number** (required, Canadian format: starts with 1, 11 digits total)
4. **Corporation Number** (required, 9 characters, validated via API)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
\`\`\`

### Building for Production

\`\`\`bash
# Create production build
npm run build

# Start production server
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx                 # Greeting page
│   ├── onboarding/
│   │   └── page.tsx            # Onboarding form page
│   ├── welcome/
│   │   └── page.tsx            # Success page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── form-input.tsx          # Reusable form input component
│   └── ui/                     # shadcn/ui components
├── hooks/
│   └── use-onboarding-form.ts  # Custom form hook
├── lib/
│   ├── types.ts                # TypeScript types
│   ├── validation.ts           # Zod schemas and validators
│   ├── api.ts                  # API service layer
│   └── utils.ts                # Utility functions
├── __tests__/                  # Test files
└── .github/
    └── workflows/              # GitHub Actions workflows
\`\`\`

## Architecture

### Separation of Concerns

- **Models & Types** (`lib/types.ts`): Core domain types
- **Validation** (`lib/validation.ts`): Zod schemas and field validators
- **API Layer** (`lib/api.ts`): External API calls
- **Business Logic** (`hooks/use-onboarding-form.ts`): Form state and validation logic
- **UI Components** (`components/`): Pure presentational components
- **Pages** (`app/`): Route-level components

### Custom Hook Pattern

The `useOnboardingForm` hook encapsulates all form logic:
- Form state management
- Field-level validation (on blur)
- Async corporation number validation
- Form submission
- Error handling

This keeps components clean and focused on presentation.

## API Endpoints

### Corporation Number Validation
\`\`\`
GET https://fe-hometask-api.qa.vault.tryvault.com/corporation-number/:number
\`\`\`

### Profile Submission
\`\`\`
POST https://fe-hometask-api.qa.vault.tryvault.com/profile-details
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set up required secrets in GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Push to `main` branch to trigger automatic deployment

### Manual Deployment

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

## GitHub Actions

Two workflows are configured:

1. **CI** (`.github/workflows/ci.yml`): Runs on all pushes and PRs
   - Linting
   - Tests with coverage
   - Build verification

2. **Deploy** (`.github/workflows/deploy.yml`): Runs on pushes to `main`
   - Runs tests
   - Deploys to Vercel production

## Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Zod**: Schema validation
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **React Testing Library**: Testing
- **Jest**: Test runner
- **GitHub Actions**: CI/CD

## License

MIT
