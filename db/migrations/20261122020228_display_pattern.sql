-- migrate:up
-- =============================================================================
-- Display pattern (RG11, ADR 0027): the single group size becomes a pattern of 1 to 3
-- subgroups of 1 to 5 elements, stored as an array of integers.
-- =============================================================================

ALTER TABLE discipline_settings ADD COLUMN group_pattern smallint[];

-- Existing settings: a size of 1 to 5 becomes the matching pattern, a larger one the default "2".
UPDATE discipline_settings
SET group_pattern = CASE WHEN group_size <= 5 THEN ARRAY[group_size] ELSE ARRAY[2]::smallint[] END;

ALTER TABLE discipline_settings
    ALTER COLUMN group_pattern SET NOT NULL,
    ADD CONSTRAINT discipline_settings_group_pattern_valid CHECK (
        cardinality(group_pattern) BETWEEN 1 AND 3
        AND array_ndims(group_pattern) = 1
        AND array_position(group_pattern, NULL) IS NULL
        AND 1 <= ALL (group_pattern)
        AND 5 >= ALL (group_pattern)
    );

ALTER TABLE discipline_settings DROP COLUMN group_size;

-- save_settings now reads `group_pattern` (a JSON array of integers) instead of `group_size`.
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
                                     pause_before_memorization_s, pause_before_recall_s)
    SELECT auth.user_id(),
           entry ->> 'discipline',
           -- An empty array stays empty, so the check constraint refuses it (ES07).
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


-- migrate:down
-- Back to a single group size: the sum of the pattern, at most 10.

ALTER TABLE discipline_settings ADD COLUMN group_size smallint;

UPDATE discipline_settings
SET group_size = LEAST(10, (SELECT sum(size) FROM unnest(group_pattern) AS size));

ALTER TABLE discipline_settings
    ALTER COLUMN group_size SET NOT NULL,
    ADD CONSTRAINT discipline_settings_group_size_check CHECK (group_size BETWEEN 1 AND 10);

ALTER TABLE discipline_settings DROP COLUMN group_pattern;

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
