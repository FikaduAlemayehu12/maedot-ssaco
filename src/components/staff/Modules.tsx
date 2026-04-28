import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Users, Wallet, HandCoins, BookOpen, Search,
  TrendingUp, TrendingDown, CircleDollarSign,
  Upload, ShieldCheck, Calculator, FileText, Receipt, Calendar, Percent,
} from "lucide-react";

/* ---------------- Shared UI ---------------- */

export const ModuleStat = ({
  label, value, icon, tone = "primary",
}: {
  label: string; value: string | number; icon: React.ReactNode;
  tone?: "primary" | "success" | "destructive" | "dark";
}) => {
  const tones = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    destructive: "from-destructive/10 to-destructive/5 text-destructive",
    dark: "from-secondary/10 to-secondary/5 text-secondary",
  };
  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-card-soft">
      <div className={`size-9 sm:size-10 rounded-xl grid place-items-center bg-gradient-to-br ${tones[tone]} mb-2`}>{icon}</div>
      <div className="text-2xl sm:text-3xl font-display font-bold">{value}</div>
      <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------- DASHBOARD ---------------- */

export const DashboardModule = () => {
  const [stats, setStats] = useState({
    members: 0, savings: 0, loansActive: 0, loansOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, s, l] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("savings_accounts").select("balance"),
        supabase.from("loans").select("status, outstanding_balance"),
      ]);
      const savings = (s.data ?? []).reduce((a: number, r: any) => a + Number(r.balance || 0), 0);
      const loans = l.data ?? [];
      setStats({
        members: m.count ?? 0,
        savings,
        loansActive: loans.filter((r: any) => r.status === "active").length,
        loansOutstanding: loans.reduce((a: number, r: any) => a + Number(r.outstanding_balance || 0), 0),
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <ModuleStat label="Members" value={stats.members.toLocaleString()} icon={<Users className="size-5" />} tone="primary" />
      <ModuleStat label="Total Savings (ETB)" value={fmt(stats.savings)} icon={<Wallet className="size-5" />} tone="success" />
      <ModuleStat label="Active Loans" value={stats.loansActive.toLocaleString()} icon={<HandCoins className="size-5" />} tone="dark" />
      <ModuleStat label="Loan Outstanding (ETB)" value={fmt(stats.loansOutstanding)} icon={<CircleDollarSign className="size-5" />} tone="destructive" />
    </div>
  );
};

/* ---------------- MEMBERS ---------------- */

type Member = {
  id: string; member_number: string; full_name: string;
  phone: string | null; email: string | null; region: string | null;
  status: string; created_at: string;
};

export const MembersModule = () => {
  const [rows, setRows] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", region: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false }).limit(500);
    setLoading(false);
    if (error) { toast({ title: "Failed to load members", description: error.message, variant: "destructive" }); return; }
    setRows((data ?? []) as Member[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.full_name) return toast({ title: "Name required", variant: "destructive" });
    setBusy(true);
    const member_number = "MBR-" + Date.now().toString().slice(-8);
    const { error } = await supabase.from("members").insert({ ...form, member_number });
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Member created", description: member_number });
    setForm({ full_name: "", phone: "", email: "", region: "" });
    setShowForm(false);
    load();
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      [r.full_name, r.member_number, r.phone, r.email, r.region].join(" ").toLowerCase().includes(term)
    );
  }, [rows, q]);

  return (
    <div className="bg-card rounded-2xl border shadow-card-soft">
      <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm font-semibold">Members ({rows.length})</div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members..." className="pl-9" />
          </div>
          <Button size="sm" variant="hero" onClick={() => setShowForm(s => !s)}><Plus className="size-4" /> Add</Button>
        </div>
      </div>
      {showForm && (
        <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">Full name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="text-xs">Region</Label><Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" variant="hero" onClick={create} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No members yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-4 py-3">Member #</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 hidden lg:table-cell">Region</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.member_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{r.phone}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{r.region}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="border-emerald-500/30 text-emerald-700">{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ---------------- SAVINGS ---------------- */

type SavingsAccount = {
  id: string; account_number: string; member_id: string;
  product: string; balance: number; interest_rate: number; status: string;
};

export const SavingsModule = () => {
  const [rows, setRows] = useState<SavingsAccount[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accruing, setAccruing] = useState(false);
  const [form, setForm] = useState({ member_id: "", product: "regular", interest_rate: "5" });

  const load = async () => {
    setLoading(true);
    const [a, m] = await Promise.all([
      supabase.from("savings_accounts").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("members").select("id,member_number,full_name,phone,email,region,status,created_at").limit(500),
    ]);
    setLoading(false);
    if (a.error) toast({ title: a.error.message, variant: "destructive" });
    setRows((a.data ?? []) as SavingsAccount[]);
    setMembers((m.data ?? []) as Member[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.member_id) return toast({ title: "Select member", variant: "destructive" });
    setBusy(true);
    const account_number = "SAV-" + Date.now().toString().slice(-8);
    const { error } = await supabase.from("savings_accounts").insert({
      member_id: form.member_id,
      account_number,
      product: form.product,
      interest_rate: Number(form.interest_rate) || 0,
    });
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Account opened", description: account_number });
    setShowForm(false);
    load();
  };

  const post = async (account: SavingsAccount, type: "deposit" | "withdrawal") => {
    const raw = prompt(`${type === "deposit" ? "Deposit" : "Withdraw"} amount (ETB):`);
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return toast({ title: "Invalid amount", variant: "destructive" });
    const newBal = type === "deposit" ? Number(account.balance) + amount : Number(account.balance) - amount;
    if (newBal < 0) return toast({ title: "Insufficient balance", variant: "destructive" });
    const { error: e1 } = await supabase.from("savings_transactions").insert({
      account_id: account.id, txn_type: type, amount, running_balance: newBal,
    });
    if (e1) return toast({ title: e1.message, variant: "destructive" });
    const { error: e2 } = await supabase.from("savings_accounts").update({ balance: newBal }).eq("id", account.id);
    if (e2) return toast({ title: e2.message, variant: "destructive" });
    toast({ title: `${type} posted`, description: `New balance: ${fmt(newBal)} ETB` });
    load();
  };

  const memberOf = (id: string) => members.find(m => m.id === id);

  const runAccrual = async () => {
    const period = prompt("Accrual period (YYYY-MM-01). Leave blank for current month.", "")?.trim();
    setAccruing(true);
    const { data, error } = await supabase.rpc("accrue_monthly_savings_interest", period ? { _period: period } : {});
    setAccruing(false);
    if (error) return toast({ title: "Accrual failed", description: error.message, variant: "destructive" });
    const r = Array.isArray(data) ? data[0] : data;
    toast({ title: "Monthly interest posted", description: `${r?.accounts_processed ?? 0} accounts · net ${fmt(Number(r?.total_net_interest ?? 0))} ETB` });
    load();
  };

  return (
    <div className="bg-card rounded-2xl border shadow-card-soft">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">Savings Accounts ({rows.length})</div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runAccrual} disabled={accruing} title="Post monthly interest at 7%/yr (5% tax)">
            {accruing ? <Loader2 className="size-4 animate-spin" /> : <Percent className="size-4" />} Run Monthly Accrual
          </Button>
          <Button size="sm" variant="hero" onClick={() => setShowForm(s => !s)}><Plus className="size-4" /> New Account</Button>
        </div>
      </div>
      {showForm && (
        <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Member</Label>
            <Select value={form.member_id} onValueChange={v => setForm({ ...form, member_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.member_number} — {m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Product</Label>
            <Select value={form.product} onValueChange={v => setForm({ ...form, product: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="fixed">Fixed Deposit</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Interest %</Label><Input type="number" step="0.1" value={form.interest_rate} onChange={e => setForm({ ...form, interest_rate: e.target.value })} /></div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" variant="hero" onClick={create} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Open</Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No savings accounts.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-4 py-3">Account #</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Balance (ETB)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(r => {
                const m = memberOf(r.member_id);
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.account_number}</td>
                    <td className="px-4 py-3">{m ? `${m.member_number} — ${m.full_name}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 capitalize">{r.product}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(r.balance)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="hero" onClick={() => post(r, "deposit")}><TrendingUp className="size-4" /> Deposit</Button>
                        <Button size="sm" variant="outline" onClick={() => post(r, "withdrawal")}><TrendingDown className="size-4" /> Withdraw</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ---------------- LOANS ---------------- */

type Loan = {
  id: string; loan_number: string; member_id: string;
  principal: number; interest_rate: number; term_months: number;
  status: string; outstanding_balance: number; created_at: string;
};

export const LoansModule = () => {
  const [rows, setRows] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ member_id: "", principal: "", interest_rate: "12", term_months: "12", purpose: "" });
  const [maxEligible, setMaxEligible] = useState<number | null>(null);
  const [feePreview, setFeePreview] = useState<{ service: number; insurance: number; total: number; net: number } | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [l, m] = await Promise.all([
      supabase.from("loans").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("members").select("id,member_number,full_name,phone,email,region,status,created_at").limit(500),
    ]);
    setLoading(false);
    if (l.error) toast({ title: l.error.message, variant: "destructive" });
    setRows((l.data ?? []) as Loan[]);
    setMembers((m.data ?? []) as Member[]);
  };
  useEffect(() => { load(); }, []);

  // Recompute eligibility & rate when member or term changes
  useEffect(() => {
    if (!form.member_id) { setMaxEligible(null); return; }
    (async () => {
      const { data } = await supabase.rpc("eligible_loan_max", { _member_id: form.member_id });
      if (data != null) setMaxEligible(Number(data));
    })();
  }, [form.member_id]);

  useEffect(() => {
    const t = Number(form.term_months);
    if (!t) return;
    (async () => {
      const { data } = await supabase.rpc("compute_loan_rate", { _term_months: t });
      if (data != null) setForm(f => ({ ...f, interest_rate: String(Number(data) * 100) }));
    })();
  }, [form.term_months]);

  // Fee preview as principal changes
  useEffect(() => {
    const p = Number(form.principal);
    if (!Number.isFinite(p) || p <= 0) { setFeePreview(null); return; }
    (async () => {
      const { data } = await supabase.rpc("compute_disbursement_fee", { _principal: p });
      const r = Array.isArray(data) ? data[0] : data;
      if (r) setFeePreview({ service: Number(r.service_fee), insurance: Number(r.insurance_fee), total: Number(r.total_fees), net: Number(r.net_to_member) });
    })();
  }, [form.principal]);

  const monthlyPreview = useMemo(() => {
    const P = Number(form.principal); const r = Number(form.interest_rate) / 100 / 12; const n = Number(form.term_months);
    if (!P || !n) return 0;
    return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n));
  }, [form.principal, form.interest_rate, form.term_months]);

  const create = async () => {
    if (!form.member_id || !form.principal) return toast({ title: "Member and principal required", variant: "destructive" });
    const principal = Number(form.principal);
    if (maxEligible != null && principal > maxEligible) {
      return toast({ title: "Exceeds eligibility (4× savings)", description: `Max: ${fmt(maxEligible)} ETB`, variant: "destructive" });
    }
    setBusy(true);
    const loan_number = "LN-" + Date.now().toString().slice(-8);
    const { error } = await supabase.from("loans").insert({
      loan_number, member_id: form.member_id,
      principal, outstanding_balance: principal,
      interest_rate: (Number(form.interest_rate) || 0) / 100,
      term_months: Number(form.term_months) || 12,
      purpose: form.purpose, status: "pending",
    });
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Loan submitted", description: loan_number });
    setShowForm(false); load();
  };

  const setStatus = async (id: string, status: string) => {
    if (status === "active") {
      // Approve: post disbursement, generate schedule
      const loan = rows.find(r => r.id === id);
      if (!loan) return;
      const { data: feeData } = await supabase.rpc("compute_disbursement_fee", { _principal: loan.principal });
      const fee = Array.isArray(feeData) ? feeData[0] : feeData;
      if (fee) {
        await supabase.from("loan_disbursements").insert({
          loan_id: id, principal: loan.principal,
          service_fee: fee.service_fee, insurance_fee: fee.insurance_fee,
          total_fees: fee.total_fees, net_to_member: fee.net_to_member,
        });
      }
      await supabase.from("loans").update({ status: "active", disbursed_at: new Date().toISOString() }).eq("id", id);
      const { error: schedErr } = await supabase.rpc("generate_loan_schedule", { _loan_id: id });
      if (schedErr) toast({ title: "Schedule failed", description: schedErr.message, variant: "destructive" });
      toast({ title: "Loan disbursed", description: fee ? `Net to member: ${fmt(Number(fee.net_to_member))} ETB` : undefined });
      load();
      return;
    }
    const update: any = { status };
    if (status === "closed") update.closed_at = new Date().toISOString();
    const { error } = await supabase.from("loans").update(update).eq("id", id);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: `Loan ${status}` });
    load();
  };

  const viewSchedule = async (loan: Loan) => {
    setScheduleFor(loan);
    const { data } = await supabase.from("loan_schedule").select("*").eq("loan_id", loan.id).order("installment_no");
    setSchedule(data ?? []);
  };

  const memberOf = (id: string) => members.find(m => m.id === id);

  return (
    <div className="bg-card rounded-2xl border shadow-card-soft">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">Loans ({rows.length})</div>
        <Button size="sm" variant="hero" onClick={() => setShowForm(s => !s)}><Plus className="size-4" /> New Loan</Button>
      </div>
      {showForm && (
        <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Member</Label>
            <Select value={form.member_id} onValueChange={v => setForm({ ...form, member_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.member_number} — {m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {maxEligible != null && (
              <div className="text-xs mt-1 text-muted-foreground">
                Max eligible (4× savings): <span className="font-mono font-semibold text-primary">{fmt(maxEligible)} ETB</span>
              </div>
            )}
          </div>
          <div><Label className="text-xs">Principal (ETB)</Label><Input type="number" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} /></div>
          <div><Label className="text-xs">Interest % (auto)</Label><Input type="number" step="0.1" value={form.interest_rate} readOnly className="bg-muted" /></div>
          <div>
            <Label className="text-xs">Term (months)</Label>
            <Select value={form.term_months} onValueChange={v => setForm({ ...form, term_months: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 (1y · 15%)</SelectItem>
                <SelectItem value="24">24 (2y · 15%)</SelectItem>
                <SelectItem value="36">36 (3y · 15%)</SelectItem>
                <SelectItem value="48">48 (4y · 16%)</SelectItem>
                <SelectItem value="60">60 (5y · 17%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Purpose</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
          {feePreview && (
            <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-card border rounded-lg p-3">
              <div><div className="text-muted-foreground">Service (1%)</div><div className="font-mono font-semibold">{fmt(feePreview.service)}</div></div>
              <div><div className="text-muted-foreground">Insurance</div><div className="font-mono font-semibold">{fmt(feePreview.insurance)}</div></div>
              <div><div className="text-muted-foreground">Net to member</div><div className="font-mono font-semibold text-emerald-700">{fmt(feePreview.net)}</div></div>
              <div><div className="text-muted-foreground">Monthly inst.</div><div className="font-mono font-semibold text-primary">{fmt(monthlyPreview)}</div></div>
            </div>
          )}
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" variant="hero" onClick={create} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Submit</Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No loans.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-4 py-3">Loan #</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3 text-right">Principal</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(r => {
                const m = memberOf(r.member_id);
                const tone = r.status === "active" ? "border-emerald-500/30 text-emerald-700"
                  : r.status === "pending" ? "border-primary/30 text-primary"
                  : r.status === "rejected" || r.status === "defaulted" ? "border-destructive/30 text-destructive"
                  : "border-muted-foreground/30 text-muted-foreground";
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.loan_number}</td>
                    <td className="px-4 py-3">{m ? `${m.member_number} — ${m.full_name}` : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(r.principal)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(r.outstanding_balance)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={tone}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {r.status === "pending" && <>
                          <Button size="sm" variant="hero" onClick={() => setStatus(r.id, "active")}>Approve & Disburse</Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>Reject</Button>
                        </>}
                        {r.status === "active" && <>
                          <Button size="sm" variant="outline" onClick={() => viewSchedule(r)}><Calendar className="size-4" /> Schedule</Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "closed")}>Close</Button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {scheduleFor && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setScheduleFor(null)}>
          <div className="bg-card rounded-2xl border max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">Amortization Schedule — {scheduleFor.loan_number}</div>
                <div className="text-xs text-muted-foreground">Principal {fmt(scheduleFor.principal)} · {scheduleFor.term_months} months · {(Number(scheduleFor.interest_rate)*100).toFixed(2)}%/yr</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setScheduleFor(null)}>Close</Button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 sticky top-0">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">Due</th>
                <th className="px-3 py-2 text-right">Installment</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Interest</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {schedule.map(s => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{s.installment_no}</td>
                    <td className="px-3 py-2 text-xs">{s.due_date}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(s.installment_amount)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(s.principal_portion)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(s.interest_portion)}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(s.balance_after)}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- FINANCE / GL ---------------- */

type GLAccount = { id: string; code: string; name: string; type: string; active: boolean };
type GLEntry = { id: string; entry_date: string; account_id: string; debit: number; credit: number; description: string | null };

export const FinanceModule = () => {
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [entries, setEntries] = useState<GLEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"entries" | "accounts">("entries");
  const [showAcct, setShowAcct] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [acctForm, setAcctForm] = useState({ code: "", name: "", type: "asset" });
  const [entryForm, setEntryForm] = useState({ account_id: "", debit: "", credit: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, e] = await Promise.all([
      supabase.from("gl_accounts").select("*").order("code"),
      supabase.from("gl_entries").select("*").order("entry_date", { ascending: false }).limit(200),
    ]);
    setLoading(false);
    setAccounts((a.data ?? []) as GLAccount[]);
    setEntries((e.data ?? []) as GLEntry[]);
  };
  useEffect(() => { load(); }, []);

  const createAcct = async () => {
    if (!acctForm.code || !acctForm.name) return toast({ title: "Code & name required", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("gl_accounts").insert(acctForm);
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Account created" });
    setShowAcct(false); setAcctForm({ code: "", name: "", type: "asset" }); load();
  };

  const createEntry = async () => {
    const debit = Number(entryForm.debit) || 0;
    const credit = Number(entryForm.credit) || 0;
    if (!entryForm.account_id || (debit === 0 && credit === 0))
      return toast({ title: "Select account and debit or credit", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("gl_entries").insert({
      account_id: entryForm.account_id, debit, credit, description: entryForm.description || null,
    });
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Entry posted" });
    setShowEntry(false); setEntryForm({ account_id: "", debit: "", credit: "", description: "" }); load();
  };

  const acctOf = (id: string) => accounts.find(a => a.id === id);

  const totals = useMemo(() => ({
    debit: entries.reduce((a, e) => a + Number(e.debit || 0), 0),
    credit: entries.reduce((a, e) => a + Number(e.credit || 0), 0),
  }), [entries]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <ModuleStat label="GL Accounts" value={accounts.length} icon={<BookOpen className="size-5" />} />
        <ModuleStat label="Total Debits (ETB)" value={fmt(totals.debit)} icon={<TrendingUp className="size-5" />} tone="success" />
        <ModuleStat label="Total Credits (ETB)" value={fmt(totals.credit)} icon={<TrendingDown className="size-5" />} tone="destructive" />
      </div>

      <div className="bg-card rounded-2xl border shadow-card-soft">
        <div className="p-3 sm:p-4 border-b flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => setTab("entries")} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${tab === "entries" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>Journal</button>
            <button onClick={() => setTab("accounts")} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${tab === "accounts" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>Chart of Accounts</button>
          </div>
          {tab === "entries"
            ? <Button size="sm" variant="hero" onClick={() => setShowEntry(s => !s)}><Plus className="size-4" /> Post Entry</Button>
            : <Button size="sm" variant="hero" onClick={() => setShowAcct(s => !s)}><Plus className="size-4" /> Add Account</Button>}
        </div>

        {tab === "accounts" && showAcct && (
          <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-3 gap-3">
            <div><Label className="text-xs">Code</Label><Input value={acctForm.code} onChange={e => setAcctForm({ ...acctForm, code: e.target.value })} /></div>
            <div><Label className="text-xs">Name</Label><Input value={acctForm.name} onChange={e => setAcctForm({ ...acctForm, name: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={acctForm.type} onValueChange={v => setAcctForm({ ...acctForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["asset","liability","equity","income","expense"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowAcct(false)}>Cancel</Button>
              <Button size="sm" variant="hero" onClick={createAcct} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create</Button>
            </div>
          </div>
        )}

        {tab === "entries" && showEntry && (
          <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Account</Label>
              <Select value={entryForm.account_id} onValueChange={v => setEntryForm({ ...entryForm, account_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Debit</Label><Input type="number" step="0.01" value={entryForm.debit} onChange={e => setEntryForm({ ...entryForm, debit: e.target.value })} /></div>
            <div><Label className="text-xs">Credit</Label><Input type="number" step="0.01" value={entryForm.credit} onChange={e => setEntryForm({ ...entryForm, credit: e.target.value })} /></div>
            <div className="sm:col-span-4"><Label className="text-xs">Description</Label><Input value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} /></div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowEntry(false)}>Cancel</Button>
              <Button size="sm" variant="hero" onClick={createEntry} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Post</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : tab === "accounts" ? (
            accounts.length === 0
              ? <div className="p-12 text-center text-muted-foreground text-sm">No accounts yet.</div>
              : <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                    <th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Active</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {accounts.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{a.code}</td>
                        <td className="px-4 py-3">{a.name}</td>
                        <td className="px-4 py-3 capitalize">{a.type}</td>
                        <td className="px-4 py-3">{a.active ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No journal entries.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th>
              </tr></thead>
              <tbody className="divide-y">
                {entries.map(e => {
                  const a = acctOf(e.account_id);
                  return (
                    <tr key={e.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{e.entry_date}</td>
                      <td className="px-4 py-3">{a ? `${a.code} — ${a.name}` : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.description}</td>
                      <td className="px-4 py-3 text-right font-mono">{Number(e.debit) ? fmt(e.debit) : ""}</td>
                      <td className="px-4 py-3 text-right font-mono">{Number(e.credit) ? fmt(e.credit) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};