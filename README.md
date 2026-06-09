# Minab Customer Online Banking

Customer-facing online banking application for the Minab open-source banking APIs. Built with Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, and Zod.

## Scope

- Customer dashboard
- Accounts overview
- Transactions history
- Profile and security (password + MFA)

## Requirements

- Node.js 20+
- A running Minab backend exposing the OpenAPI surface in [`openfinova-local.json`](./openfinova-local.json)

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001).

## Authentication

- OAuth2 Authorization Code + PKCE
- OIDC login via BFF (`customer-portal` client, tokens server-side only)

Docker Compose runs the app on port **3001** (`PORT=3001` in the image). Rebuild after changes: `docker compose build --no-cache customer-app && docker compose up -d customer-app`.

On localhost, cookies are shared across ports — clear `minab_staff_session` or use a separate browser profile when testing customer vs staff.
- Force password change handling via JWT `force_password_change` claim
- Idle timeout warning + automatic logout

## Authorization

The UI is permission-driven from the JWT `permissions` claim. Three guard layers are available:

- `RouteGuard` - Page-level guard for App Router routes
- `NavGuard` - Sidebar/menu visibility guard
- `Can` - Action-level component guard for buttons and bulk actions

Customer routes in MVP require `account:read`, `transaction:read`, `profile:read:own`, and security permissions.

## Documentation

- [Route map](./docs/route-map.md)
- [Sidebar map](./docs/sidebar-map.md)
- [Permission matrix](./docs/permission-matrix.md)
- [Auth, MFA, and RBAC flow](./docs/auth-flow.md)
- [Test plan](./docs/test-plan.md)

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Validate TypeScript
- `npm run test` - Run unit tests with Vitest
- `npm run test:e2e` - Run Playwright end-to-end tests
