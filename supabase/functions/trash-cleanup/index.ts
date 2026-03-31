import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This Edge Function runs daily to delete storage files for documents
// that have been in the trash for 30+ days.
// It is called by the pg_cron job via pg_net.

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find user_library rows that are trashed 30+ days ago
    // and have no active user still referencing the same document
    const { data: expiredRows, error: fetchError } = await supabase
      .from("user_library")
      .select("document_id, documents(file_path)")
      .not("deleted_at", "is", null)
      .lt("deleted_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error("Error fetching expired rows:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!expiredRows || expiredRows.length === 0) {
      return new Response(JSON.stringify({ message: "No expired items to clean up." }), { status: 200 });
    }

    // For each expired document, check if any OTHER active user still references it
    const filesToDelete: string[] = [];

    for (const row of expiredRows) {
      const docId = row.document_id;

      // Check if any active (non-trashed) user_library row still exists for this doc
      const { data: activeLinks } = await supabase
        .from("user_library")
        .select("document_id")
        .eq("document_id", docId)
        .is("deleted_at", null);

      // If no active users reference this document, safe to delete storage file
      if (!activeLinks || activeLinks.length === 0) {
        const filePath = (row as any).documents?.file_path;
        if (filePath) {
          filesToDelete.push(filePath);
        }
      }
    }

    // Delete all orphaned storage files in one batch call
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("pdfs")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        return new Response(JSON.stringify({ error: storageError.message }), { status: 500 });
      }

      console.log(`Deleted ${filesToDelete.length} storage files:`, filesToDelete);
    }

    return new Response(
      JSON.stringify({
        message: `Storage cleanup complete. Deleted ${filesToDelete.length} file(s).`,
        deleted: filesToDelete,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
