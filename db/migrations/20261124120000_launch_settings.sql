-- migrate:up
-- =============================================================================
-- Last launch settings (US09, RG15, ADR 0028): the last mode chosen and the settings of the
-- custom mode, kept per discipline with the pauses and synchronised like them.
-- =============================================================================

-- Settings already stored get the standard mode and the standard Numbers format (80 digits,
-- 60 s): the only discipline of lot 1. The defaults only fill those rows, then are dropped:
-- save_settings always gives the three values (data dictionary).
ALTER TABLE discipline_settings
    ADD COLUMN launch_mode trial_mode NOT NULL DEFAULT 'standard',
    ADD COLUMN custom_item_count smallint NOT NULL DEFAULT 80
        CONSTRAINT discipline_settings_custom_item_count_check
        CHECK (custom_item_count BETWEEN 1 AND 500),                      -- RG15
    ADD COLUMN custom_memorization_s smallint NOT NULL DEFAULT 60
        CONSTRAINT discipline_settings_custom_memorization_check
        CHECK (custom_memorization_s BETWEEN 1 AND 3600);                 -- RG15

ALTER TABLE discipline_settings
    ALTER COLUMN launch_mode DROP DEFAULT,
    ALTER COLUMN custom_item_count DROP DEFAULT,
    ALTER COLUMN custom_memorization_s DROP DEFAULT;

-- save_settings now reads the three launch settings of each discipline.
-- CREATE OR REPLACE keeps the privileges granted by the initial migration.
CREATE OR REPLACE FUNCTION save_settings(settings jsonb) RETURNS text
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

    INSERT INTO discipline_settings (owner_id, discipline, group_pattern,
                                     pause_before_memorization_s, pause_before_recall_s,
                                     launch_mode, custom_item_count, custom_memorization_s)
    SELECT auth.user_id(),
           entry ->> 'discipline',
           -- An empty array stays empty, so the check constraint refuses it (ES07).
           coalesce((SELECT array_agg(value::smallint ORDER BY position)
                     FROM jsonb_array_elements_text(entry -> 'group_pattern') WITH ORDINALITY AS p(value, position)),
                    '{}'),
           (entry ->> 'pause_before_memorization_s')::smallint,
           (entry ->> 'pause_before_recall_s')::smallint,
           (entry ->> 'launch_mode')::trial_mode,
           (entry ->> 'custom_item_count')::smallint,
           (entry ->> 'custom_memorization_s')::smallint
    FROM jsonb_array_elements(settings -> 'disciplines') AS entry
    ON CONFLICT (owner_id, discipline) DO UPDATE
    SET group_pattern = EXCLUDED.group_pattern,
        pause_before_memorization_s = EXCLUDED.pause_before_memorization_s,
        pause_before_recall_s = EXCLUDED.pause_before_recall_s,
        launch_mode = EXCLUDED.launch_mode,
        custom_item_count = EXCLUDED.custom_item_count,
        custom_memorization_s = EXCLUDED.custom_memorization_s;

    RETURN 'saved';
END;
$$;


-- migrate:down
-- Back to the display pattern version of save_settings, without the launch settings.

CREATE OR REPLACE FUNCTION save_settings(settings jsonb) RETURNS text
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
        RETURN 'ignored';
    END IF;

    INSERT INTO discipline_settings (owner_id, discipline, group_pattern,
                                     pause_before_memorization_s, pause_before_recall_s)
    SELECT auth.user_id(),
           entry ->> 'discipline',
           coalesce((SELECT array_agg(value::smallint ORDER BY position)
                     FROM jsonb_array_elements_text(entry -> 'group_pattern') WITH ORDINALITY AS p(value, position)),
                    '{}'),
           (entry ->> 'pause_before_memorization_s')::smallint,
           (entry ->> 'pause_before_recall_s')::smallint
    FROM jsonb_array_elements(settings -> 'disciplines') AS entry
    ON CONFLICT (owner_id, discipline) DO UPDATE
    SET group_pattern = EXCLUDED.group_pattern,
        pause_before_memorization_s = EXCLUDED.pause_before_memorization_s,
        pause_before_recall_s = EXCLUDED.pause_before_recall_s;

    RETURN 'saved';
END;
$$;

ALTER TABLE discipline_settings
    DROP COLUMN custom_memorization_s,
    DROP COLUMN custom_item_count,
    DROP COLUMN launch_mode;
