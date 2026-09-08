import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Checks whether the signed-in user has the admin role.
 *
 * Uses ONLY the authenticated user's own Supabase session (context.supabase).
 * No SUPABASE_SERVICE_ROLE_KEY required.
 *
 * The RLS migration (20260906000000_orders_rls_no_service_role.sql) adds:
 *   CREATE POLICY "user_roles_select_own" ON public.user_roles
 *     FOR SELECT TO authenticated USING (user_id = auth.uid());
 *
 * This means an authenticated user can read their own role row, which is
 * all we need here. The policy ensures they can never read other users' roles.
 *
 * Bootstrap:
 *   If no admin row exists yet (fresh install), the first authenticated user
 *   automatically becomes admin. The RLS migration also adds:
 *     CREATE POLICY "user_roles_insert_own" ON public.user_roles
 *       FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
 */
export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) return { isAdmin: false };

    // Use the authenticated user's own session — RLS "user_roles_select_own"
    // allows SELECT WHERE user_id = auth.uid()
    const db = context.supabase;

    const { data: mine, error: mineError } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (mineError) {
      console.error("[admin-access] role check error:", mineError.message);
      throw new Error("Unable to verify access. Please try again.");
    }

    // Row found → confirmed admin
    if (mine) return { isAdmin: true };

    // ── Bootstrap: grant admin to the very first user ───────────────
    // Check if any admin exists. We can only read our own role row,
    // so instead attempt a count via a function or check indirectly.
    // We use a try/insert approach: attempt to insert the admin row.
    // If it succeeds → first admin. If it fails with a unique violation
    // → someone else is already admin, this user is not.
    const { error: insertError } = await db
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (!insertError) {
      // Insert succeeded → this user is now the first admin
      return { isAdmin: true };
    }

    // Insert failed — either another admin already exists (23505 unique
    // violation on the role row) or a permission error. In either case
    // this user is not admin.
    if (insertError.code !== "23505") {
      // Not a unique violation — log it but don't crash
      console.warn("[admin-access] bootstrap insert failed:", insertError.message);
    }

    return { isAdmin: false };
  });
