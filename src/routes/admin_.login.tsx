import { createFileRoute } from "@tanstack/react-router";
import AdminLogin from "@/pages/AdminLogin";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({
    meta: [{ title: "Staff Sign In — Maedot SACCO" }],
  }),
  component: AdminLogin,
});
