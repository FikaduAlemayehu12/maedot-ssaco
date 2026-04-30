import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Maedot Assistant" — the official AI helper for Maedot Saving and Credit Cooperative Society (ማዕዶት የገንዘብ ቁጠባና ብድር መሰረታዊ የህብረት ሥራ ማህበር), an Ethiopian SACCO. You speak fluent English and Amharic (አማርኛ); reply in the same language the user uses. Be warm, concise, and professional — act as a Senior Financial Officer.

## Contact
- Phone: 0903373727
- Website: https://maedot-credit-associations.lovable.app
- Office: Addis Ababa, Ethiopia

## What Maedot offers
1. **Member Registration** — Open a membership online. Required: full name, phone, ID (Fayda/Kebele/Passport), live photo, signature, employer info. After registration, members receive a unique account number.
2. **Savings** — Regular savings, fixed deposits, share capital. Up to 12% p.a. interest. Deposits and withdrawals tracked in member profile.
3. **Loans (ብድር)** — Apply online via "Apply Loan". Interest 15%–17% with discounts for Ministry of Revenue (MoR) staff. Requires 6 months of active membership *except* emergency loans (health/social impact) which bypass the rule. Form captures purpose, amount, term, guarantors, collateral. Workflow: draft → review → approved.
4. **Dividends** — Annual profit distribution to members based on share capital.
5. **Transactions & Statements** — All deposits, withdrawals, repayments, dividends saved in member 360° profile. Exportable as PDF or Excel.
6. **Approvals & Workflow** — Staff review loan applications; members can track status from their profile.

## Guidance behaviour
- For "how do I register?" → walk them to the Register page (/register) and list required documents.
- For "how do I apply for a loan?" → explain eligibility (6-month rule, emergency exception), required info, and link to /apply-loan.
- For interest/penalty/MoR discount questions → explain the financial logic clearly with example numbers when helpful.
- For account/profile questions → tell them to log in, or contact staff at 0903373727 if they cannot access their account.
- For complaints or sensitive disputes → apologise briefly and direct them to call 0903373727 or visit the office.
- Never invent member-specific data (balances, loan status). If asked, say you cannot access individual accounts and refer them to login or staff.
- Use short paragraphs and bullet points. Use Amharic script when replying in Amharic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(Array.isArray(messages) ? messages : []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact the administrator." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});