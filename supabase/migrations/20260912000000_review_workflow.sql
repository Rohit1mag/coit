-- Split-screen GC review: extracted endorsements, review status, 30/14/7 cadence.

alter table public.documents
  add column if not exists additional_insured boolean,
  add column if not exists waiver_subrogation boolean,
  add column if not exists notes text,
  add column if not exists review_status text,
  add column if not exists verified_by uuid references public.users (id) on delete set null,
  add column if not exists verified_at timestamptz;

update public.documents
set review_status = case
  when status in ('valid', 'expiring_soon', 'expired') then 'approved'
  else 'pending_review'
end
where review_status is null;

alter table public.documents
  alter column review_status set default 'pending_review';

alter table public.documents
  alter column review_status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_review_status_check'
  ) then
    alter table public.documents
      add constraint documents_review_status_check
      check (review_status in ('pending_review', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists documents_review_status_idx
  on public.documents (org_id, review_status);

alter table public.organizations
  alter column alert_cadences set default '{30,14,7}';

update public.organizations
set alert_cadences = '{30,14,7}'
where alert_cadences = '{30,14,3}';

drop view if exists public.vendor_latest_documents;

create view public.vendor_latest_documents
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
  d.additional_insured,
  d.waiver_subrogation,
  d.notes,
  d.confidence_score,
  d.status,
  d.review_status,
  d.verified_at,
  d.created_at as document_created_at
from public.vendors v
left join public.documents d on d.vendor_id = v.id
order by v.id, d.created_at desc nulls last;

grant select on public.vendor_latest_documents to authenticated;
