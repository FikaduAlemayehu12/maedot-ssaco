import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maedot SACCO — Transforming Together" },
      { name: "description", content: "Maedot Saving and Credit Cooperative Society — Open an account, save, and borrow with Ethiopia's premium SACCO." },
      { property: "og:title", content: "Maedot SACCO — Transforming Together" },
      { property: "og:description", content: "Open an account, save, and borrow with Maedot SACCO." },
    ],
  }),
  component: Index,
});
