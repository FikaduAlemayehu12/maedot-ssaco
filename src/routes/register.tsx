import { createFileRoute } from "@tanstack/react-router";
import Register from "@/pages/Register";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Open an Account — Maedot SACCO" },
      { name: "description", content: "Register online for a Maedot SACCO savings, cheque, or mobile wallet account." },
    ],
  }),
  component: Register,
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
});
