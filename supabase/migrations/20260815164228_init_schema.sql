-- Plant Care PWA — initial schema
--
-- Enum values below (plant_type, task_type) are the DB-side mirror of the
-- shared constants modules:
--   src/lib/constants/plant-types.js      -> PLANT_TYPES
--   src/lib/constants/care-task-types.js  -> CARE_TASK_TYPES
-- If those change, this migration (and a new one to ALTER the check
-- constraints) must change too.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at current on row updates
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  reminder_hour smallint not null default 9 check (reminder_hour between 0 and 23),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user, created automatically by handle_new_user() on signup.';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
-- SECURITY DEFINER so it can insert regardless of the caller's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- species_care_profiles — cache of Claude-generated care profiles by species,
-- shared across all users so the same species is never regenerated.
-- ---------------------------------------------------------------------------
create table public.species_care_profiles (
  id uuid primary key default gen_random_uuid(),
  -- normalized (lowercased, trimmed) scientific name; the cache lookup key
  scientific_name_key text not null unique,
  scientific_name text not null,
  common_name text,
  plant_type text not null check (
    plant_type in (
      'houseplant', 'succulent', 'cacti', 'flowering', 'tree',
      'shrub', 'herb', 'edible', 'fern', 'palm', 'other'
    )
  ),
  -- Raw Claude care-profile JSON: watering, fertilizing, mist, light,
  -- humidity, temperature_range_c, toxicity, common_problems, rotation_days.
  care_profile jsonb not null,
  created_at timestamptz not null default now()
);

comment on column public.species_care_profiles.scientific_name_key is
  'lower(trim(scientific_name)) — cache key so re-identifying the same species reuses this row.';

alter table public.species_care_profiles enable row level security;

create policy "species_care_profiles_select_all"
  on public.species_care_profiles for select
  to authenticated
  using (true);

create policy "species_care_profiles_insert_all"
  on public.species_care_profiles for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- plants
-- ---------------------------------------------------------------------------
create table public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  species_care_profile_id uuid references public.species_care_profiles (id) on delete set null,
  nickname text not null,
  plant_type text not null check (
    plant_type in (
      'houseplant', 'succulent', 'cacti', 'flowering', 'tree',
      'shrub', 'herb', 'edible', 'fern', 'palm', 'other'
    )
  ),
  scientific_name text,
  common_name text,
  photo_path text,
  identification_confidence numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plants_user_id_idx on public.plants (user_id);
create index plants_plant_type_idx on public.plants (plant_type);

alter table public.plants enable row level security;

create policy "plants_select_own"
  on public.plants for select
  to authenticated
  using (auth.uid() = user_id);

create policy "plants_insert_own"
  on public.plants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "plants_update_own"
  on public.plants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plants_delete_own"
  on public.plants for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger plants_set_updated_at
  before update on public.plants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- care_tasks
-- ---------------------------------------------------------------------------
create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants (id) on delete cascade,
  -- denormalized for simple RLS + querying "my overdue tasks" without a join
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_type text not null check (
    task_type in ('watering', 'fertilizing', 'misting', 'pruning', 'rotating', 'custom')
  ),
  -- Human-readable label. For canonical (non-custom) types this mirrors
  -- CARE_TASK_TYPE_LABELS; for 'custom' this is the user-typed name.
  -- Never used as the matched value in application logic — task_type is.
  display_name text not null,
  interval_days integer not null check (interval_days > 0),
  next_due_at timestamptz not null,
  last_completed_at timestamptz,
  is_paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_tasks_plant_id_idx on public.care_tasks (plant_id);
create index care_tasks_user_id_idx on public.care_tasks (user_id);
create index care_tasks_next_due_at_idx on public.care_tasks (next_due_at);

alter table public.care_tasks enable row level security;

create policy "care_tasks_select_own"
  on public.care_tasks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "care_tasks_insert_own"
  on public.care_tasks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "care_tasks_update_own"
  on public.care_tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "care_tasks_delete_own"
  on public.care_tasks for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger care_tasks_set_updated_at
  before update on public.care_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- push_subscriptions — one row per subscribed device
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage — private bucket for plant photos, path convention:
--   {user_id}/{plant_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', false)
on conflict (id) do nothing;

create policy "plant_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plant_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plant_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "plant_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'plant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
