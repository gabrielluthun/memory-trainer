-- Registers the single practitioner account (ES01). Run by the CI after the migrations:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v owner_id="$AUTHORIZED_ACCOUNT_ID" -f db/scripts/create-account.sql
-- The Hanko identifier comes from a GitHub secret, never from the repository (ES09, ES10).
-- Idempotent: running it again changes nothing.

INSERT INTO accounts (owner_id) VALUES (:'owner_id') ON CONFLICT (owner_id) DO NOTHING;
