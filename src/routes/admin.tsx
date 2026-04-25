import { createFileRoute, redirect } from "@tanstack/react-router";
import Admin from "@/pages/Admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Maedot SACCO" }],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/admin/login" });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id);
    const allowed = (roles ?? []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "checker" || r.role === "maker",
    );
    if (!allowed) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
  component: Admin,
});
