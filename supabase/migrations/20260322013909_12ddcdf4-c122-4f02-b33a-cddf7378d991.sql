
-- profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- portfolios table
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  shares numeric not null default 0,
  avg_cost numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.portfolios enable row level security;

create policy "Users can view own portfolio" on public.portfolios for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert portfolio" on public.portfolios for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update portfolio" on public.portfolios for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete portfolio" on public.portfolios for delete to authenticated using (auth.uid() = user_id);

-- watchlist table
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  target_price numeric,
  alert_type text default 'none',
  created_at timestamptz default now(),
  unique(user_id, symbol)
);
alter table public.watchlist enable row level security;

create policy "Users can view own watchlist" on public.watchlist for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert watchlist" on public.watchlist for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update watchlist" on public.watchlist for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete watchlist" on public.watchlist for delete to authenticated using (auth.uid() = user_id);

-- stock alerts
create table public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  condition text not null,
  threshold numeric not null,
  is_active boolean default true,
  triggered_at timestamptz,
  created_at timestamptz default now()
);
alter table public.stock_alerts enable row level security;

create policy "Users can view own alerts" on public.stock_alerts for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert alerts" on public.stock_alerts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update alerts" on public.stock_alerts for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete alerts" on public.stock_alerts for delete to authenticated using (auth.uid() = user_id);
