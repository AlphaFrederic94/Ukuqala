# CareAI Project Structure

This document provides an overview of the CareAI project structure, explaining the purpose of each directory and key files.

## Directory Structure

```
CareAI/
├── public/                 # Static assets
├── src/                    # Source code
│   ├── api/                # API integration
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and services
│   ├── pages/              # Page components
│   ├── services/           # Service layer
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main App component
│   └── main.tsx            # Entry point
├── docs/                   # Documentation
├── database/               # Database scripts and schemas
├── .env                    # Environment variables
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # Project documentation
```

## Key Directories and Files

### `/public`

Contains static assets that are served directly without processing:
- `logo.png`: Application logo
- `favicon.ico`: Browser favicon
- Other images and static files

### `/src`

The main source code directory containing all application code.

#### `/src/api`

API integration layer:
- `emailApi.ts`: Email service API
- Other API integration files

#### `/src/components`

Reusable UI components used throughout the application:

- `/ui`: Shadcn UI components
  - `button.tsx`: Button component
  - `card.tsx`: Card component
  - `dialog.tsx`: Dialog component
  - Other UI components
- `BackButton.tsx`: Navigation back button
- `LoadingSpinner.tsx`: Loading indicator
- `MetricCard.tsx`: Card for displaying metrics
- Other reusable components

#### `/src/contexts`

React Context providers for state management:
- `AuthContext.tsx`: Authentication state
- `UserContext.tsx`: User profile state
- Other context providers

#### `/src/hooks`

Custom React hooks:
- `useAuth.ts`: Authentication hook
- `useUser.ts`: User data hook
- Other custom hooks

#### `/src/lib`

Utility functions and services:
- `supabaseClient.ts`: Supabase client configuration
- `sleepProgramService.ts`: Sleep program functionality
- `nutritionService.ts`: Nutrition tracking functionality
- Other service files

#### `/src/pages`

Page components representing different routes in the application:
- `Analytics.tsx`: Analytics dashboard
- `/sleep/SleepProgram.tsx`: Sleep tracking page
- `/nutrition/`: Nutrition-related pages
- Other page components

#### `/src/services`

Service layer for business logic:
- `emailService.ts`: Email functionality
- `appointmentService.ts`: Appointment management
- Other service files

#### `/src/styles`

Global styles:
- `globals.css`: Global CSS styles
- Other style files

#### `/src/types`

TypeScript type definitions:
- `user.ts`: User-related types
- `appointment.ts`: Appointment-related types
- Other type definition files

#### `/src/utils`

Utility functions:
- `date.ts`: Date manipulation utilities
- `format.ts`: Formatting utilities
- Other utility files

#### `/src/App.tsx`

The main App component that sets up routing and global providers.

#### `/src/main.tsx`

The entry point of the application that renders the App component.

### `/docs`

Documentation files:
- `index.md`: Documentation home page
- `Analytics.md`: Analytics component documentation
- `SleepProgram.md`: Sleep program documentation
- Other documentation files

### `/database`

Database scripts and schemas:
- `schema.sql`: Database schema definition
- `seed.sql`: Seed data for development
- Other database-related files

### Configuration Files

- `.env`: Environment variables
- `index.html`: HTML template
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite configuration
- `README.md`: Project documentation

## Code Organization Principles

CareAI follows these code organization principles:

1. **Component-Based Architecture**: UI is built using reusable components
2. **Separation of Concerns**: Business logic is separated from UI components
3. **Context-Based State Management**: Global state is managed using React Context
4. **Service-Oriented Design**: Business logic is encapsulated in service modules
5. **Type Safety**: TypeScript is used throughout the codebase for type safety

## Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities and services
- **Components**: PascalCase (e.g., `MetricCard.tsx`)
- **Hooks**: camelCase prefixed with "use" (e.g., `useAuth.ts`)
- **Contexts**: PascalCase suffixed with "Context" (e.g., `AuthContext.tsx`)
- **Services**: camelCase suffixed with "Service" (e.g., `emailService.ts`)

## Import Structure

Imports are organized in the following order:
1. React and React-related packages
2. Third-party libraries
3. Components
4. Hooks
5. Contexts
6. Services
7. Utilities
8. Types
9. Assets and styles
