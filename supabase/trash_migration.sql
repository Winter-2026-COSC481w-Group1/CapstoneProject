-- ============================================================
-- TRASH / SOFT-DELETE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Add soft-delete columns
ALTER TABLE user_library
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL DEFAULT NULL;

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL DEFAULT NULL;

-- 2. Enable pg_cron extension (free on all Supabase plans)
--    If it's already enabled this is a no-op.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 3. Schedule the auto-delete job (runs every day at 02:00 UTC)
--    Items that have been in the trash for 30+ days are permanently removed.
SELECT cron.schedule(
  'trash-auto-delete',   -- job name (unique)
  '0 2 * * *',           -- cron expression: daily at 2 AM UTC
  $cron$
  DO $body$
  DECLARE
    orphaned_doc_ids TEXT[];
  BEGIN

    -- Step 1: Delete assessments that expired in trash
    DELETE FROM assessments
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';

    -- Step 2: Collect document IDs that will become fully orphaned
    --         (no active user_library row remains after we delete the expired ones)
    SELECT ARRAY(
      SELECT DISTINCT ul_trash.document_id
      FROM user_library ul_trash
      WHERE ul_trash.deleted_at IS NOT NULL
        AND ul_trash.deleted_at < NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1
          FROM user_library ul_active
          WHERE ul_active.document_id = ul_trash.document_id
            AND ul_active.deleted_at IS NULL
        )
    ) INTO orphaned_doc_ids;

    -- Step 3: Delete expired user_library (trash) entries
    DELETE FROM user_library
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';

    -- Step 4: Delete vector embeddings for now-orphaned documents
    IF orphaned_doc_ids IS NOT NULL AND array_length(orphaned_doc_ids, 1) > 0 THEN
      DELETE FROM vecs.document_chunks
      WHERE (metadata->>'document_id') = ANY(orphaned_doc_ids);
    END IF;

    -- Step 5: Delete the now-orphaned document records
    --         (Storage files become orphaned too; clean them up manually
    --          via the Supabase Storage dashboard if needed.)
    DELETE FROM documents
    WHERE id = ANY(orphaned_doc_ids::uuid[]);

  END;
  $body$;
  $cron$
);

-- ============================================================
-- VERIFY (optional – run these to confirm everything was set up)
-- ============================================================
-- SELECT * FROM cron.job;
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name IN ('user_library', 'assessments')
--   AND column_name = 'deleted_at';
