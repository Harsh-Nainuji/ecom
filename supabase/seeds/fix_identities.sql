begin;

-- Insert missing auth identities for demo users so GoTrue can authenticate them
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"buyer.demo@fabzone.dev"}'::jsonb, 'email', now(), now()),
  ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', '{"sub":"11111111-1111-1111-1111-111111111112","email":"buyer.second@fabzone.dev"}'::jsonb, 'email', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"seller.demo@fabzone.dev"}'::jsonb, 'email', now(), now()),
  ('22222222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222223', '{"sub":"22222222-2222-2222-2222-222222222223","email":"seller.handloom@fabzone.dev"}'::jsonb, 'email', now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"delivery.demo@fabzone.dev"}'::jsonb, 'email', now(), now())
on conflict (provider_id, provider) do update
  set identity_data = excluded.identity_data,
      updated_at = now();

commit;
