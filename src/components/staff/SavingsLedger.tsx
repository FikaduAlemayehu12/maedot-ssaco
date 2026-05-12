import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, FileSpreadsheet, Download, FileText, Upload, Search } from "lucide-react";
import * as XLSX from "xlsx";

type Account = { id: string; account_number: string; member_id: string; product: string; balance: number };
type Member = { id: string; member_number: string; full_name: string };
type Txn = { id: string; account_id: string; txn_type: string; amount: number; running_balance: number | null; note: string | null; posted_at: string };
type Cycle = { id: string; account_id: string; member_id: string; period_start: string; period_end: string; product: string; rate: number; opening_balance: number; gross_interest: number; tax: number; net_interest: number; closing_balance: number; monthly_breakdown: any };

const fmt = (n: number) => new Intl.NumberFormat("en-ET", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

// Default cycle window — Ethiopian 6-month bands as Gregorian dates
const defaultCycle = () => {
  const d = new Date();
  const y = d.getFullYear();
  const inA = d >= new Date(y, 6, 8); // Jul 8+
  const start = inA ? new Date(y, 6, 8) : (d <= new Date(y, 0, 7) ? new Date(y - 1, 6, 8) : new Date(y, 0, 8));
  const end = inA ? new Date(y + 1, 0, 7) : (d <= new Date(y, 0, 7) ? new Date(y, 0, 7) : new Date(y, 6, 7));
  const fmtD = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmtD(start), end: fmtD(end) };
};

export const SavingsLedgerModule = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const cyc = defaultCycle();
  const [periodStart, setPeriodStart] = useState(cyc.start);
  const [periodEnd, setPeriodEnd] = useState(cyc.end);
  const [importStart, setImportStart] = useState("2015-07-01");

  const load = async () => {
    setLoading(true);
    const [m, a, c, t] = await Promise.all([
      supabase.from("members").select("id,member_number,full_name").eq("status", "active").order("member_number"),
      supabase.from("savings_accounts").select("id,account_number,member_id,product,balance").eq("status", "active"),
      supabase.from("savings_cycles").select("*").order("period_start", { ascending: false }),
      supabase.from("savings_transactions").select("id,account_id,txn_type,amount,running_balance,note,posted_at").order("posted_at"),
    ]);
    setMembers((m.data ?? []) as Member[]);
    setAccounts((a.data ?? []) as Account[]);
    setCycles((c.data ?? []) as Cycle[]);
    setTxns((t.data ?? []) as Txn[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => m.full_name.toLowerCase().includes(q) || m.member_number.toLowerCase().includes(q));
  }, [members, search]);

  const memberById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);
  const accountsByMember = useMemo(() => {
    const map = new Map<string, Account[]>();
    accounts.forEach(a => { const arr = map.get(a.member_id) ?? []; arr.push(a); map.set(a.member_id, arr); });
    return map;
  }, [accounts]);
  const txnsByAcc = useMemo(() => {
    const map = new Map<string, Txn[]>();
    txns.forEach(t => { const arr = map.get(t.account_id) ?? []; arr.push(t); map.set(t.account_id, arr); });
    return map;
  }, [txns]);
  const cyclesByAcc = useMemo(() => {
    const map = new Map<string, Cycle[]>();
    cycles.forEach(c => { const arr = map.get(c.account_id) ?? []; arr.push(c); map.set(c.account_id, arr); });
    return map;
  }, [cycles]);

  const runCycle = async () => {
    setRunning(true);
    const { data, error } = await supabase.rpc("run_savings_cycle", { _period_start: periodStart, _period_end: periodEnd });
    setRunning(false);
    if (error) { toast({ title: "Cycle failed", description: error.message, variant: "destructive" }); return; }
    const row = (data as any)?.[0] ?? data;
    toast({ title: "Cycle posted", description: `${row?.processed ?? 0} accounts · net interest ${fmt(Number(row?.total_net ?? 0))} ETB` });
    load();
  };

  // Build per-member ledger rows from raw transactions + cycle records
  const buildLedgerRows = (memberId: string) => {
    const accs = accountsByMember.get(memberId) ?? [];
    const rows: any[] = [];
    accs.forEach(a => {
      const myTxns = (txnsByAcc.get(a.id) ?? []).slice().sort((x, y) => x.posted_at.localeCompare(y.posted_at));
      const myCycles = (cyclesByAcc.get(a.id) ?? []).slice().sort((x, y) => x.period_start.localeCompare(y.period_start));
      rows.push({ section: "header", label: `${a.product === "voluntary" ? "የፍላጎት ቁጠባ" : "መደበኛ ቁጠባ"} · ${a.account_number}` });
      myTxns.forEach(t => rows.push({
        section: "txn", date: t.posted_at.slice(0, 10), type: t.txn_type,
        debit: t.txn_type === "withdrawal" ? Number(t.amount) : 0,
        credit: t.txn_type !== "withdrawal" ? Number(t.amount) : 0,
        balance: Number(t.running_balance ?? 0), note: t.note ?? "",
      }));
      myCycles.forEach(c => {
        rows.push({ section: "cycle", label: `${c.period_start} → ${c.period_end} · gross ${fmt(c.gross_interest)} · tax ${fmt(c.tax)} · net ${fmt(c.net_interest)} · closing ${fmt(c.closing_balance)}` });
        (c.monthly_breakdown ?? []).forEach((b: any) => rows.push({
          section: "monthly", date: b.month_end, balance: Number(b.balance), monthly_interest: Number(b.monthly_interest),
        }));
      });
    });
    return rows;
  };

  const exportMemberXlsx = (memberId: string) => {
    const m = memberById.get(memberId)!;
    const wb = XLSX.utils.book_new();
    const rows = buildLedgerRows(memberId);
    const flat = [
      [`${m.full_name}`, `${m.member_number}`],
      ["Date", "Type", "Debit", "Credit", "Balance", "Monthly Interest", "Note"],
      ...rows.map(r => r.section === "header" || r.section === "cycle"
        ? [r.label, "", "", "", "", "", ""]
        : r.section === "monthly"
        ? [r.date, "monthly interest", "", "", fmt(r.balance), fmt(r.monthly_interest), ""]
        : [r.date, r.type, fmt(r.debit), fmt(r.credit), fmt(r.balance), "", r.note]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flat), m.member_number);
    XLSX.writeFile(wb, `ledger_${m.member_number}.xlsx`);
  };

  const exportAllXlsx = (perSheet: boolean) => {
    const wb = XLSX.utils.book_new();
    if (perSheet) {
      members.forEach(m => {
        const rows = buildLedgerRows(m.id);
        if (!rows.length) return;
        const flat = [
          [m.full_name, m.member_number],
          ["Date", "Type", "Debit", "Credit", "Balance", "Monthly Interest", "Note"],
          ...rows.map(r => r.section === "header" || r.section === "cycle"
            ? [r.label, "", "", "", "", "", ""]
            : r.section === "monthly"
            ? [r.date, "monthly interest", "", "", fmt(r.balance), fmt(r.monthly_interest), ""]
            : [r.date, r.type, fmt(r.debit), fmt(r.credit), fmt(r.balance), "", r.note]),
        ];
        const safe = (m.member_number || m.full_name).slice(0, 28).replace(/[\\\/\?\*\[\]]/g, "_");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flat), safe);
      });
    } else {
      const flat: any[][] = [["Member", "Account", "Date", "Type", "Debit", "Credit", "Balance", "Note"]];
      members.forEach(m => {
        const accs = accountsByMember.get(m.id) ?? [];
        accs.forEach(a => {
          (txnsByAcc.get(a.id) ?? []).forEach(t => flat.push([
            `${m.member_number} ${m.full_name}`, a.account_number, t.posted_at.slice(0, 10), t.txn_type,
            t.txn_type === "withdrawal" ? fmt(Number(t.amount)) : "",
            t.txn_type !== "withdrawal" ? fmt(Number(t.amount)) : "",
            fmt(Number(t.running_balance ?? 0)), t.note ?? "",
          ]));
        });
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(flat), "All members");
    }
    XLSX.writeFile(wb, `maedot_ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportAllCsv = () => {
    const lines = ["Member,Account,Date,Type,Debit,Credit,Balance,Note"];
    members.forEach(m => {
      const accs = accountsByMember.get(m.id) ?? [];
      accs.forEach(a => {
        (txnsByAcc.get(a.id) ?? []).forEach(t => lines.push([
          `${m.member_number} ${m.full_name}`, a.account_number, t.posted_at.slice(0, 10), t.txn_type,
          t.txn_type === "withdrawal" ? Number(t.amount) : "",
          t.txn_type !== "withdrawal" ? Number(t.amount) : "",
          Number(t.running_balance ?? 0), JSON.stringify(t.note ?? ""),
        ].join(",")));
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `maedot_ledger_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => window.print();

  // ---------- Bulk upload ----------
  const onUploadRoster = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    let ok = 0, fail = 0;
    for (const r of rows) {
      const member_number = String(r.member_number || r["Member #"] || r["No"] || "").trim();
      const full_name = String(r.full_name || r["Name"] || r["Full Name"] || "").trim();
      if (!member_number || !full_name) { fail++; continue; }
      const opening = Number(r.opening_balance || r["Opening"] || 0);
      const product = String(r.product || "regular").toLowerCase();
      const { data: m, error: e1 } = await supabase.from("members").upsert({
        member_number, full_name,
        phone: r.phone || null, gender: r.gender || null,
        date_of_birth: r.date_of_birth || null, status: "active",
      }, { onConflict: "member_number" }).select().single();
      if (e1 || !m) { fail++; continue; }
      const account_number = String(r.account_number || `SA-${member_number}`);
      const { data: acc, error: e2 } = await supabase.from("savings_accounts").upsert({
        member_id: m.id, account_number, product, balance: opening, status: "active",
      }, { onConflict: "account_number" }).select().single();
      if (e2 || !acc) { fail++; continue; }
      if (opening > 0) {
        await supabase.from("savings_transactions").insert({
          account_id: acc.id, txn_type: "deposit", amount: opening, running_balance: opening,
          note: "Opening balance import", posted_at: r.opened_at || new Date().toISOString(),
        });
      }
      ok++;
    }
    toast({ title: "Roster imported", description: `${ok} ok · ${fail} skipped` });
    load();
  };

  const onUploadHistorical = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    let ok = 0, fail = 0;
    for (const sheetName of wb.SheetNames) {
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      for (const r of rows) {
        const member_number = String(r.member_number || sheetName).trim();
        const { data: m } = await supabase.from("members").select("id").eq("member_number", member_number).maybeSingle();
        if (!m) { fail++; continue; }
        const { data: acc } = await supabase.from("savings_accounts").select("id,balance").eq("member_id", m.id).limit(1).maybeSingle();
        if (!acc) { fail++; continue; }
        const amount = Number(r.amount || r["Deposit"] || 0);
        if (!amount) { fail++; continue; }
        const newBal = Number(acc.balance) + amount;
        const { error } = await supabase.from("savings_transactions").insert({
          account_id: acc.id, txn_type: r.type || "deposit", amount, running_balance: newBal,
          note: r.note || `Historical import ${sheetName}`, posted_at: r.date || new Date().toISOString(),
        });
        if (error) { fail++; continue; }
        await supabase.from("savings_accounts").update({ balance: newBal }).eq("id", acc.id);
        ok++;
      }
    }
    toast({ title: "History imported", description: `${ok} txns · ${fail} skipped` });
    load();
  };

  // ---------- Smart per-member history importer ----------
  // Each sheet = one member. Sheet name should be the membership number (e.g. "00001").
  // Auto-detects header row + columns (month, receipt#, savings amount, balance,
  // interest, accumulated balance with interest) in English or Amharic, persists
  // every row as a savings_transaction (deduped by receipt # / date+amount), and
  // upserts the member + savings account so nothing is lost.
  const onUploadSmartHistory = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { cellDates: true });
    let sheetsOk = 0, sheetsFail = 0, txnsOk = 0, txnsDup = 0;
    let cyclesOk = 0;

    // Ethiopian month → (gregorian year offset, gregorian month, day)
    const ETH: Record<string, [number, number, number]> = {
      "መስከረም":[7,9,11], "ጥቅምት":[7,10,11], "ህዳር":[7,11,10], "ሕዳር":[7,11,10],
      "ታህሳስ":[7,12,10], "ታኅሳስ":[7,12,10],
      "ጥር":[8,1,9], "የካቲት":[8,2,8], "መጋቢት":[8,3,10],
      "ሚያዚያ":[8,4,9], "ሚያዝያ":[8,4,9], "ግንቦት":[8,5,9],
      "ሰኔ":[8,6,8], "ሃመሌ":[8,7,8], "ሐምሌ":[8,7,8], "ሓምሌ":[8,7,8],
      "ነሀሴ":[8,8,7], "ነሐሴ":[8,8,7], "ጳጉሜን":[8,9,6],
    };
    const parseEth = (s: string): { date: string; year: number; midx: number } | null => {
      if (!s) return null;
      const m = String(s).match(/([\u1200-\u137F]+)\s*(\d{4})/);
      if (!m) return null;
      const name = m[1].trim();
      const yr = parseInt(m[2], 10);
      const g = ETH[name];
      if (!g) return null;
      const [yo, gm, gd] = g;
      const midx = Object.keys(ETH).indexOf(name); // not used
      const d = new Date(Date.UTC(yr + yo, gm - 1, gd));
      return { date: d.toISOString().slice(0, 10), year: yr, midx };
    };
    const cycleWindow = (yr: number, span: number): { ps: string; pe: string; label: string } => {
      // span 6 = ሐምሌ–ታህሳስ; span 12 (12-month report) ends in ሰኔ of year yr
      if (span === 6) {
        const ps = new Date(Date.UTC(yr - 1 + 8, 6, 8)).toISOString().slice(0,10);
        const pe = new Date(Date.UTC(yr - 1 + 7, 11, 10)).toISOString().slice(0,10);
        return { ps, pe, label: `ሐምሌ ${yr-1} – ታህሳስ ${yr-1}` };
      }
      const ps = new Date(Date.UTC(yr + 8, 0, 9)).toISOString().slice(0,10);
      const pe = new Date(Date.UTC(yr + 8, 5, 8)).toISOString().slice(0,10);
      return { ps, pe, label: `ጥር ${yr} – ሰኔ ${yr}` };
    };

    for (const sheetName of wb.SheetNames) {
      // Skip non-numeric sheets (e.g. "jun 2017" roster/index sheets)
      if (!/^\d{4,7}$/.test(sheetName)) continue;
      const ws = wb.Sheets[sheetName];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
      if (!aoa.length) { sheetsFail++; continue; }

      const member_number = sheetName.replace(/^0+/, "").padStart(5, "0");
      // Member full name = first non-empty cell of row 0 that contains Amharic/Latin letters
      let full_name = "";
      for (const cell of aoa[0] || []) {
        const v = String(cell ?? "").trim();
        if (v.length > 2 && /[\p{L}]/u.test(v) && !/(ወር|ቁጥር|ብር|ወለድ|month|name)/i.test(v)) {
          full_name = v; break;
        }
      }
      if (!full_name) full_name = `Member ${member_number}`;

      // Upsert member + savings account
      const { data: m, error: em } = await supabase.from("members").upsert(
        { member_number, full_name, status: "active" },
        { onConflict: "member_number" }
      ).select().single();
      if (em || !m) { sheetsFail++; continue; }

      const account_number = `SA-${member_number}`;
      let { data: acc } = await supabase.from("savings_accounts").select("id,balance").eq("account_number", account_number).maybeSingle();
      if (!acc) {
        const { data: created, error: ec } = await supabase.from("savings_accounts").upsert(
          { member_id: m.id, account_number, product: "regular", balance: 0, status: "active" },
          { onConflict: "account_number" }
        ).select().single();
        if (ec || !created) { sheetsFail++; continue; }
        acc = created;
      }

      // Existing transactions for dedupe
      const { data: existing } = await supabase.from("savings_transactions")
        .select("amount,posted_at,txn_type").eq("account_id", acc.id);
      const seen = new Set((existing ?? []).map(t => `${t.posted_at?.slice(0,10)}|${Number(t.amount)}|${t.txn_type}`));
      const { data: existingCycles } = await supabase.from("savings_cycles")
        .select("period_start").eq("account_id", acc.id);
      const cseen = new Set((existingCycles ?? []).map(c => c.period_start));

      type Event = { date: string; type: "deposit" | "interest"; amount: number; receipt?: string | null; note: string };
      const events: Event[] = [];
      const cycleRows: any[] = [];
      let pendingGross: { yr: number; span: number; gross: number } | null = null;
      let pendingTax: number | null = null;
      let openBal = Number(acc.balance) || 0;

      for (let i = 1; i < aoa.length; i++) {
        const row = aoa[i] || [];
        const c0 = row[0], c1 = row[1], c2 = row[2], c3 = row[3], c4 = row[4], c5 = row[5], c6 = row[6];
        const s1 = String(c1 ?? "").trim();
        const s3 = String(c3 ?? "").trim();
        const numC1 = Number(c1);

        // Year header row
        if (!s1.match(/[^\d]/) && numC1 > 2000 && numC1 < 2030 && !c2 && !c3) continue;

        // Cycle gross row
        const gMatch = s3.match(/የ\s*(\d{4})\s*የ\s*(\d+)\s*ወር\s*ወለድ/);
        if (gMatch && typeof c5 === "number") {
          pendingGross = { yr: parseInt(gMatch[1], 10), span: parseInt(gMatch[2], 10), gross: Number(c5) };
          continue;
        }
        if (s3.toLowerCase() === "tax" && typeof c4 === "number") { pendingTax = Number(c4); continue; }

        // Cycle close summary
        if (String(c0 ?? "").includes("አጠቃላይ") && typeof c6 === "number" && pendingGross) {
          const closing = Number(c6);
          const { yr, span, gross } = pendingGross;
          const tax = pendingTax ?? +(gross * 0.05).toFixed(4);
          const net = +(gross - tax).toFixed(4);
          const { ps, pe, label } = cycleWindow(yr, span);
          events.push({ date: pe, type: "interest", amount: net, note: `Cycle interest ${label} (gross ${gross.toFixed(2)}, tax ${tax.toFixed(2)})` });
          if (!cseen.has(ps)) {
            cycleRows.push({
              account_id: acc.id, member_id: m.id, period_start: ps, period_end: pe,
              product: "regular", rate: 0.07, opening_balance: openBal,
              gross_interest: gross, tax, net_interest: net,
              closing_balance: closing, monthly_breakdown: [],
            });
            cseen.add(ps);
          }
          openBal = closing;
          pendingGross = null; pendingTax = null;
          continue;
        }

        // Deposit row
        const parsed = parseEth(s1);
        if (parsed) {
          const amount = typeof c3 === "number" ? Number(c3) : Number(String(c3 ?? "").replace(/[, ]/g,"")) || 0;
          if (amount > 0) {
            const receipt = c2 != null && c2 !== "" ? String(c2) : null;
            events.push({ date: parsed.date, type: "deposit", amount, receipt, note: s1 });
          }
        }
      }

      events.sort((a, b) => a.date.localeCompare(b.date));
      let running = Number(acc.balance) || 0;
      const inserts: any[] = [];
      for (const ev of events) {
        const key = `${ev.date}|${ev.amount}|${ev.type}`;
        if (seen.has(key)) { txnsDup++; continue; }
        seen.add(key);
        running = +(running + ev.amount).toFixed(4);
        inserts.push({
          account_id: acc.id, txn_type: ev.type, amount: ev.amount,
          running_balance: running, note: ev.note,
          posted_at: new Date(ev.date + "T12:00:00Z").toISOString(),
          reference: ev.receipt ?? null,
        });
      }
      if (inserts.length) {
        const { error: ei } = await supabase.from("savings_transactions").insert(inserts);
        if (ei) { sheetsFail++; continue; }
        txnsOk += inserts.length;
      }
      if (cycleRows.length) {
        const { error: ec2 } = await supabase.from("savings_cycles").insert(cycleRows);
        if (!ec2) cyclesOk += cycleRows.length;
      }
      await supabase.from("savings_accounts").update({ balance: running, updated_at: new Date().toISOString() }).eq("id", acc.id);
      sheetsOk++;
    }
    toast({ title: "Smart import complete",
      description: `${sheetsOk} members · ${txnsOk} txns · ${cyclesOk} cycles · ${txnsDup} duplicates · ${sheetsFail} failed` });
    load();
  };

  if (loading) return <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4" id="ledger-print">
      <style>{`@media print { body * { visibility: hidden !important; } #ledger-print, #ledger-print * { visibility: visible !important; } #ledger-print { position: absolute; left: 0; top: 0; width: 100%; padding: 12px; } .no-print { display:none !important; } .member-page { page-break-after: always; } }`}</style>

      <div className="bg-card border rounded-2xl p-4 space-y-3 no-print shadow-card-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Cycle start</Label>
            <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Cycle end</Label>
            <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="h-9" />
          </div>
          <Button onClick={runCycle} disabled={running} variant="hero" size="sm">
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Post 6-month interest cycle
          </Button>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => exportAllXlsx(true)}><FileSpreadsheet className="size-4" /> Excel · per-member sheets</Button>
            <Button size="sm" variant="outline" onClick={() => exportAllXlsx(false)}><FileSpreadsheet className="size-4" /> Excel · single sheet</Button>
            <Button size="sm" variant="outline" onClick={exportAllCsv}><Download className="size-4" /> CSV</Button>
            <Button size="sm" variant="outline" onClick={printPdf}><FileText className="size-4" /> PDF</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end pt-2 border-t">
          <UploadField label="Bulk upload · roster (XLSX)" onFile={onUploadRoster}
            hint="Columns: member_number, full_name, phone, account_number, product (regular|voluntary), opening_balance" />
          <UploadField label="Bulk upload · historical ledger (XLSX)" onFile={onUploadHistorical}
            hint="One sheet per member (sheet name = member_number) with rows: date, type, amount, note" />
          <div className="flex flex-col gap-1 min-w-[160px]">
            <Label className="text-xs">History start (synthesized dates)</Label>
            <Input type="date" value={importStart} onChange={e => setImportStart(e.target.value)} className="h-9" />
          </div>
          <UploadField label="Smart history · per-member sheets (XLSX)" onFile={onUploadSmartHistory}
            hint="Auto-detects month/receipt/savings/balance/interest/accumulated columns. Sheet name = membership # (e.g. 00001). Auto-creates members + accounts, dedupes, preserves all history." />
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-4">
        <div className="bg-card border rounded-2xl p-3 space-y-2 no-print shadow-card-soft max-h-[70vh] overflow-y-auto">
          <div className="relative">
            <Search className="size-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          {filteredMembers.map(m => (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`w-full text-left rounded-md px-3 py-2 text-sm transition ${selected === m.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <div className="font-mono text-xs opacity-70">{m.member_number}</div>
              <div className="font-medium truncate">{m.full_name}</div>
            </button>
          ))}
          {filteredMembers.length === 0 && <div className="text-xs text-muted-foreground p-4 text-center">No members yet — use bulk upload above.</div>}
        </div>

        <div className="space-y-4">
          {selected ? (
            <MemberLedger member={memberById.get(selected)!}
              accounts={accountsByMember.get(selected) ?? []}
              txnsByAcc={txnsByAcc} cyclesByAcc={cyclesByAcc}
              onExport={() => exportMemberXlsx(selected)} />
          ) : (
            <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground shadow-card-soft">
              Select a member to view their full credit/debit history and 6-month interest cycles.
            </div>
          )}

          {/* Hidden printable: all members one-per-page */}
          <div className="hidden print:block">
            {members.map(m => (
              <div key={m.id} className="member-page">
                <MemberLedger member={m}
                  accounts={accountsByMember.get(m.id) ?? []}
                  txnsByAcc={txnsByAcc} cyclesByAcc={cyclesByAcc} onExport={() => {}} compact />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadField = ({ label, onFile, hint }: { label: string; onFile: (f: File) => void; hint?: string }) => (
  <label className="flex-1 min-w-[260px] cursor-pointer rounded-md border border-dashed p-3 hover:bg-muted/50">
    <div className="text-xs font-semibold flex items-center gap-2"><Upload className="size-3.5" /> {label}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
      onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
  </label>
);

const MemberLedger = ({ member, accounts, txnsByAcc, cyclesByAcc, onExport, compact }: {
  member: Member; accounts: Account[];
  txnsByAcc: Map<string, Txn[]>; cyclesByAcc: Map<string, Cycle[]>;
  onExport: () => void; compact?: boolean;
}) => {
  return (
    <div className="bg-card border rounded-2xl shadow-card-soft overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 to-transparent">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">የአባል ሪፖርት · Member Ledger</div>
          <div className="text-lg font-bold">{member.full_name}</div>
          <div className="font-mono text-xs text-primary">{member.member_number}</div>
        </div>
        {!compact && <Button size="sm" variant="outline" onClick={onExport}><FileSpreadsheet className="size-4" /> Export Excel</Button>}
      </div>
      <div className="p-4 space-y-4">
        {accounts.map(a => {
          const myTxns = (txnsByAcc.get(a.id) ?? []).slice().sort((x, y) => x.posted_at.localeCompare(y.posted_at));
          const myCycles = (cyclesByAcc.get(a.id) ?? []).slice().sort((x, y) => x.period_start.localeCompare(y.period_start));
          return (
            <div key={a.id} className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 text-sm font-semibold flex items-center justify-between">
                <span>{a.product === "voluntary" ? "የፍላጎት ቁጠባ" : "መደበኛ ቁጠባ"} · {a.account_number}</span>
                <span className="font-mono">Balance: {fmt(Number(a.balance))} ETB</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/20 text-muted-foreground uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-right px-3 py-2">Debit</th>
                      <th className="text-right px-3 py-2">Credit</th>
                      <th className="text-right px-3 py-2">Balance</th>
                      <th className="text-left px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myTxns.map(t => (
                      <tr key={t.id}>
                        <td className="px-3 py-1.5 font-mono">{t.posted_at.slice(0, 10)}</td>
                        <td className="px-3 py-1.5">{t.txn_type}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-destructive">{t.txn_type === "withdrawal" ? fmt(Number(t.amount)) : ""}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-emerald-700">{t.txn_type !== "withdrawal" ? fmt(Number(t.amount)) : ""}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fmt(Number(t.running_balance ?? 0))}</td>
                        <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[200px]">{t.note}</td>
                      </tr>
                    ))}
                    {myTxns.length === 0 && <tr><td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
              {myCycles.map(c => (
                <div key={c.id} className="border-t bg-emerald-50/40 px-3 py-2">
                  <div className="text-xs font-semibold mb-1">
                    Cycle {c.period_start} → {c.period_end} · rate {(Number(c.rate) * 100).toFixed(1)}%
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                    <div>Opening: {fmt(c.opening_balance)}</div>
                    <div>Gross: {fmt(c.gross_interest)}</div>
                    <div className="text-destructive">Tax (5%): {fmt(c.tax)}</div>
                    <div className="text-emerald-700 font-bold">Net: {fmt(c.net_interest)}</div>
                    <div>Closing: {fmt(c.closing_balance)}</div>
                  </div>
                  {Array.isArray(c.monthly_breakdown) && c.monthly_breakdown.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-[11px] cursor-pointer text-muted-foreground">Monthly breakdown</summary>
                      <table className="w-full text-[11px] mt-1">
                        <thead><tr className="text-muted-foreground"><th className="text-left">Month end</th><th className="text-right">Balance</th><th className="text-right">Monthly interest</th></tr></thead>
                        <tbody>
                          {c.monthly_breakdown.map((b: any, i: number) => (
                            <tr key={i}><td className="font-mono">{b.month_end}</td><td className="text-right font-mono">{fmt(Number(b.balance))}</td><td className="text-right font-mono">{fmt(Number(b.monthly_interest))}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {accounts.length === 0 && <div className="text-sm text-muted-foreground text-center p-6">No savings accounts for this member.</div>}
      </div>
    </div>
  );
};