create type public.transaction_type as enum ('INCOME', 'EXPENSE');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  username text unique,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  icon text not null default '📦',
  color text not null default '#607D8B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  type public.transaction_type not null,
  is_default boolean generated always as (user_id is null) stored,
  created_at timestamptz not null default now()
);
create unique index categories_name_owner_uk on public.categories (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index categories_user_id_idx on public.categories (user_id);

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id bigint not null references public.categories (id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  type public.transaction_type not null,
  description text check (char_length(description) <= 255),
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_category_id_idx on public.transactions (category_id);

create table public.budgets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id bigint not null references public.categories (id) on delete cascade,
  amount_limit numeric(12,2) not null check (amount_limit > 0),
  budget_month smallint not null check (budget_month between 1 and 12),
  budget_year smallint not null check (budget_year between 2000 and 2100),
  created_at timestamptz not null default now(),
  constraint budgets_user_category_period_uk unique (user_id, category_id, budget_month, budget_year)
);
create index budgets_category_id_idx on public.budgets (category_id);

-- updated_at maintenance
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger transactions_touch before update on public.transactions for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- profile row on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'username', ''));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "profiles: read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "categories: read defaults and own" on public.categories for select to authenticated using (user_id is null or user_id = (select auth.uid()));
create policy "categories: insert own" on public.categories for insert to authenticated with check (user_id = (select auth.uid()));
create policy "categories: update own" on public.categories for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories: delete own" on public.categories for delete to authenticated using (user_id = (select auth.uid()));

create policy "transactions: all own" on public.transactions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "budgets: all own" on public.budgets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- default categories (same set the Spring DataSeeder created)
insert into public.categories (name, icon, color, type) values
  ('Food & Dining', '🍔', '#FF5722', 'EXPENSE'),
  ('Transport', '🚗', '#2196F3', 'EXPENSE'),
  ('Shopping', '🛍️', '#E91E63', 'EXPENSE'),
  ('Entertainment', '🎬', '#9C27B0', 'EXPENSE'),
  ('Bills & Utilities', '💡', '#FF9800', 'EXPENSE'),
  ('Health', '🏥', '#4CAF50', 'EXPENSE'),
  ('Education', '📚', '#3F51B5', 'EXPENSE'),
  ('Rent', '🏠', '#795548', 'EXPENSE'),
  ('Groceries', '🛒', '#009688', 'EXPENSE'),
  ('Other Expense', '📦', '#607D8B', 'EXPENSE'),
  ('Salary', '💰', '#4CAF50', 'INCOME'),
  ('Freelance', '💻', '#00BCD4', 'INCOME'),
  ('Investment', '📈', '#8BC34A', 'INCOME'),
  ('Gift', '🎁', '#FF4081', 'INCOME'),
  ('Other Income', '💵', '#FFC107', 'INCOME');
