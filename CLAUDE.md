@AGENTS.md

# Plant Care PWA

Next.js App Router (JavaScript), Supabase (auth + Postgres + storage), Tailwind v4,
react-icons, Anthropic SDK. Deploy target: Vercel (user deploys manually).

## Stack conventions

- JavaScript only, no TypeScript. Path alias `@/*` -> `./src/*` (jsconfig.json).
- Next.js 16: the middleware file convention is renamed to **proxy** —
  `src/proxy.js` exporting `proxy(request)`, not `middleware.js`/`middleware()`.
  Don't recreate `middleware.js`.
- Route group `src/app/(app)/` holds every authenticated page (shares the
  header/nav layout + sign-out button). `src/app/login` and
  `src/app/auth/callback` are the only public routes.
- Supabase client helpers, three variants, don't cross-use them:
  - `src/lib/supabase/client.js` — browser (anon key). Client components only.
  - `src/lib/supabase/server.js` — server (anon key, cookie-bound). Server
    components, route handlers, server actions. `await createClient()`.
  - `src/lib/supabase/admin.js` — service-role key, bypasses RLS. Only for
    trusted server-only jobs (e.g. the push-digest cron route). Never import
    from a client component; never expose `SUPABASE_SERVICE_ROLE_KEY`.
- **Supabase `.update()`/`.insert()` gotcha**: on an RLS-filtered row, a write
  that matches zero rows still returns HTTP success with `data: []`. Every
  write in this codebase must chain `.select()` and treat an empty result
  array as an error — never trust the absence of a thrown error alone. Use
  `src/lib/supabase/mutate.js`'s `mutateOrThrow(builder)` for every
  insert/update/delete rather than re-implementing this check.
- **File organization: group by feature, not by file type.** `src/components/`
  and `src/lib/` are split into feature subfolders (`plants/`, `layout/`, …)
  rather than one flat directory — keep adding new features as their own
  subfolder instead of dropping files at the top level. Route-specific
  components that aren't reused (e.g. `LoginForm`) stay colocated in
  `src/app/.../` next to their `page.js` instead.

## Enums — single source of truth

Never inline a string that has to match a DB value. Both files below are
mirrored by CHECK constraints in
`supabase/migrations/20260815164228_init_schema.sql` — changing one requires
a new migration to ALTER the other.

- `src/lib/constants/plant-types.js` — `PLANT_TYPES` (11 values: houseplant,
  succulent, **cacti** (not "cactus" — matches the identify prompt's literal
  enum value), flowering, tree, shrub, herb, edible, fern, palm, other) +
  `PLANT_TYPE_LABELS` for display.
- `src/lib/constants/care-task-types.js` — `CARE_TASK_TYPES` (watering,
  fertilizing, misting, pruning, rotating, custom) + `CARE_TASK_TYPE_LABELS`.
  **`task_type` is always the canonical closed-set value; user-typed task
  names (for `custom` tasks) live only in the separate `display_name`
  column — never in `task_type`.**
- `src/lib/constants/care-profile-enums.js` — `LIGHT_LEVELS` / `HUMIDITY_LEVELS`
  used inside the `care_profile` jsonb blob (not their own DB column/check
  constraint, since they're nested in jsonb — kept in sync by convention with
  the Claude care-profile prompt instead).

## Schema (supabase/migrations/20260815164228_init_schema.sql)

- **profiles** — 1:1 with `auth.users`, auto-created by the `handle_new_user()`
  trigger (SECURITY DEFINER) on signup. Columns: `email`, `display_name`,
  `avatar_url`, `timezone` (IANA name, default `UTC`), `reminder_hour`
  (0-23, default 9 — used by the push digest cron).
- **species_care_profiles** — cache of Claude-generated care profiles, keyed
  by `scientific_name_key` (`lower(trim(scientific_name))`, UNIQUE). Shared
  across all users — identifying the same species again reuses this row
  instead of re-calling Claude. `care_profile` jsonb stores the raw shape
  from the care-profile prompt (watering/fertilizing/mist/light/humidity/
  temperature_range_c/toxicity/common_problems/rotation_days).
- **plants** — one row per user's plant. `species_care_profile_id` is
  nullable (allows a manual-entry plant with no matched species).
  `plant_type`/`scientific_name`/`common_name`/`identification_confidence`
  are denormalized from the identify step for fast list/filter queries.
  `photo_path` is the Storage object path (`plant-photos` bucket, private).
- **care_tasks** — `user_id` is denormalized (also on `plants`) purely so RLS
  and "my overdue tasks" queries don't need a join. `interval_days` rolls
  `next_due_at` forward on completion (feature 4). `is_paused` for
  pause/resume. See "Seeding tasks from a care profile" below for how the
  seasonal Claude fields collapse into one `interval_days`.
- **push_subscriptions** — one row per subscribed device (not a single column
  on `profiles`), so a user can have phone + desktop both subscribed.
- **Storage** — `plant-photos` bucket, private, path convention
  `{user_id}/{plant_id}/{filename}`. RLS via `storage.objects` policies
  keyed on `(storage.foldername(name))[1] = auth.uid()::text`.

### RLS policies created (all tables have RLS enabled)

| Table | Policies |
|---|---|
| `profiles` | `profiles_select_own`, `profiles_update_own` — `auth.uid() = id`. No insert policy: the signup trigger is SECURITY DEFINER and bypasses RLS. |
| `species_care_profiles` | `species_care_profiles_select_all` (any authenticated user), `species_care_profiles_insert_all` (any authenticated user can add a new species to the shared cache). No update/delete policy for regular users. |
| `plants` | `plants_select_own`, `plants_insert_own`, `plants_update_own`, `plants_delete_own` — all `auth.uid() = user_id`. |
| `care_tasks` | `care_tasks_select_own`, `care_tasks_insert_own`, `care_tasks_update_own`, `care_tasks_delete_own` — all `auth.uid() = user_id`. |
| `push_subscriptions` | `push_subscriptions_select_own`, `..._insert_own`, `..._update_own`, `..._delete_own` — all `auth.uid() = user_id`. |
| `storage.objects` (`plant-photos` bucket) | `plant_photos_select_own`, `..._insert_own`, `..._update_own`, `..._delete_own` — all scoped to the first path segment matching `auth.uid()`. |

### Seeding care_tasks from a generated care profile (design decision)

The Claude care-profile prompt returns *seasonal* watering/fertilizing
intervals (`interval_days_summer`/`interval_days_winter`,
`interval_days_growing_season`/`interval_days_dormant`), but `care_tasks`
only has one `interval_days` per task (feature 4 doesn't call for automatic
seasonal switching). Slice 3 will default new tasks to the
summer/growing-season value; the user can edit the interval afterward
(and adjusts it before saving, per the "Add a plant" flow). Task-by-task:

- `watering` — always created, `interval_days_summer`.
- `fertilizing` — always created, `interval_days_growing_season`.
- `misting` — only created if `mist.interval_days` is not null.
- `rotating` — only created if `rotation_days > 0`.
- `pruning` — never auto-created (the care-profile prompt has no pruning
  interval field); available for the user to add manually.

## Plants CRUD (slice 2)

- `src/lib/plants/queries.js` — read helpers (`getPlantsForUser`,
  `getPlantTypeCounts`, `getPlantById`). Photo paths are turned into signed
  URLs here (bucket is private) via a single batched `createSignedUrls()`
  call, not one request per plant.
- `src/lib/plants/actions.js` — `"use server"` mutations
  (`createPlantAction`, `updatePlantAction`, `deletePlantAction`), all built
  on `mutateOrThrow`. Photo upload path convention:
  `{user_id}/{plant_id}/{timestamp}-{filename}`.
- `src/components/plants/PlantForm.js` is shared between `/plants/new` and
  `/plants/[id]/edit` — driven by `useActionState`, so errors thrown inside
  a server action (bad RLS write, upload failure, validation) surface inline
  instead of a full error page.
- **This slice's "Add a plant" is manual entry only** (nickname/category/
  photo/notes) — species identification + Claude-generated care profile
  replaces/extends this flow in slice 3. `plant_type` is picked from a
  `<select>` for now; slice 3's identify step will pre-fill it instead.
- Plant detail page has a placeholder for care tasks (slice 4).

## Identify + care profile (slice 3)

**Plant creation is AI-driven end to end — there is no manual nickname/category
entry at creation time.** The only user input on step 1 is a photo. Category,
scientific name, and common name always come from Claude's identification;
nickname is collected later, alongside task interval review (see below).
`PlantForm.js` / `updatePlantAction` (manual nickname+category fields) still
exist but are edit-only now — used to *correct* an already-created plant, not
to create one.

- `src/lib/anthropic/prompts.js` — `IDENTIFY_PROMPT` and `CARE_PROFILE_PROMPT`,
  copied verbatim from the user. Don't reword without checking first.
- `src/lib/anthropic/client.js` — shared Anthropic client + `ANTHROPIC_MODEL`
  (reads `ANTHROPIC_AI_MODEL` env var, currently `claude-sonnet-5` — an
  explicit per-project choice, not a default). `thinking: {type: "disabled"}`
  is used on both prompts (Sonnet 5 allows this at any effort) since the
  prompts demand raw JSON with no preamble and thinking isn't needed for a
  species lookup / care lookup.
- `src/lib/anthropic/identify.js` / `careProfile.js` — call Claude, then
  validate the parsed JSON against the shared enums (`isPlantType`,
  `isLightLevel`, `isHumidityLevel`) before it ever reaches the DB or client.
  Both prompts were smoke-tested directly against the real API while building
  this slice (unhappy path too — a blank image correctly returns
  `confidence: 0`, `scientific_name: ""`, `type: "other"`).
- `src/lib/plants/speciesCache.js` — `getOrCreateCareProfile()`: looks up
  `species_care_profiles` by normalized scientific name first; only calls
  Claude (and caches the result) on a miss. Handles the race where two users
  identify the same new species at once (Postgres unique-violation `23505`
  on `scientific_name_key` → re-fetch the winner's row instead of erroring).
- `src/lib/plants/careTasks.js` — `deriveTasksFromCareProfile()`, the one
  place the seasonal-interval-collapse design decision (see schema section
  above) is implemented. Used client-side to seed the editable task list in
  the review step.

**Wizard flow** (`src/components/plants/AddPlantWizard.js`, driving
`/plants/new`): photo → `POST /api/identify` (uploads the photo to
`plant-photos` immediately — reused as-is for the final save, never
re-uploaded — then calls `identifySpecies()`) → candidate picker (primary +
up to 2 alternatives, confidence, `visible_health_issues`) → on selection,
`POST /api/care-profile` (`getOrCreateCareProfile`) → review step (nickname
input + `CareProfileSummary` read-only info + editable `TaskIntervalRow` per
derived task, each with interval + pause toggle) → `POST /api/plants`
(creates the `plants` row and its `care_tasks` rows in one call, server-side
re-validates every task's `task_type`/`interval_days` rather than trusting
the client array verbatim).

If identification fails (confidence 0 / no plant detected), the wizard shows
a message and lets the user retry with a different photo — there's currently
no manual fallback path to create a plant without going through
identification. Flag if that's needed later.

## Care tasks (slice 4)

- `src/lib/care-tasks/queries.js` — `getCareTasksForPlant()`.
- `src/lib/care-tasks/actions.js` — `"use server"` mutations, all called
  directly from the client components below (not via `<form action>`) and
  each ending in `revalidatePath('/plants/[id]')` so the server-rendered
  task list refreshes without a client-side refetch:
  - `markTaskDoneAction(taskId, plantId)` — **rolls `next_due_at` forward by
    `interval_days` from the task's existing `next_due_at`**, not from
    `now()`. This is the literal feature spec ("mark done rolls next_due_at
    forward by interval_days"); a task that's very overdue only advances by
    one interval per mark-done, it doesn't snap to the next future
    occurrence. Also sets `last_completed_at = now()`.
  - `updateTaskIntervalAction` — edits `interval_days` only; does **not**
    retroactively change `next_due_at` (only affects future roll-forwards).
  - `toggleTaskPauseAction` — flips `is_paused`.
  - `addCustomTaskAction` — always `task_type: 'custom'`, user-typed name
    goes in `display_name` (never in `task_type` — see the enums section
    above), `next_due_at = now() + interval_days`.
  - **Deliberately no delete action** — pause is the "stop reminding me"
    mechanism per the feature spec (mark done / edit interval / pause-resume
    / add custom, no delete). Easy to add later if wanted.
  - `"use server"` files can only export `async` functions — don't add a
    plain sync helper export to `actions.js` (Turbopack build error); put
    sync helpers in a separate non-`"use server"` module instead.
- `src/lib/care-tasks/dueStatus.js` — `getDueStatus(task)` — display-only
  "Overdue by N days" / "Due today" / "Due in N days" / "Paused" logic, kept
  out of the component so it's independently testable.
- `src/components/care-tasks/CareTaskRow.js` — each task is its own small
  island calling the server actions directly via `useTransition` (no
  `useActionState`/redirect needed since these mutate in place); the
  interval input commits on blur, not on every keystroke.

## Build gotchas

- **Next.js 16 uses `proxy.js`, not `middleware.js`.** See "Stack
  conventions" above.
- **`useSearchParams()` needs a Suspense boundary** for any page rendered
  statically at build time (e.g. `/login`) — the page component wraps a
  client child in `<Suspense>` rather than calling the hook directly.
  Pattern: `src/app/login/page.js` + `src/app/login/LoginForm.js`.
- **PWA service worker (Serwist)**: not wired up yet (slice 5). When it is,
  verify by deleting `public/sw.js`, running a clean `npm run build`, and
  confirming it's regenerated — Serwist fails silently under Turbopack.

## Supabase project

- Hosted project only — Docker Desktop isn't available in this dev
  environment, so `supabase start` (local stack) doesn't work. All dev/testing
  targets the hosted project directly via `NEXT_PUBLIC_SUPABASE_URL`.
- `supabase link` / `supabase config push` need a personal access token
  (`supabase login`), which we don't have. Migrations are pushed directly
  with `supabase db push --db-url "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.eqyfesmvsqdzfomswpgz.supabase.co:5432/postgres"`
  — no link/login required.
- **Manual dashboard steps required** (can't be scripted without an access
  token): Google OAuth provider (client ID/secret) and the redirect URL
  allowlist. See the message where this slice was delivered for exact steps.

## Env vars (.env.local — gitignored)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` (CLI-only, for db push),
`ANTHROPIC_API_KEY` (needed for slice 3), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` /
`VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (generated in slice 5),
`GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` (reference only — the
values that matter live in the Supabase Dashboard Google provider config,
not in this app's env).
