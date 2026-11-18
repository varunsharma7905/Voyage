-- Voyage database setup.
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste everything -> Run.
-- Every table is private to the signed-in user (row level security), so Kiran can
-- later have his own login and never see your data.

create table public.subjects (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index subjects_user_name_key on public.subjects (user_id, lower(name));

create table public.chapters (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id bigint not null references public.subjects (id) on delete cascade,  -- removing a subject removes its chapters
  book       text not null default '',
  name       text not null check (char_length(btrim(name)) > 0),
  done       boolean not null default false,
  done_on    date,
  priority   text check (priority in ('High', 'Medium', 'Low')),
  created_at timestamptz not null default now()
);
create index chapters_user_idx    on public.chapters (user_id);
create index chapters_subject_idx on public.chapters (subject_id);

create table public.vocab (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word        text not null check (char_length(btrim(word)) > 0),
  meaning     text not null default '',
  synonyms    text not null default '',
  example1    text not null default '',
  example2    text not null default '',
  status      text not null default 'New',
  added_on    date not null default current_date,
  box         smallint not null default 0,
  next_review date,
  created_at  timestamptz not null default now()
);
create index vocab_user_idx on public.vocab (user_id);

create table public.mocks (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  taken_on   date not null default current_date,
  score      numeric not null,
  out_of     numeric not null default 200,
  quant      numeric,
  lr         numeric,
  verbal     numeric,
  ar         numeric,
  minutes    numeric,
  notes      text not null default '',
  created_at timestamptz not null default now()
);
create index mocks_user_idx on public.mocks (user_id);

create table public.companies (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company     text not null check (char_length(btrim(company)) > 0),
  title       text not null default '',
  field       text not null default '',
  location    text not null default '',
  link        text not null default '',
  description text not null default '',
  status      text not null default 'Saved',
  added_on    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index companies_user_idx on public.companies (user_id);

create table public.bucket_items (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) > 0),
  category    text not null default 'Experiences',
  horizon     text not null default 'Someday',
  status      text not null default 'Dream',
  cost        text not null default '',
  why         text not null default '',
  with_friend boolean not null default false,
  done_on     date,
  memory      text not null default '',
  created_at  timestamptz not null default now()
);
create index bucket_user_idx on public.bucket_items (user_id);

create table public.settings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key     text not null,
  value   text not null default '',
  primary key (user_id, key)
);

-- Row level security: each person can only see and change their own rows.
do $$
declare t text;
begin
  foreach t in array array['subjects','vocab','mocks','companies','bucket_items','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format($p$create policy "own rows" on public.%I for all to authenticated
                      using ((select auth.uid()) = user_id)
                      with check ((select auth.uid()) = user_id)$p$, t);
  end loop;
end $$;

-- Chapters also have to point at one of your own subjects.
alter table public.chapters enable row level security;
revoke all on public.chapters from anon;
grant select, insert, update, delete on public.chapters to authenticated;
create policy "own chapters" on public.chapters for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
