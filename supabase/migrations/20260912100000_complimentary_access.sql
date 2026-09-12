-- Grant complimentary (no-fee) access at signup for allowlisted emails.
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
    when lower(coalesce(new.email, '')) = 'rohitkota4@gmail.com' then 'complimentary'
    else 'none'
  end;

  insert into public.organizations (name, lemon_squeezy_subscription_status)
  values (org_name, billing_status)
  returning id into new_org_id;

  insert into public.users (id, org_id, role, email)
  values (new.id, new_org_id, 'owner', coalesce(new.email, ''));

  return new;
end;
$$;

-- Existing workspace for this email, if the account already exists.
update public.organizations o
set lemon_squeezy_subscription_status = 'complimentary'
from public.users u
where u.org_id = o.id
  and lower(u.email) = 'rohitkota4@gmail.com';
