import { createFileRoute } from "@tanstack/react-router";
import ApplyLoan from "@/pages/ApplyLoan";

export const Route = createFileRoute("/apply-loan")({
  head: () => ({
    meta: [
      { title: "Apply for a Loan — Maedot SACCO" },
      { name: "description", content: "Apply online for a Maedot SACCO loan with auto-calculated rates and Amharic application form." },
      { property: "og:title", content: "Apply for a Loan — Maedot SACCO" },
      { property: "og:description", content: "Verify your membership and submit a loan application online." },
    ],
  }),
  component: ApplyLoan,
});