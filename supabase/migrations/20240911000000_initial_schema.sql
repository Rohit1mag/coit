-- COI Expiration Tracker — initial schema + RLS
-- Apply in the Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lemon_squeezy_customer_id text unique,
  lemon_squeezy_subscription_id text,
  lemon_squeezy_subscription_status text not null default 'none',
  alert_cadences integer[] not null default '{30,14,3}',
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  email text not null,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  phone text,
  trade text,
  created_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  token text not null unique,
  vendor_name text,
  contact_email text,
  trade text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  file_url text not null,
  effective_date date,
  expiration_date date,
  liability_limit text,
  workers_comp_included boolean,
  confidence_score numeric,
  status text not null default 'pending'
    check (status in ('pending', 'valid', 'expiring_soon', 'expired', 'parse_failed')),
  raw_ai_json jsonb,
  upload_token text,
  created_at timestamptz not null default now()
);

create table public.alert_sends (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  alert_type text not null,
  sent_on date not null default (timezone('utc', now()))::date,
  unique (document_id, alert_type, sent_on)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index users_org_id_idx on public.users (org_id);
create index vendors_org_id_idx on public.vendors (org_id);
create index vendors_org_email_idx on public.vendors (org_id, contact_email);
create index documents_org_id_idx on public.documents (org_id);
create index documents_vendor_id_idx on public.documents (vendor_id);
create index documents_expiration_idx on public.documents (expiration_date);
create index documents_status_idx on public.documents (status);
create index invites_token_idx on public.invites (token);
create index invites_org_id_idx on public.invites (org_id);
create index alert_sends_org_sent_idx on public.alert_sends (org_id, sent_on);

-- ---------------------------------------------------------------------------
-- Latest document per vendor (security invoker inherits table RLS)
-- ---------------------------------------------------------------------------

create or replace view public.vendor_latest_documents
with (security_invoker = true) as
select distinct on (v.id)
  v.id as vendor_id,
  v.org_id,
  v.name,
  v.contact_name,
  v.contact_email,
  v.phone,
  v.trade,
  v.created_at as vendor_created_at,
  d.id as document_id,
  d.file_url,
  d.effective_date,
  d.expiration_date,
  d.liability_limit,
  d.workers_comp_included,
  d.confidence_score,
  d.status,
  d.created_at as document_created_at
from public.vendors v
left join public.documents d on d.vendor_id = v.id
order by v.id, d.created_at desc nulls last;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.users where id = auth.uid() limit 1
$$;

create or replace function public.coi_status(expiration date)
returns text
language sql
immutable
as $$
  select case
    when expiration is null then 'pending'
    when expiration < (timezone('utc', now()))::date then 'expired'
    when expiration <= (timezone('utc', now()))::date + 30 then 'expiring_soon'
    else 'valid'
  end
$$;

-- Keep document.status in sync when dates change
create or replace function public.documents_set_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'parse_failed' then
    return new;
  end if;
  new.status := public.coi_status(new.expiration_date);
  return new;
end;
$$;

create trigger documents_set_status
  before insert or update of expiration_date
  on public.documents
  for each row
  execute function public.documents_set_status();

-- Create org + profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
begin
  org_name := coalesce(
    nullif(new.raw_user_meta_data->>'org_name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1) || '''s Company'
  );

  insert into public.organizations (name)
  values (org_name)
  returning id into new_org_id;

  insert into public.users (id, org_id, role, email)
  values (new.id, new_org_id, 'owner', coalesce(new.email, ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.vendors enable row level security;
alter table public.invites enable row level security;
alter table public.documents enable row level security;
alter table public.alert_sends enable row level security;

create policy "members can view their org"
  on public.organizations for select
  to authenticated
  using (id = public.current_org_id());

create policy "owners can update their org"
  on public.organizations for update
  to authenticated
  using (
    id = public.current_org_id()
    and exists (
      select 1 from public.users
      where id = auth.uid()
        and org_id = organizations.id
        and role in ('owner', 'admin')
    )
  )
  with check (id = public.current_org_id());

create policy "members can view teammates"
  on public.users for select
  to authenticated
  using (org_id = public.current_org_id());

create policy "users can update themselves"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "org members manage vendors"
  on public.vendors for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "org members manage invites"
  on public.invites for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

create policy "org members manage documents"
  on public.documents for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- alert_sends is service-role only (no policies for authenticated)

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coi-documents',
  'coi-documents',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "org members upload COIs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coi-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "org members read COIs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coi-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "org members update COIs"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'coi-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "org members delete COIs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'coi-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, update on public.organizations to authenticated;
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.vendors to authenticated;
grant select, insert, update, delete on public.invites to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select on public.vendor_latest_documents to authenticated;
