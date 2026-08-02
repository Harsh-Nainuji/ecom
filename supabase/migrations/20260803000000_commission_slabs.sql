-- Create commission mode enum type if not exists
do $$
begin
  if not exists (select 1 from pg_type where typname = 'commission_mode_type') then
    create type public.commission_mode_type as enum ('flat', 'tiered');
  end if;
end$$;

-- Add commission_mode to commission_settings
alter table public.commission_settings
  add column if not exists commission_mode public.commission_mode_type not null default 'flat';

-- Create commission_slabs table
create table if not exists public.commission_slabs (
  id uuid primary key default gen_random_uuid(),
  min_price numeric(12,2) not null default 0.00 check (min_price >= 0),
  max_price numeric(12,2) check (max_price > min_price), -- null means no upper bound
  percent numeric(5,2) not null check (percent >= 0 and percent <= 100),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.commission_slabs enable row level security;

-- Policies for commission_slabs
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'commission_slabs' and policyname = 'Anyone can read commission slabs'
  ) then
    create policy "Anyone can read commission slabs" on public.commission_slabs
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'commission_slabs' and policyname = 'Admin can modify commission slabs'
  ) then
    create policy "Admin can modify commission slabs" on public.commission_slabs
      for all to authenticated using (
        (select role from public.profiles where id = auth.uid()) = 'admin'
      );
  end if;
end$$;

-- Seed default slabs matching old 15% / 10% / 5% rules
insert into public.commission_slabs (min_price, max_price, percent)
values 
  (0.00, 1000.00, 15.00),
  (1000.00, 10000.00, 10.00),
  (10000.00, null, 5.00)
on conflict do nothing;
