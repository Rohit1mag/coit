-- Org-level reminder inbox, plus a readable send log.

alter table public.organizations
  add column if not exists alert_email text;

alter table public.alert_sends
  add column if not exists recipients text[] not null default '{}';

alter table public.alert_sends
  add column if not exists sent_at timestamptz not null default now();

update public.organizations o
set alert_email = u.email
from public.users u
where u.org_id = o.id
  and u.role = 'owner'
  and coalesce(trim(o.alert_email), '') = '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  billing_status text;
begin
  org_name := coalesce(
    nullif(new.raw_user_meta_data->>'org_name', ''),
    split_part(coalesce(new.email, 'user'), '@', 1) || '''s Company'
  );

  billing_status := case
    when lower(coalesce(new.email, '')) in ('rohitkota4@gmail.com', 'rkdscnd@gmail.com') then 'complimentary'
    else 'none'
  end;

  insert into public.organizations (name, lemon_squeezy_subscription_status, alert_email)
  values (org_name, billing_status, nullif(new.email, ''))
  returning id into new_org_id;

  insert into public.users (id, org_id, role, email)
  values (new.id, new_org_id, 'owner', coalesce(new.email, ''));

  return new;
end;
$$;

drop policy if exists "members can view alert sends" on public.alert_sends;
create policy "members can view alert sends"
  on public.alert_sends for select
  to authenticated
  using (org_id = public.current_org_id());
