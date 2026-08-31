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
- Development: `npm run dev` (starts on port 3000)
- Build: `npm run build`
- Preview: `npm run serve`
- Test: `npm run test`

## Test
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`

## Constraints
- All data is stored locally in the browser's Local Storage/IndexedDB
- No server-side components or external APIs
- Must be compatible with modern browsers

## Quality gates
- `npm run test` (unit tests)
- `npm run test:e2e` (end-to-end tests)