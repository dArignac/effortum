# Tech Context

## Stack

- TypeScript
- React 19
- TanStack Start with Nitro
- Mantine UI components
- Dexie for IndexedDB storage
- Vite for build tooling
- Vitest for unit testing
- Playwright for end-to-end testing

## Build / Run

- Development: `pnpm dev` (starts on port 3000)
- Build: `pnpm run build`
- Preview: `pnpm run preview`
- Test: `pnpm test`

## Test

- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`

## Constraints

- All data is stored locally in the browser's Local Storage/IndexedDB
- No server-side components or external APIs
- Must be compatible with modern browsers

## Quality gates

- `pnpm test` (unit tests)
- `pnpm test:e2e` (end-to-end tests)
