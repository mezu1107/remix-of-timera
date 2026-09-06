import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns true when the signed-in user has the admin role.
 *
 * Uses the SERVICE ROLE client (supabaseAdmin) to bypass Row Level Security.
 * This is safe because this function runs server-side only — the browser never
 * has direct access to supabaseAdmin.
 *
 * Previous bug: the anon/user client was used to query user_roles. RLS on that
 * table blocked the read for users whose role row existed but couldn't be
 * read back through their own JWT — returning isAdmin: false incorrectly.
 *
 * Bootstrap: if no admin row exists yet, the first authenticated caller
 * automatically becomes admin (owner setup flow).
 */
export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    if (!userId) return { isAdmin: false };

    // Always use supabaseAdmin so RLS never blocks the role lookup
    const { data: mine, error: mineError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (mineError) {
      console.error("[admin-access] role check error:", mineError.message);
      throw new Error("Unable to verify access");
    }

    // Row exists → confirmed admin
    if (mine) return { isAdmin: true };

    // No admin row for this user — check if any admin exists at all
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);

    if (existingError) {
      console.error("[admin-access] admin count error:", existingError.message);
      throw new Error("Unable to verify access");
    }

    // Bootstrap: no admins exist yet → grant admin to the first caller
    if ((existing ?? []).length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (insertError) {
        console.error("[admin-access] bootstrap insert error:", insertError.message);
        throw new Error("Unable to verify access");
      }
      return { isAdmin: true };
    }

    // An admin already exists and it's not this user
    return { isAdmin: false };
  });
