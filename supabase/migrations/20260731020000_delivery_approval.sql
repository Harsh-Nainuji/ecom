create type public.delivery_account_status as enum ('pending', 'approved', 'rejected', 'suspended');

alter table public.delivery_accounts 
add column if not exists account_status public.delivery_account_status not null default 'pending';

-- Ensure profile_id is unique
alter table public.delivery_accounts 
add constraint delivery_accounts_profile_id_key unique (profile_id);

-- Auto-create delivery account for new delivery profiles
create or replace function public.handle_new_delivery_profile()
returns trigger as $$
begin
  if new.role = 'delivery' then
    insert into public.delivery_accounts (profile_id, account_status)
    values (new.id, 'pending')
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_delivery_profile_created on public.profiles;
create trigger on_delivery_profile_created
  after insert or update of role on public.profiles
  for each row
  when (new.role = 'delivery')
  execute function public.handle_new_delivery_profile();
