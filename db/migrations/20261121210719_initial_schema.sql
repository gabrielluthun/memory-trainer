-- migrate:up
-- =============================================================================
-- Initial schema, lot 1 (PostgreSQL 16+, Neon).
-- Model: docs/04-specifications/bdd/mpd.md ; access rules: docs/04-specifications/acces.md.
-- Prerequisites provided by Neon (not created here): schema `auth` and `auth.user_id()`,
-- which returns the identity of the verified Hanko token.
-- =============================================================================


-- 1. Types ---------------------------------------------------------------------
-- Value lists of the data dictionary, as ENUM types (ADR 0017).

CREATE TYPE trial_mode AS ENUM ('standard', 'custom');                           -- RG15
CREATE TYPE trial_status AS ENUM ('completed', 'abandoned', 'external_error');   -- RG18, RG23, RG24
CREATE TYPE interface_language AS ENUM ('fr', 'en');                            -- EF20


-- 2. Tables --------------------------------------------------------------------

-- The single practitioner account. One row, created by the CI (db/scripts/create-account.sql).
-- Any other identity is blocked by the foreign keys pointing here (ES01).
CREATE TABLE accounts (
    owner_id              text PRIMARY KEY CHECK (owner_id <> ''),
    interface_language    interface_language NOT NULL DEFAULT 'fr',
    -- '-infinity': the first change coming from a device always wins (ADR 0012).
    settings_modified_at  timestamptz NOT NULL DEFAULT '-infinity'
);

-- Disciplines. The key is the code (ADR 0016).
CREATE TABLE disciplines (
    discipline  text PRIMARY KEY CHECK (discipline ~ '^[a-z_]+$')
);

-- Closed trials. Never updated nor deleted (section 5).
CREATE TABLE trials (
    trial_id               uuid PRIMARY KEY,                                   -- created on the device (ES06)
    sequence_number        bigint GENERATED ALWAYS AS IDENTITY UNIQUE,         -- set by the database (ADR 0011)
    owner_id               text NOT NULL REFERENCES accounts (owner_id),
    discipline             text NOT NULL REFERENCES disciplines (discipline),
    mode                   trial_mode NOT NULL,
    status                 trial_status NOT NULL,
    started_at             timestamptz NOT NULL,                               -- device time (RG22)
    item_count             smallint NOT NULL CHECK (item_count BETWEEN 1 AND 500),
    memorization_limit_ms  integer NOT NULL CHECK (memorization_limit_ms BETWEEN 1000 AND 3600000),
    recall_limit_ms        integer NOT NULL CHECK (recall_limit_ms = 240000),  -- RG01, RG15
    memorization_ms        integer NOT NULL,
    recall_ms              integer NOT NULL,
    score                  smallint,
    CONSTRAINT trials_memorization_in_limit CHECK (memorization_ms BETWEEN 0 AND memorization_limit_ms),
    CONSTRAINT trials_recall_in_limit CHECK (recall_ms BETWEEN 0 AND recall_limit_ms),
    CONSTRAINT trials_score_in_range CHECK (score BETWEEN 0 AND item_count),
    -- A score only for a counted trial (RG12, RG23).
    CONSTRAINT trials_score_iff_completed CHECK ((status = 'completed') = (score IS NOT NULL)),
    -- Numbers standard format: 80 digits, 1 minute (RG01, RG02).
    CONSTRAINT trials_numbers_standard_format CHECK (
        mode <> 'standard' OR discipline <> 'numbers'
        OR (item_count = 80 AND memorization_limit_ms = 60000)
    )
);

-- Items of a trial, common part (identified relative to the trial).
CREATE TABLE trial_items (
    trial_id    uuid NOT NULL REFERENCES trials (trial_id),
    position    smallint NOT NULL CHECK (position >= 1),
    is_correct  boolean,                                                       -- empty when the trial is not counted
    PRIMARY KEY (trial_id, position)
);

-- Numbers items. Same key as trial_items (ADR 0016).
CREATE TABLE trial_items_numbers (
    trial_id        uuid NOT NULL,
    position        smallint NOT NULL,
    expected_digit  smallint NOT NULL CHECK (expected_digit BETWEEN 0 AND 9),  -- RG02
    answered_digit  smallint CHECK (answered_digit BETWEEN 0 AND 9),          -- empty when the cell was left blank
    PRIMARY KEY (trial_id, position),
    FOREIGN KEY (trial_id, position) REFERENCES trial_items (trial_id, position)
);

-- Settings per discipline.
CREATE TABLE discipline_settings (
    owner_id                     text NOT NULL REFERENCES accounts (owner_id),
    discipline                   text NOT NULL REFERENCES disciplines (discipline),
    group_size                   smallint NOT NULL CHECK (group_size BETWEEN 1 AND 10),                    -- RG11
    pause_before_memorization_s  smallint NOT NULL CHECK (pause_before_memorization_s IN (0, 5, 10, 20)),  -- RG25
    pause_before_recall_s        smallint NOT NULL CHECK (pause_before_recall_s IN (0, 5, 10, 20)),        -- RG25
    PRIMARY KEY (owner_id, discipline)
);


-- 3. Indexes -------------------------------------------------------------------
-- No index besides the keys in lot 1 (mpd.md, section 4).


-- 4. Multi-row checks (deferred triggers) --------------------------------------
-- Checked at the end of the transaction, whatever the write path (ADR 0017).

CREATE FUNCTION check_trial_integrity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    t              trials%ROWTYPE;
    item_rows      integer;
    last_position  integer;
    detail_rows    integer;
    inconsistent   integer;
    correct_items  integer;
BEGIN
    SELECT * INTO t FROM trials WHERE trial_id = NEW.trial_id;

    -- Exactly item_count items, from position 1 to item_count (positions unique by the key).
    SELECT count(*), max(position) INTO item_rows, last_position
    FROM trial_items WHERE trial_id = t.trial_id;
    IF item_rows <> t.item_count OR last_position <> t.item_count THEN
        RAISE EXCEPTION 'trial %: % items expected, % found', t.trial_id, t.item_count, item_rows;
    END IF;

    -- One row of the discipline's sub-table for each item (exclusive specialisation).
    IF t.discipline = 'numbers' THEN
        SELECT count(*) INTO detail_rows FROM trial_items_numbers WHERE trial_id = t.trial_id;
        IF detail_rows <> t.item_count THEN
            RAISE EXCEPTION 'trial %: every item needs one numbers detail row', t.trial_id;
        END IF;

        -- "Correct": empty when the trial is not counted, otherwise true only if answer = expected (RG12).
        SELECT count(*) INTO inconsistent
        FROM trial_items i
        JOIN trial_items_numbers n USING (trial_id, position)
        WHERE i.trial_id = t.trial_id
          AND i.is_correct IS DISTINCT FROM CASE
                WHEN t.status = 'completed'
                THEN coalesce(n.answered_digit = n.expected_digit, false)
              END;
        IF inconsistent > 0 THEN
            RAISE EXCEPTION 'trial %: % items have an inconsistent is_correct', t.trial_id, inconsistent;
        END IF;
    ELSE
        -- Each discipline of the next lots will add its sub-table here.
        RAISE EXCEPTION 'trial %: discipline % has no item table yet', t.trial_id, t.discipline;
    END IF;

    -- Score = number of correct items (RG12, ES07).
    IF t.status = 'completed' THEN
        SELECT count(*) INTO correct_items
        FROM trial_items WHERE trial_id = t.trial_id AND is_correct;
        IF t.score <> correct_items THEN
            RAISE EXCEPTION 'trial %: score % but % correct items', t.trial_id, t.score, correct_items;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trials_integrity
    AFTER INSERT ON trials DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_trial_integrity();
CREATE CONSTRAINT TRIGGER trial_items_integrity
    AFTER INSERT ON trial_items DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_trial_integrity();
CREATE CONSTRAINT TRIGGER trial_items_numbers_integrity
    AFTER INSERT ON trial_items_numbers DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_trial_integrity();


-- 5. Immutable trials ----------------------------------------------------------
-- Refuses any update or deletion, whatever the role (RG18, ES05).
-- A real correction will need a dedicated migration that disables this trigger (ADR 0017).

CREATE FUNCTION forbid_trial_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'trials are immutable: % on % refused', TG_OP, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trials_immutable BEFORE UPDATE OR DELETE ON trials
    FOR EACH ROW EXECUTE FUNCTION forbid_trial_change();
CREATE TRIGGER trials_no_truncate BEFORE TRUNCATE ON trials
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_trial_change();
CREATE TRIGGER trial_items_immutable BEFORE UPDATE OR DELETE ON trial_items
    FOR EACH ROW EXECUTE FUNCTION forbid_trial_change();
CREATE TRIGGER trial_items_no_truncate BEFORE TRUNCATE ON trial_items
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_trial_change();
CREATE TRIGGER trial_items_numbers_immutable BEFORE UPDATE OR DELETE ON trial_items_numbers
    FOR EACH ROW EXECUTE FUNCTION forbid_trial_change();
CREATE TRIGGER trial_items_numbers_no_truncate BEFORE TRUNCATE ON trial_items_numbers
    FOR EACH STATEMENT EXECUTE FUNCTION forbid_trial_change();


-- 6. Functions called by the app -----------------------------------------------
-- submit_trial: caller's rights (SECURITY INVOKER), so under the RLS rules.
-- save_settings: owner's rights (SECURITY DEFINER), the only write path for settings (ADR 0018).
-- The identity comes from the token: auth.user_id(), provided by Neon.

-- Upload of a closed trial (ADR 0010). Returns 'inserted' or 'duplicate'.
-- A refused value raises an error: the app marks the trial as "rejected".
CREATE FUNCTION submit_trial(trial jsonb) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
    new_trial_id uuid := (trial ->> 'trial_id')::uuid;
BEGIN
    -- One upload at a time: sequence numbers follow the commit order (ADR 0011).
    -- The lock is released at the end of the transaction, after the deferred checks.
    PERFORM pg_advisory_xact_lock(hashtext('memory-trainer.submit_trial'));

    -- Already received: nothing to do (RG22, ES06).
    IF EXISTS (SELECT 1 FROM trials WHERE trial_id = new_trial_id) THEN
        RETURN 'duplicate';
    END IF;

    -- The owner comes from the token, never from the uploaded data (ES04).
    INSERT INTO trials (trial_id, owner_id, discipline, mode, status, started_at, item_count,
                        memorization_limit_ms, recall_limit_ms, memorization_ms, recall_ms, score)
    VALUES (new_trial_id,
            auth.user_id(),
            trial ->> 'discipline',
            (trial ->> 'mode')::trial_mode,
            (trial ->> 'status')::trial_status,
            (trial ->> 'started_at')::timestamptz,
            (trial ->> 'item_count')::smallint,
            (trial ->> 'memorization_limit_ms')::integer,
            (trial ->> 'recall_limit_ms')::integer,
            (trial ->> 'memorization_ms')::integer,
            (trial ->> 'recall_ms')::integer,
            (trial ->> 'score')::smallint);

    INSERT INTO trial_items (trial_id, position, is_correct)
    SELECT new_trial_id, (item ->> 'position')::smallint, (item ->> 'is_correct')::boolean
    FROM jsonb_array_elements(trial -> 'items') AS item;

    IF trial ->> 'discipline' = 'numbers' THEN
        INSERT INTO trial_items_numbers (trial_id, position, expected_digit, answered_digit)
        SELECT new_trial_id, (item ->> 'position')::smallint,
               (item ->> 'expected_digit')::smallint, (item ->> 'answered_digit')::smallint
        FROM jsonb_array_elements(trial -> 'items') AS item;
    END IF;

    RETURN 'inserted';
END;
$$;

-- Upload of the settings (ADR 0012). Returns 'saved' or 'ignored'.
-- Settings are only replaced when the received change is more recent.
-- SECURITY DEFINER: the app has no direct write right on accounts and
-- discipline_settings (ADR 0018). The function only touches the row of auth.user_id().
CREATE FUNCTION save_settings(settings jsonb) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    modified_at   timestamptz := (settings ->> 'settings_modified_at')::timestamptz;
    updated_rows  integer;
BEGIN
    UPDATE accounts
    SET interface_language = (settings ->> 'interface_language')::interface_language,
        settings_modified_at = modified_at
    WHERE owner_id = auth.user_id()
      AND settings_modified_at < modified_at;
    GET DIAGNOSTICS updated_rows = ROW_COUNT;

    IF updated_rows = 0 THEN
        RETURN 'ignored';   -- older change, or unknown account
    END IF;

    INSERT INTO discipline_settings (owner_id, discipline, group_size,
                                     pause_before_memorization_s, pause_before_recall_s)
    SELECT auth.user_id(),
           entry ->> 'discipline',
           (entry ->> 'group_size')::smallint,
           (entry ->> 'pause_before_memorization_s')::smallint,
           (entry ->> 'pause_before_recall_s')::smallint
    FROM jsonb_array_elements(settings -> 'disciplines') AS entry
    ON CONFLICT (owner_id, discipline) DO UPDATE
    SET group_size = EXCLUDED.group_size,
        pause_before_memorization_s = EXCLUDED.pause_before_memorization_s,
        pause_before_recall_s = EXCLUDED.pause_before_recall_s;

    RETURN 'saved';
END;
$$;


-- 7. Initial data and row-level security ---------------------------------------

-- Disciplines of lot 1.
INSERT INTO disciplines (discipline) VALUES ('numbers');

-- RLS on every table: everything is refused until section 8 allows it (ES04).
ALTER TABLE accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_items_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_settings ENABLE ROW LEVEL SECURITY;


-- 8. Roles, privileges and RLS rules (ADR 0018) --------------------------------
-- authenticated and anonymous are the Neon Data API roles: they already exist at Neon.
-- backup_reader is the read-only role of the backup Worker; its password is set in Neon
-- and stored in the Worker secrets, never here (ES09).

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anonymous') THEN CREATE ROLE anonymous NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backup_reader') THEN CREATE ROLE backup_reader LOGIN; END IF;
END;
$$;

-- Nothing by default: neither on tables nor on functions (created executable by everyone).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anonymous, authenticated, backup_reader;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anonymous, authenticated, backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated, backup_reader;

-- App (authenticated): reads its data, inserts trials, never writes anywhere else.
GRANT SELECT ON accounts, disciplines, trials, trial_items, trial_items_numbers, discipline_settings TO authenticated;
GRANT INSERT ON trials, trial_items, trial_items_numbers TO authenticated;
GRANT EXECUTE ON FUNCTION submit_trial(jsonb), save_settings(jsonb) TO authenticated;

-- Backup (backup_reader): read only, no function.
GRANT SELECT ON accounts, disciplines, trials, trial_items, trial_items_numbers, discipline_settings TO backup_reader;

-- App RLS rules: only the rows of the signed-in owner (ES04).
CREATE POLICY accounts_owner_read ON accounts
    FOR SELECT TO authenticated USING (owner_id = auth.user_id());
CREATE POLICY disciplines_read ON disciplines
    FOR SELECT TO authenticated USING (true);                     -- reference data, no owner
CREATE POLICY trials_owner_read ON trials
    FOR SELECT TO authenticated USING (owner_id = auth.user_id());
CREATE POLICY trials_owner_insert ON trials
    FOR INSERT TO authenticated WITH CHECK (owner_id = auth.user_id());
CREATE POLICY trial_items_owner_read ON trial_items
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM trials t WHERE t.trial_id = trial_items.trial_id AND t.owner_id = auth.user_id()));
CREATE POLICY trial_items_owner_insert ON trial_items
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM trials t WHERE t.trial_id = trial_items.trial_id AND t.owner_id = auth.user_id()));
CREATE POLICY trial_items_numbers_owner_read ON trial_items_numbers
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM trials t WHERE t.trial_id = trial_items_numbers.trial_id AND t.owner_id = auth.user_id()));
CREATE POLICY trial_items_numbers_owner_insert ON trial_items_numbers
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM trials t WHERE t.trial_id = trial_items_numbers.trial_id AND t.owner_id = auth.user_id()));
CREATE POLICY discipline_settings_owner_read ON discipline_settings
    FOR SELECT TO authenticated USING (owner_id = auth.user_id());

-- Backup RLS rules: read every row, nothing else (ADR 0018).
CREATE POLICY accounts_backup_read ON accounts FOR SELECT TO backup_reader USING (true);
CREATE POLICY disciplines_backup_read ON disciplines FOR SELECT TO backup_reader USING (true);
CREATE POLICY trials_backup_read ON trials FOR SELECT TO backup_reader USING (true);
CREATE POLICY trial_items_backup_read ON trial_items FOR SELECT TO backup_reader USING (true);
CREATE POLICY trial_items_numbers_backup_read ON trial_items_numbers FOR SELECT TO backup_reader USING (true);
CREATE POLICY discipline_settings_backup_read ON discipline_settings FOR SELECT TO backup_reader USING (true);


-- migrate:down
-- Used on the local machine and the dev branch only. Production is never rolled back with
-- this section: fix with a new migration, or restore the export (docs/06-qualite-deploiement/deploiement.md).
-- The Neon roles (authenticated, anonymous) and the auth schema are left untouched.

DROP TABLE discipline_settings, trial_items_numbers, trial_items, trials, disciplines, accounts;
DROP FUNCTION submit_trial(jsonb), save_settings(jsonb), check_trial_integrity(), forbid_trial_change();
DROP TYPE trial_mode, trial_status, interface_language;
REVOKE USAGE ON SCHEMA public FROM authenticated, backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
DROP ROLE backup_reader;
