-- bookings table for Click & Collect flow
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  notes text,
  pickup_time timestamptz not null,
  items jsonb not null default '[]'::jsonb,
  currency text not null default 'PLN',
  subtotal numeric not null default 0,
  total numeric not null default 0,
  stripe_session_id text,
  payment_status text not null default 'pay_at_counter',
  booking_status text not null default 'confirmed'
);

alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_insert_public'
  ) then
    create policy bookings_insert_public
      on public.bookings
      for insert
      to public
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_public'
  ) then
    create policy bookings_select_public
      on public.bookings
      for select
      to public
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_update_public'
  ) then
    create policy bookings_update_public
      on public.bookings
      for update
      to public
      using (true)
      with check (true);
  end if;
end $$;

alter publication supabase_realtime add table public.bookings;

