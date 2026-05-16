create table public.profiles (
  wallet_address text primary key check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  username text not null,
  avatar_url text,
  bio text default '',
  verified boolean not null default false,
  purple_tick boolean not null default false,
  balance_cusd numeric not null default 0,
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
on public.profiles for select
using (true);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();