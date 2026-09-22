-- Re-create trigger function to store the random 6-digit code in plaintext
create or replace function public.handle_out_for_delivery_otp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if new.order_status = 'out_for_delivery' and coalesce(old.order_status, 'pending') <> 'out_for_delivery' then
    -- Generate plaintext 6-digit numeric string
    v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

    insert into public.delivery_otps (order_id, otp_code, expires_at, used, generated_at, attempt_count)
    values (new.id, v_code, now() + interval '24 hours', false, now(), 0)
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
