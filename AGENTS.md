{\rtf1\ansi\ansicpg1252\cocoartf2865
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # DoLoop\
\
DoLoop is a mobile-first looping to-do list app (hybrid between a task manager and a habit tracker).  \
Users can create reusable task loops, check tasks off, and \'93reloop\'94 (reset) their checklist.\
\
---\
\
# Build & Test\
\
- Install deps: `npm install`\
- Start dev server: `npm run dev`\
- Build for production: `npm run build`\
- Run Expo (mobile): `npx expo start`\
- Type-check: `npm run typecheck`\
- Lint: `npm run lint`\
- Run tests: `npm run test`\
\
---\
\
# Architecture Overview\
\
- **Frontend**: Expo (React Native + React Native Web)  \
- **Backend**: Supabase (auth, Postgres, realtime sync)  \
- **Styling**: Tailwind / NativeWind, minimal Apple-style UI  \
\
## Core Models\
- **profiles** \uc0\u8594  id, email, display_name, avatar_url, created_at  \
- **loops** \uc0\u8594  id, owner, name, description, color, reset_rule, created_at  \
- **tasks** \uc0\u8594  id, loop_id, description, type, assigned_user_id, status, due_date, created_at, archived_at  \
- **loop_members** \uc0\u8594  user_id, loop_id, role  \
\
---\
\
# Security\
\
- Auth handled via Supabase (`supabase.auth`).  \
- Row-level security (RLS) enabled on `loops` and `tasks` tables.  \
- JWTs required for client access.  \
- Never commit `.env` or Supabase service keys.  \
\
Required environment variables:\
- `NEXT_PUBLIC_SUPABASE_URL`\
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`\
\
---\
\
# Git Workflows\
\
1. Branch from `main`: `feature/<slug>` or `fix/<slug>`  \
2. Keep commits atomic (e.g. `feat(tasks): add reloop button`)  \
3. Use pull requests into `main`.  \
4. Run `npm run lint && npm run typecheck` before pushing.  \
\
---\
\
# Conventions & Patterns\
\
- **Folder layout**:\
  - `/src/app` \uc0\u8594  Next.js/Expo app code\
  - `/src/components` \uc0\u8594  React Native UI components\
  - `/src/lib` \uc0\u8594  utilities, Supabase client\
  - `/src/types` \uc0\u8594  TypeScript definitions\
- Use **TypeScript strict mode**.  \
- Component names: `PascalCase`.  \
- File names: `camelCase`.  \
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`).  \
\
---\
\
# External Services\
\
- **Supabase** \uc0\u8594  Auth + Database + Realtime sync  \
- **Expo** \uc0\u8594  iOS/Android/web client  \
- **GitHub Actions (future)** \uc0\u8594  CI/CD pipeline  \
\
---\
\
# Gotchas\
\
- If schema changes, update Supabase migrations before coding.  \
- Always confirm RLS policies\'97tasks must belong to loops owned by user.  \
- Expo requires `npx expo start -c` after dependency changes.  \
- Ensure `.env.local` contains Supabase URL + anon key.  \
\
---\
\
# Proof of Done\
\
A feature is complete when:\
- Supabase queries return expected data.  \
- UI reflects changes on device (Expo Go).  \
- Lint + type-check pass with no errors.  \
- Tests (when present) pass.  \
}