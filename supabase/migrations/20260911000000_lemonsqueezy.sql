-- Rename Stripe billing columns if the original schema was already applied.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'stripe_customer_id'
  ) then
    alter table public.organizations rename column stripe_customer_id to lemon_squeezy_customer_id;
    alter table public.organizations rename column stripe_subscription_id to lemon_squeezy_subscription_id;
    alter table public.organizations rename column stripe_subscription_status to lemon_squeezy_subscription_status;
  end if;
end $$;
