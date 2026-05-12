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
    const start = new Date(importStart || "2015-07-01");

    const norm = (s: any) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    const isMonth = (s: string) => /(month|date|ወር|ቀን|ዓመት)/i.test(s);
    const isReceipt = (s: string) => /(receipt|ደረሰኝ|ቁጥር)/i.test(s) && !/account/i.test(s);
    const isSavings = (s: string) => /(saving|deposit|ቁጠባ|መዋጮ|amount)/i.test(s) && !/total|balance|ድምር|ክምችት/i.test(s);
    const isBalance = (s: string) => /(balance|ድምር|total)/i.test(s) && !/interest|ወለድ|accum/i.test(s);
    const isInterest = (s: string) => /(interest|ወለድ)/i.test(s) && !/accum|ክምችት/i.test(s);
    const isAccum = (s: string) => /(accumulat|ክምችት|with interest|ጨምሮ)/i.test(s);

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
      if (!aoa.length) { sheetsFail++; continue; }

      // Find header row by scanning first 15 rows
      let headerIdx = -1;
      let cols: Record<string, number> = {};
      for (let i = 0; i < Math.min(aoa.length, 15); i++) {
        const row = aoa[i].map(norm);
        const c: Record<string, number> = {};
        row.forEach((cell, j) => {
          if (!cell) return;
          if (c.month === undefined && isMonth(cell)) c.month = j;
          else if (c.receipt === undefined && isReceipt(cell)) c.receipt = j;
          else if (c.savings === undefined && isSavings(cell)) c.savings = j;
          else if (c.balance === undefined && isBalance(cell)) c.balance = j;
          else if (c.interest === undefined && isInterest(cell)) c.interest = j;
          else if (c.accum === undefined && isAccum(cell)) c.accum = j;
        });
        if (c.savings !== undefined || c.balance !== undefined) { headerIdx = i; cols = c; break; }
      }
      if (headerIdx < 0) { sheetsFail++; continue; }

      // Member number = sheet name digits, fallback to first numeric-looking cell above header
      const digits = sheetName.match(/\d+/)?.[0] ?? sheetName;
      const member_number = digits.padStart(5, "0");

      // Member full name = look for a cell above header with letters & not a label
      let full_name = "";
      for (let i = 0; i < headerIdx; i++) {
        for (const cell of aoa[i]) {
          const v = String(cell ?? "").trim();
          if (v.length > 2 && /[\p{L}]/u.test(v) && !/(member|name|ስም|number|ቁጥር|month|ወር)/i.test(v)) {
            full_name = v; break;
          }
        }
        if (full_name) break;
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

      // Pull existing txns for dedupe (by note token containing receipt# or by date+amount)
      const { data: existing } = await supabase.from("savings_transactions")
        .select("amount,posted_at,note").eq("account_id", acc.id);
      const seen = new Set((existing ?? []).map(t => `${t.posted_at?.slice(0,10)}|${Number(t.amount)}|${t.note ?? ""}`));

      let running = Number(acc.balance) || 0;
      const inserts: any[] = [];
      let monthIdx = 0;

      for (let i = headerIdx + 1; i < aoa.length; i++) {
        const row = aoa[i];
        if (!row || row.every(c => String(c ?? "").trim() === "")) continue;

        const num = (idx?: number) => {
          if (idx === undefined) return 0;
          const v = String(row[idx] ?? "").replace(/[, ]/g, "");
          const n = Number(v);
          return isFinite(n) ? n : 0;
        };
        const txt = (idx?: number) => idx === undefined ? "" : String(row[idx] ?? "").trim();

        const savings = num(cols.savings);
        const interest = num(cols.interest);
        if (!savings && !interest) continue;

        // Date: parse month cell, else synthesize sequential month from importStart
        let when: Date;
        const rawMonth = txt(cols.month);
        const parsed = rawMonth ? new Date(rawMonth) : null;
        if (parsed && !isNaN(parsed.getTime())) when = parsed;
        else { when = new Date(start); when.setMonth(when.getMonth() + monthIdx); }
        monthIdx++;
        const isoDate = when.toISOString().slice(0, 10);
        const receipt = txt(cols.receipt);
        const note = `History · ${rawMonth || isoDate}${receipt ? ` · receipt ${receipt}` : ""}`;

        if (savings > 0) {
          const key = `${isoDate}|${savings}|${note}`;
          if (!seen.has(key)) {
            running += savings;
            inserts.push({ account_id: acc.id, txn_type: "deposit", amount: savings,
              running_balance: running, note, posted_at: when.toISOString(), reference: receipt || null });
            seen.add(key);
          } else txnsDup++;
        }
        if (interest > 0) {
          const inote = `History interest · ${rawMonth || isoDate}`;
          const key = `${isoDate}|${interest}|${inote}`;
          if (!seen.has(key)) {
            running += interest;
            inserts.push({ account_id: acc.id, txn_type: "interest", amount: interest,
              running_balance: running, note: inote, posted_at: when.toISOString() });
            seen.add(key);
          } else txnsDup++;
        }
      }

      // Batch insert
      if (inserts.length) {
        const { error: ei } = await supabase.from("savings_transactions").insert(inserts);
        if (ei) { sheetsFail++; continue; }
        txnsOk += inserts.length;
      }
      await supabase.from("savings_accounts").update({ balance: running }).eq("id", acc.id);
      sheetsOk++;
    }
    toast({ title: "Smart import complete",
      description: `${sheetsOk} member sheets · ${txnsOk} new txns · ${txnsDup} duplicates skipped · ${sheetsFail} failed` });
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