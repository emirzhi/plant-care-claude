-- Per-day idempotency for the push digest.
--
-- The digest is triggered by an external hourly scheduler (GitHub Actions —
-- Vercel Hobby only allows daily crons), which means retries, overlapping
-- runs, or a manual trigger could send the same user two digests in one day.
-- Record the user's *local* date on send and skip anyone already sent today.
alter table public.profiles
  add column last_digest_sent_on date;

comment on column public.profiles.last_digest_sent_on is
  'Local (profiles.timezone) date the last push digest was sent. Guards against duplicate sends when the digest is triggered more than once in the same local day.';
