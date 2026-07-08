-- Harden RLS: close the anonymous browser path to Supabase.
--
-- ORDER MATTERS:
--   1. Deploy the app with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set
--      (server-only env vars — see README "Environment variables"). All
--      Supabase access now goes through the Next.js API routes / server
--      pages, which use the service role key. The service role key BYPASSES
--      RLS entirely, so dropping the anon policies below does not affect it.
--   2. THEN run this file in the Supabase SQL Editor. Running it before the
--      deploy would break the old client-side code still using the anon key.
--
-- After this runs, the public anon key can no longer read or write these
-- tables, so it is safe to leave in old bundles (and NEXT_PUBLIC_SUPABASE_*
-- env vars can eventually be removed).

-- ── analytics_events (policies created in analytics_events.sql) ──────────────
DROP POLICY "Allow anonymous reads" ON analytics_events;
DROP POLICY "Allow anonymous inserts" ON analytics_events;

-- ── leaderboard ───────────────────────────────────────────────────────────────
-- The leaderboard table's DDL is not in this repo, so its anon policy names
-- are unknown. List them first:
--
--   SELECT policyname FROM pg_policies WHERE tablename = 'leaderboard';
--
-- then drop each anon policy. Common names are pre-filled below; replace the
-- placeholders with the actual names from the query above.
DROP POLICY IF EXISTS "Allow anonymous reads" ON leaderboard;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON leaderboard;
-- DROP POLICY IF EXISTS "<your-anon-select-policy-name>" ON leaderboard;
-- DROP POLICY IF EXISTS "<your-anon-insert-policy-name>" ON leaderboard;

-- Defense in depth: the /api/scores route already validates 0 < score <= 10000,
-- but a CHECK constraint enforces it at the database level too:
--
--   ALTER TABLE leaderboard
--     ADD CONSTRAINT score_bounds
--     CHECK (score >= 0 AND score <= 10000);
