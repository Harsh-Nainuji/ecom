create extension if not exists pgcrypto;

-- Alter otp_code to support 64-character SHA-256 hashes
alter table public.delivery_otps alter column otp_code type varchar(64);

-- Re-create trigger function to hash the random 6-digit code
create or replace function public.handle_out_for_delivery_otp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_hash text;
begin
  if new.order_status = 'out_for_delivery' and coalesce(old.order_status, 'pending') <> 'out_for_delivery' then
    -- Generate plaintext 6-digit numeric string
    v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    -- Hash code using SHA-256
    v_hash := encode(digest(v_code, 'sha256'), 'hex');

    insert into public.delivery_otps (order_id, otp_code, expires_at, used, generated_at, attempt_count)
    values (new.id, v_hash, now() + interval '24 hours', false, now(), 0)
    on conflict (order_id) do update
      set otp_code = excluded.otp_code,
          expires_at = excluded.expires_at,
          used = false,
          generated_at = now(),
          attempt_count = 0;
  end if;
  return new;
end;
$$;

-- Create Account Deletion Requests table
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status varchar(20) not null default 'pending'
);

-- Enable RLS and add policy
alter table public.account_deletion_requests enable row level security;

create policy "Users can insert their own deletion requests"
  on public.account_deletion_requests
  for insert
  with check (auth.uid() = user_id);

create policy "Admins can view deletion requests"
  on public.account_deletion_requests
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
