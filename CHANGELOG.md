# Changelog

## [0.3.0] - 2026-07-10

### Fixed
- Broken email verification link, added a proper auth callback route.
- Manual reflection failing with "API key not valid" due to undocumented env vars.
- PDF upload showing raw 413 status codes instead of readable errors.
- Semantic search returning nothing due to an invalid embedding model.
- `/api/search` reading a cookie name Supabase never actually sets.
- Register flow not detecting when an account already exists.

### Added
- Onboarding tutorial at `/welcome` for first-time users.
- Toast notifications and animated loading states across the app.
- Shared Sidebar, AuthInput, AuthButton components.

### Removed
- POC demo page and an orphaned duplicate search page, consolidated onto one real search on the home page.

## [0.2.0] - 2026-05-29

### Added
- Supabase auth flow with login and register pages.
- Exam upload, manual reflection, and case reflection pages.
- Home dashboard with case library and relationship graph.

## [0.1.0] - 2026-05-23

### Added
- Initial project scaffolding with Next.js (App Router), Tailwind CSS, and TypeScript.
- Supabase client initialization file.
- GitHub Actions automated CI build validation workflow.
- Core project documentation files (`README.md`, `.env.example`).