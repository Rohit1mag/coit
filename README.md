# COI Tracker

Certificate of Insurance expiration tracker for small general contractors and property managers.

Next.js App Router · Supabase · Lemon Squeezy ($99/mo, 14-day trial) · Resend · GPT-4o / Claude 3.5 Sonnet Vision.

## Setup

1. Create a Supabase project. Run `supabase/migrations/20240911000000_initial_schema.sql` in the SQL editor. If you already applied the original Stripe columns, also run `supabase/migrations/20260911000000_lemonsqueezy.sql`.
2. In Authentication, enable Email (password + magic link). Add `http://localhost:3000/auth/callback` to redirect URLs.
3. Copy `.env.example` to `.env.local` and fill in keys.
4. In Lemon Squeezy, create a **COI Tracker** subscription product at $99/month with a 14-day trial. Paste the store id and variant id into `LEMONSQUEEZY_STORE_ID` and `LEMONSQUEEZY_VARIANT_ID`.
5. Point a Lemon Squeezy webhook at `/api/lemonsqueezy/webhook` and subscribe to:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_resumed`
   - `subscription_expired`
   - `subscription_paused`
   - `subscription_unpaused`
   - `subscription_payment_failed`
   - `subscription_payment_success`
   - `subscription_payment_recovered`
6. Verify your sender in Resend.
7. Deploy on Vercel. Set the same env vars. The daily cron in `vercel.json` calls `/api/cron/check-expirations` with `Authorization: Bearer $CRON_SECRET`.

```bash
npm install
npm run dev
```

Lemon Squeezy is the merchant of record and collects sales tax for you.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing + $99/mo CTA |
| `/login`, `/signup` | Password + magic link |
| `/dashboard` | Metrics, vendor table, upload, invite |
| `/settings` | Lemon Squeezy portal + alert cadences |
| `/upload/[token]` | Public subcontractor upload |
| `/api/parse-coi` | Vision extraction + vendor upsert |
| `/api/cron/check-expirations` | Daily reminder emails |
