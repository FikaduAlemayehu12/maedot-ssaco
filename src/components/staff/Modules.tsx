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

/* ---------------- REGISTRATION PAYMENTS ---------------- */

type Payment = {
  id: string; member_id: string | null; registration_id: string | null;
  purpose: string; amount: number;
  alloc_registration_fee: number; alloc_share_capital: number;
  alloc_initial_savings: number; alloc_extra_savings: number;
  bank_name: string | null; bank_reference: string | null;
  screenshot_url: string | null; paid_at: string;
  verified: boolean; created_at: string;
};

export const PaymentsModule = () => {
  const [rows, setRows] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({
    member_id: "", purpose: "registration",
    amount: "2050", bank_name: "", bank_reference: "", paid_at: new Date().toISOString().slice(0,10),
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, m, s] = await Promise.all([
      supabase.from("member_payments").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("members").select("id,member_number,full_name,phone,email,region,status,created_at").limit(500),
      supabase.from("sacco_settings").select("*").eq("id", 1).single(),
    ]);
    setLoading(false);
    if (p.error) toast({ title: p.error.message, variant: "destructive" });
    setRows((p.data ?? []) as Payment[]);
    setMembers((m.data ?? []) as Member[]);
    setSettings(s.data);
  };
  useEffect(() => { load(); }, []);

  const memberOf = (id: string | null) => members.find(m => m.id === id);

  const allocations = useMemo(() => {
    const amt = Number(form.amount) || 0;
    if (form.purpose !== "registration" || !settings) {
      return { fee: 0, share: 0, initial: 0, extra: amt };
    }
    const fee = settings.registration_fee, share = settings.share_contribution, init = settings.initial_savings;
    const required = Number(fee) + Number(share) + Number(init);
    if (amt < required) return { fee: 0, share: 0, initial: 0, extra: 0, short: required - amt };
    return { fee: Number(fee), share: Number(share), initial: Number(init), extra: amt - required };
  }, [form.amount, form.purpose, settings]);

  const submit = async () => {
    if (!form.member_id) return toast({ title: "Select member", variant: "destructive" });
    if (form.purpose === "registration" && (allocations as any).short)
      return toast({ title: "Insufficient amount", description: `Registration requires at least ${fmt(2050)} ETB`, variant: "destructive" });
    setBusy(true);
    let screenshot_url: string | null = null;
    if (file) {
      const path = `${form.member_id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("member-payments").upload(path, file, { upsert: false });
      if (up.error) { setBusy(false); return toast({ title: "Upload failed", description: up.error.message, variant: "destructive" }); }
      screenshot_url = up.data.path;
    }
    const { error } = await supabase.from("member_payments").insert({
      member_id: form.member_id,
      purpose: form.purpose,
      amount: Number(form.amount),
      alloc_registration_fee: allocations.fee,
      alloc_share_capital: allocations.share,
      alloc_initial_savings: allocations.initial,
      alloc_extra_savings: allocations.extra,
      bank_name: form.bank_name || null,
      bank_reference: form.bank_reference || null,
      paid_at: form.paid_at,
      screenshot_url,
      notes: form.notes || null,
    });
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Payment recorded", description: "Awaiting verification" });
    setForm({ member_id: "", purpose: "registration", amount: "2050", bank_name: "", bank_reference: "", paid_at: new Date().toISOString().slice(0,10), notes: "" });
    setFile(null); setShowForm(false); load();
  };

  const verify = async (p: Payment) => {
    if (!confirm(`Verify payment of ${fmt(p.amount)} ETB? This will allocate share capital and post savings.`)) return;
    const { error: e1 } = await supabase.from("member_payments")
      .update({ verified: true, verified_at: new Date().toISOString() }).eq("id", p.id);
    if (e1) return toast({ title: e1.message, variant: "destructive" });

    // Update share capital
    if (Number(p.alloc_share_capital) > 0 && p.member_id) {
      const { data: existing } = await supabase.from("share_capital").select("id,balance").eq("member_id", p.member_id).maybeSingle();
      if (existing) {
        await supabase.from("share_capital").update({ balance: Number(existing.balance) + Number(p.alloc_share_capital), updated_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("share_capital").insert({ member_id: p.member_id, balance: p.alloc_share_capital });
      }
    }

    // Post initial + extra savings to a savings account (create if none)
    const savingsAdd = Number(p.alloc_initial_savings) + Number(p.alloc_extra_savings);
    if (savingsAdd > 0 && p.member_id) {
      let { data: acc } = await supabase.from("savings_accounts").select("id,balance").eq("member_id", p.member_id).eq("status", "active").limit(1).maybeSingle();
      if (!acc) {
        const account_number = "SAV-" + Date.now().toString().slice(-8);
        const ins = await supabase.from("savings_accounts").insert({
          member_id: p.member_id, account_number, product: "regular",
          interest_rate: Number(settings?.savings_annual_rate ?? 0.07), balance: 0,
        }).select("id,balance").single();
        acc = ins.data as any;
      }
      if (acc) {
        const newBal = Number(acc.balance) + savingsAdd;
        await supabase.from("savings_transactions").insert({
          account_id: acc.id, txn_type: "deposit", amount: savingsAdd,
          running_balance: newBal, reference: p.bank_reference,
          note: `From payment ${p.id}`,
        });
        await supabase.from("savings_accounts").update({ balance: newBal }).eq("id", acc.id);
      }
    }
    toast({ title: "Payment verified & posted" });
    load();
  };

  return (
    <div className="bg-card rounded-2xl border shadow-card-soft">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Member Payments ({rows.length})</div>
          <div className="text-xs text-muted-foreground">Registration: {fmt(1050)} fee + {fmt(500)} share + {fmt(500)} savings = {fmt(2050)} ETB minimum</div>
        </div>
        <Button size="sm" variant="hero" onClick={() => setShowForm(s => !s)}><Receipt className="size-4" /> Record Payment</Button>
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
          </div>
          <div>
            <Label className="text-xs">Purpose</Label>
            <Select value={form.purpose} onValueChange={v => setForm({ ...form, purpose: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration (2,050 ETB+)</SelectItem>
                <SelectItem value="monthly_savings">Monthly savings</SelectItem>
                <SelectItem value="loan_repayment">Loan repayment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Amount (ETB)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label className="text-xs">Bank name</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
          <div><Label className="text-xs">Bank reference / TXN ID</Label><Input value={form.bank_reference} onChange={e => setForm({ ...form, bank_reference: e.target.value })} /></div>
          <div><Label className="text-xs">Paid on</Label><Input type="date" value={form.paid_at} onChange={e => setForm({ ...form, paid_at: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Bank transfer screenshot</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-card border rounded-lg p-3">
            <div><div className="text-muted-foreground">Reg. fee</div><div className="font-mono font-semibold">{fmt(allocations.fee)}</div></div>
            <div><div className="text-muted-foreground">Share capital</div><div className="font-mono font-semibold">{fmt(allocations.share)}</div></div>
            <div><div className="text-muted-foreground">Initial savings</div><div className="font-mono font-semibold">{fmt(allocations.initial)}</div></div>
            <div><div className="text-muted-foreground">Extra savings</div><div className="font-mono font-semibold text-emerald-700">{fmt(allocations.extra)}</div></div>
            {(allocations as any).short && (
              <div className="col-span-full text-destructive text-xs">Short by {fmt((allocations as any).short)} ETB — registration requires at least 2,050 ETB.</div>
            )}
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" variant="hero" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Record
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No payments yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Doc</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {rows.map(p => {
                const m = memberOf(p.member_id);
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.paid_at}</td>
                    <td className="px-4 py-3">{m ? `${m.member_number} — ${m.full_name}` : "—"}</td>
                    <td className="px-4 py-3 capitalize text-xs">{p.purpose.replace("_"," ")}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-xs">{p.bank_reference}</td>
                    <td className="px-4 py-3 text-xs">
                      {p.screenshot_url
                        ? <button className="text-primary hover:underline" onClick={async () => {
                            const { data } = await supabase.storage.from("member-payments").createSignedUrl(p.screenshot_url!, 60);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}><FileText className="size-4 inline" /> View</button>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.verified
                        ? <Badge variant="outline" className="border-emerald-500/30 text-emerald-700">Verified</Badge>
                        : <Badge variant="outline" className="border-primary/30 text-primary">Pending</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!p.verified && <Button size="sm" variant="hero" onClick={() => verify(p)}><ShieldCheck className="size-4" /> Verify & Post</Button>}
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

/* ---------------- DIVIDENDS ---------------- */

export const DividendsModule = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [rate, setRate] = useState("10");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [d, s, m] = await Promise.all([
      supabase.from("share_dividends").select("*").order("posted_at", { ascending: false }),
      supabase.from("share_capital").select("*"),
      supabase.from("members").select("id,member_number,full_name,phone,email,region,status,created_at"),
    ]);
    setRows(d.data ?? []);
    setShares(s.data ?? []);
    setMembers((m.data ?? []) as Member[]);
  };
  useEffect(() => { load(); }, []);

  const distribute = async () => {
    const r = Number(rate) / 100;
    if (!Number.isFinite(r) || r <= 0) return toast({ title: "Invalid rate", variant: "destructive" });
    if (!confirm(`Distribute ${rate}% dividends for ${year} on share balances?`)) return;
    setBusy(true);
    const inserts = shares.filter(s => Number(s.balance) > 0).map(s => ({
      member_id: s.member_id, fiscal_year: year, share_balance: s.balance, rate: r,
      amount: Number(s.balance) * r,
    }));
    if (inserts.length === 0) { setBusy(false); return toast({ title: "No share balances" }); }
    const { error } = await supabase.from("share_dividends").insert(inserts);
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Dividends posted", description: `${inserts.length} members` });
    load();
  };

  const memberOf = (id: string) => members.find(m => m.id === id);
  const totalShares = shares.reduce((a, s) => a + Number(s.balance || 0), 0);
  const totalDividends = rows.reduce((a, r) => a + Number(r.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <ModuleStat label="Total Share Capital" value={fmt(totalShares)} icon={<CircleDollarSign className="size-5" />} />
        <ModuleStat label="Members with Shares" value={shares.filter(s => Number(s.balance) > 0).length} icon={<Users className="size-5" />} tone="dark" />
        <ModuleStat label="Total Dividends Paid" value={fmt(totalDividends)} icon={<TrendingUp className="size-5" />} tone="success" />
      </div>

      <div className="bg-card rounded-2xl border shadow-card-soft p-4 grid sm:grid-cols-4 gap-3 items-end">
        <div><Label className="text-xs">Fiscal year</Label><Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} /></div>
        <div><Label className="text-xs">Dividend rate (%)</Label><Input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} /></div>
        <div className="sm:col-span-2 flex justify-end">
          <Button variant="hero" onClick={distribute} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />} Distribute Annual Dividends
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-card-soft overflow-x-auto">
        <div className="p-3 border-b text-sm font-semibold">Dividend History</div>
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No dividends posted yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
              <th className="px-4 py-3">Year</th><th className="px-4 py-3">Member</th>
              <th className="px-4 py-3 text-right">Share Balance</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Dividend</th>
              <th className="px-4 py-3">Posted</th>
            </tr></thead>
            <tbody className="divide-y">
              {rows.map(r => {
                const m = memberOf(r.member_id);
                return (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono">{r.fiscal_year}</td>
                    <td className="px-4 py-3">{m ? `${m.member_number} — ${m.full_name}` : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(r.share_balance)}</td>
                    <td className="px-4 py-3 text-right">{(Number(r.rate)*100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmt(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.posted_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, FileSignature, Search, Calculator, ShieldAlert, CheckCircle2, XCircle, FileText } from "lucide-react";

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type MemberLite = {
  id: string;
  member_number: string;
  full_name: string;
  phone: string | null;
  is_mor_staff?: boolean | null;
  employer?: string | null;
};

type LoanApp = {
  id: string;
  application_number: string;
  member_id: string;
  requested_amount: number;
  term_months: number;
  interest_rate: number;
  monthly_installment: number;
  total_payable: number;
  mandatory_savings: number;
  service_fee: number;
  insurance_fee: number;
  total_upfront_fees: number;
  net_to_member: number;
  status: string;
  created_at: string;
  is_mor_staff: boolean;
  purpose: string | null;
  collateral_owner: string | null;
  collateral_value: number | null;
  manager_name: string | null;
  witness_1: string | null;
  witness_2: string | null;
  witness_3: string | null;
  start_month: string | null;
  end_month: string | null;
  committee_decision_date: string | null;
  monthly_income: number | null;
};

const blankForm = {
  member_id: "",
  requested_amount: "",
  term_months: "36",
  purpose: "",
  monthly_income: "",
  is_mor_staff: false,
  // documents
  doc_marriage_cert: false,
  doc_fayda_kebele: false,
  doc_member_booklet: false,
  doc_vehicle_house_title: false,
  doc_insurance: false,
  doc_restraint_letter: false,
  doc_cheque: false,
  // collateral
  collateral_owner: "",
  collateral_plate_or_title: "",
  collateral_motor_chassis: "",
  collateral_type: "",
  collateral_value: "",
  // governance
  witness_1: "",
  witness_2: "",
  witness_3: "",
  manager_name: "",
  committee_decision_date: new Date().toISOString().slice(0, 10),
  start_month: new Date().toISOString().slice(0, 7) + "-01",
};

export const LoanApplicationsModule = () => {
  const [rows, setRows] = useState<LoanApp[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ ...blankForm });
  const [eligible6mo, setEligible6mo] = useState<boolean | null>(null);
  const [maxEligible, setMaxEligible] = useState<number | null>(null);
  const [viewing, setViewing] = useState<LoanApp | null>(null);

  const load = async () => {
    setLoading(true);
    const [a, m] = await Promise.all([
      supabase.from("loan_applications").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("members").select("id,member_number,full_name,phone,is_mor_staff,employer").limit(1000),
    ]);
    setLoading(false);
    if (a.error) toast({ title: a.error.message, variant: "destructive" });
    setRows((a.data ?? []) as LoanApp[]);
    setMembers((m.data ?? []) as MemberLite[]);
  };
  useEffect(() => { load(); }, []);

  // When member changes: pull MoR flag, eligibility (4×), and 6-month membership check
  useEffect(() => {
    if (!form.member_id) { setEligible6mo(null); setMaxEligible(null); return; }
    const mem = members.find(x => x.id === form.member_id);
    if (mem) setForm(f => ({ ...f, is_mor_staff: !!mem.is_mor_staff }));
    (async () => {
      const [{ data: max }, { data: ok }] = await Promise.all([
        supabase.rpc("eligible_loan_max", { _member_id: form.member_id }),
        supabase.rpc("member_has_6_months", { _member_id: form.member_id }),
      ]);
      if (max != null) setMaxEligible(Number(max));
      setEligible6mo(Boolean(ok));
    })();
  }, [form.member_id]);

  // Compute interest rate
  const interestRate = useMemo(() => {
    if (form.is_mor_staff) return 0.15;
    const t = Number(form.term_months);
    if (t <= 36) return 0.15;
    if (t <= 48) return 0.16;
    return 0.17;
  }, [form.term_months, form.is_mor_staff]);

  const computed = useMemo(() => {
    const P = Number(form.requested_amount) || 0;
    const n = Number(form.term_months) || 0;
    const r = interestRate / 12;
    const monthly = !P || !n ? 0 : (r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n)));
    const total = monthly * n;
    const mandatory = P * 0.25;
    const svc = P * 0.01;
    const ins = P > 300000 ? P * 0.015 : P * 0.01;
    const fees = svc + ins;
    const net = P - fees;
    return { monthly, total, mandatory, svc, ins, fees, net };
  }, [form.requested_amount, form.term_months, interestRate]);

  const memberOf = (id: string) => members.find(m => m.id === id);

  const submit = async () => {
    if (!form.member_id || !form.requested_amount) {
      return toast({ title: "Member and amount required", variant: "destructive" });
    }
    if (eligible6mo === false) {
      return toast({ title: "የአባልነት ብቃት የለም", description: "Member must have at least 6 months of verified membership.", variant: "destructive" });
    }
    const P = Number(form.requested_amount);
    if (maxEligible != null && P > maxEligible) {
      return toast({ title: "Exceeds 4× savings eligibility", description: `Max: ${fmt(maxEligible)} ETB`, variant: "destructive" });
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const start = new Date(form.start_month);
    const end = new Date(start); end.setMonth(end.getMonth() + Number(form.term_months));
    const payload = {
      member_id: form.member_id,
      requested_amount: P,
      term_months: Number(form.term_months),
      purpose: form.purpose || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      is_mor_staff: form.is_mor_staff,
      doc_marriage_cert: form.doc_marriage_cert,
      doc_fayda_kebele: form.doc_fayda_kebele,
      doc_member_booklet: form.doc_member_booklet,
      doc_vehicle_house_title: form.doc_vehicle_house_title,
      doc_insurance: form.doc_insurance,
      doc_restraint_letter: form.doc_restraint_letter,
      doc_cheque: form.doc_cheque,
      interest_rate: interestRate,
      monthly_installment: Number(computed.monthly.toFixed(2)),
      total_payable: Number(computed.total.toFixed(2)),
      mandatory_savings: Number(computed.mandatory.toFixed(2)),
      service_fee: Number(computed.svc.toFixed(2)),
      insurance_fee: Number(computed.ins.toFixed(2)),
      total_upfront_fees: Number(computed.fees.toFixed(2)),
      net_to_member: Number(computed.net.toFixed(2)),
      late_penalty_rate: 0.30,
      collateral_owner: form.collateral_owner || null,
      collateral_plate_or_title: form.collateral_plate_or_title || null,
      collateral_motor_chassis: form.collateral_motor_chassis || null,
      collateral_type: form.collateral_type || null,
      collateral_value: form.collateral_value ? Number(form.collateral_value) : null,
      witness_1: form.witness_1 || null,
      witness_2: form.witness_2 || null,
      witness_3: form.witness_3 || null,
      manager_name: form.manager_name || null,
      committee_decision_date: form.committee_decision_date || null,
      start_month: form.start_month || null,
      end_month: end.toISOString().slice(0, 10),
      status: "submitted",
      created_by: user?.id ?? null,
    } as const;
    const { error } = await supabase.from("loan_applications").insert(payload);
    setBusy(false);
    if (error) return toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    toast({ title: "ማመልከቻ ተልኳል", description: "Loan application submitted for committee review." });
    setForm({ ...blankForm });
    setShowForm(false);
    load();
  };

  const decide = async (app: LoanApp, status: "approved" | "rejected") => {
    const reason = status === "rejected" ? window.prompt("Reason for rejection?") ?? "" : "";
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("loan_applications").update({
      status, approved_by: user?.id ?? null, approved_at: new Date().toISOString(),
      rejected_reason: status === "rejected" ? reason : null,
    }).eq("id", app.id);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: `Application ${status}` });
    load();
  };

  const filtered = rows.filter(r => {
    if (!q) return true;
    const m = memberOf(r.member_id);
    const hay = `${r.application_number} ${m?.full_name ?? ""} ${m?.member_number ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border shadow-card-soft">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <FileSignature className="size-4 text-primary" />
              የብድር ማመልከቻዎች · Loan Applications ({rows.length})
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Dynamic Amharic loan form · auto-rate (15/16/17%, MoR flat 15%) · 25% mandatory savings · 2% upfront fees · 30% late penalty
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search application or member..." className="pl-9" />
            </div>
            <Button size="sm" variant="hero" onClick={() => setShowForm(s => !s)}>
              <Plus className="size-4" /> አዲስ ማመልከቻ
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="p-4 border-b bg-muted/30 space-y-5">
            {/* Member link */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">አባል (Linked Member)</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">ሙሉ ስም / የአባል ቁጥር</Label>
                  <Select value={form.member_id} onValueChange={v => setForm({ ...form, member_id: v })}>
                    <SelectTrigger><SelectValue placeholder="ተበዳሪውን ይምረጡ..." /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.member_number} — {m.full_name}{m.is_mor_staff ? " · MoR" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card w-full">
                    <Checkbox id="mor" checked={form.is_mor_staff} onCheckedChange={v => setForm({ ...form, is_mor_staff: !!v })} />
                    <Label htmlFor="mor" className="text-xs cursor-pointer">የገቢዎች ሚኒስቴር ሰራተኛ (MoR · flat 15%)</Label>
                  </div>
                </div>
              </div>
              {form.member_id && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {eligible6mo === false && (
                    <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
                      <ShieldAlert className="size-3" /> 6 ወር አባልነት አልተሟላም
                    </Badge>
                  )}
                  {eligible6mo === true && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 gap-1">
                      <CheckCircle2 className="size-3" /> 6+ ወር አባልነት ተሟልቷል
                    </Badge>
                  )}
                  {maxEligible != null && (
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      ከፍተኛ ብድር (4× ቁጠባ): {fmt(maxEligible)} ETB
                    </Badge>
                  )}
                </div>
              )}
            </section>

            {/* Loan request */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">የብድር ጥያቄ</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">የተጠየቀው የብድር መጠን (ETB)</Label>
                  <Input type="number" value={form.requested_amount} onChange={e => setForm({ ...form, requested_amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">የክፍያ ጊዜ (ወራት)</Label>
                  <Select value={form.term_months} onValueChange={v => setForm({ ...form, term_months: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 ወር (1 ዓመት)</SelectItem>
                      <SelectItem value="24">24 ወር (2 ዓመት)</SelectItem>
                      <SelectItem value="36">36 ወር (3 ዓመት · 15%)</SelectItem>
                      <SelectItem value="48">48 ወር (4 ዓመት · 16%)</SelectItem>
                      <SelectItem value="60">60 ወር (5 ዓመት · 17%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">ወርሃዊ ገቢ (ETB)</Label>
                  <Input type="number" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs">ብድሩ የተጠየቀበት ዓላማ</Label>
                  <Textarea rows={2} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Document checklist */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">ያቀረቧቸው ሰነዶች</div>
              <div className="grid sm:grid-cols-3 gap-2 text-sm">
                {[
                  ["doc_marriage_cert", "የጋብቻ ሰርተፍኬት"],
                  ["doc_fayda_kebele", "የፋይዳ / የቀበሌ መታወቂያ"],
                  ["doc_member_booklet", "የአባል ደብተር"],
                  ["doc_vehicle_house_title", "የመኪና ሊብሬ / የቤት ካርታ"],
                  ["doc_insurance", "ኢንሹራንስ"],
                  ["doc_restraint_letter", "የእግድ ደብዳቤ"],
                  ["doc_cheque", "ቼክ"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card cursor-pointer">
                    <Checkbox
                      checked={(form as any)[k]}
                      onCheckedChange={v => setForm({ ...form, [k]: !!v } as any)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Collateral */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">የብድሩ ዋስትና</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">ባለቤት</Label><Input value={form.collateral_owner} onChange={e => setForm({ ...form, collateral_owner: e.target.value })} /></div>
                <div><Label className="text-xs">የሰሌዳ / የካርታ ቁጥር</Label><Input value={form.collateral_plate_or_title} onChange={e => setForm({ ...form, collateral_plate_or_title: e.target.value })} /></div>
                <div><Label className="text-xs">የሞተር / የሻንሲ / የይዞታ ቁጥር</Label><Input value={form.collateral_motor_chassis} onChange={e => setForm({ ...form, collateral_motor_chassis: e.target.value })} /></div>
                <div><Label className="text-xs">ዓይነት</Label><Input value={form.collateral_type} onChange={e => setForm({ ...form, collateral_type: e.target.value })} /></div>
                <div><Label className="text-xs">የንብረት ግምት መጠን (ETB)</Label><Input type="number" value={form.collateral_value} onChange={e => setForm({ ...form, collateral_value: e.target.value })} /></div>
              </div>
            </section>

            {/* Governance */}
            <section>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">ምስክሮች እና ሥራ አስኪያጅ</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">ምስክር 1</Label><Input value={form.witness_1} onChange={e => setForm({ ...form, witness_1: e.target.value })} /></div>
                <div><Label className="text-xs">ምስክር 2</Label><Input value={form.witness_2} onChange={e => setForm({ ...form, witness_2: e.target.value })} /></div>
                <div><Label className="text-xs">ምስክር 3</Label><Input value={form.witness_3} onChange={e => setForm({ ...form, witness_3: e.target.value })} /></div>
                <div><Label className="text-xs">ሥራ አስኪያጅ ስም</Label><Input value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} /></div>
                <div><Label className="text-xs">የኮሚቴ ውሳኔ ቀን</Label><Input type="date" value={form.committee_decision_date} onChange={e => setForm({ ...form, committee_decision_date: e.target.value })} /></div>
                <div><Label className="text-xs">ብድሩ የሚወሰድበት ወር</Label><Input type="date" value={form.start_month} onChange={e => setForm({ ...form, start_month: e.target.value })} /></div>
              </div>
            </section>

            {/* Auto computed */}
            <section className="bg-card border rounded-lg p-3 sm:p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Calculator className="size-3.5" /> በራስ ሰር ስሌት
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Stat label="የወለድ መጠን" value={`${(interestRate * 100).toFixed(0)}%`} tone="primary" />
                <Stat label="ወርሃዊ ክፍያ" value={`${fmt(computed.monthly)} ETB`} />
                <Stat label="ጠቅላላ ክፍያ" value={`${fmt(computed.total)} ETB`} />
                <Stat label="25% ግዴታ ቁጠባ" value={`${fmt(computed.mandatory)} ETB`} />
                <Stat label="የአገልግሎት ክፍያ (1%)" value={`${fmt(computed.svc)} ETB`} />
                <Stat label="ኢንሹራንስ" value={`${fmt(computed.ins)} ETB`} />
                <Stat label="ጠቅላላ ቅድሚያ ክፍያ" value={`${fmt(computed.fees)} ETB`} />
                <Stat label="ለአባል የሚሰጥ ዕላፊ" value={`${fmt(computed.net)} ETB`} tone="success" />
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">
                የዘገየ ክፍያ መቀጮ: 30% ከወርሃዊ ክፍያ ላይ (አንቀጽ 3.6)
              </div>
            </section>

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm({ ...blankForm }); }}>ሰርዝ</Button>
              <Button size="sm" variant="hero" onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />} ማመልከቻ ላክ
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">ምንም ማመልከቻ የለም</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                  <th className="px-4 py-3">App #</th>
                  <th className="px-4 py-3">አባል</th>
                  <th className="px-4 py-3 text-right">መጠን</th>
                  <th className="px-4 py-3 text-right">ወለድ</th>
                  <th className="px-4 py-3 text-right">ወርሃዊ</th>
                  <th className="px-4 py-3">ሁኔታ</th>
                  <th className="px-4 py-3 text-right">እርምጃ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(r => {
                  const m = memberOf(r.member_id);
                  const tone = r.status === "approved" ? "border-emerald-500/30 text-emerald-700"
                    : r.status === "submitted" || r.status === "under_review" ? "border-primary/30 text-primary"
                    : r.status === "rejected" ? "border-destructive/30 text-destructive"
                    : "border-muted-foreground/30 text-muted-foreground";
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.application_number}</td>
                      <td className="px-4 py-3">{m ? `${m.member_number} — ${m.full_name}` : "—"}{r.is_mor_staff && <Badge variant="outline" className="ml-1 text-[10px]">MoR</Badge>}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(r.requested_amount)}</td>
                      <td className="px-4 py-3 text-right font-mono">{(r.interest_rate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(r.monthly_installment)}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={tone}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(r)}><FileText className="size-3.5" /></Button>
                          {(r.status === "submitted" || r.status === "under_review") && (
                            <>
                              <Button size="sm" variant="ghost" className="text-emerald-700" onClick={() => decide(r, "approved")}><CheckCircle2 className="size-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => decide(r, "rejected")}><XCircle className="size-3.5" /></Button>
                            </>
                          )}
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

      {viewing && (
        <ContractView app={viewing} member={memberOf(viewing.member_id) ?? null} onClose={() => setViewing(null)} />
      )}
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" }) => (
  <div className={`rounded-md border p-2 ${tone === "primary" ? "border-primary/30 bg-primary/5" : tone === "success" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/30"}`}>
    <div className="text-muted-foreground">{label}</div>
    <div className="font-mono font-semibold">{value}</div>
  </div>
);

/* ---------------- Amharic Contract / Application View ---------------- */

const ContractView = ({ app, member, onClose }: { app: LoanApp; member: MemberLite | null; onClose: () => void }) => {
  const name = member?.full_name ?? "[የተበዳሪ ስም]";
  const amount = fmt(app.requested_amount);
  const total = fmt(app.total_payable);
  const monthly = fmt(app.monthly_installment);
  const ratePct = (app.interest_rate * 100).toFixed(0);
  const start = app.start_month ? new Date(app.start_month) : null;
  const end = app.end_month ? new Date(app.end_month) : null;
  const startMonth = start ? start.toLocaleDateString("am-ET", { month: "long" }) : "________";
  const startYear = start ? start.getFullYear() : "____";
  const endMonth = end ? end.toLocaleDateString("am-ET", { month: "long" }) : "________";
  const endYear = end ? end.getFullYear() : "____";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card max-w-3xl w-full rounded-2xl border shadow-xl my-8" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">{app.application_number} · የብድር ማመልከቻ እና የውል ስምምነት</div>
          <Button size="sm" variant="ghost" onClick={onClose}>ዝጋ</Button>
        </div>
        <div className="p-6 space-y-5 text-sm leading-relaxed max-h-[70vh] overflow-y-auto" lang="am">
          <div>
            <h3 className="font-bold text-base mb-2">በማዕዶት የገ/ቁ/ብ//ኃላ/የተ/የመ/የኅ/ሥራ ማህበር የብድር ማመልከቻ ቅፅ</h3>
            <p>
              የብድር ኮሚቴው {app.committee_decision_date ?? "____/__/____"} ዓ.ም ተሰብስቦ በ<b>{name}</b> ብር <b>{amount}</b> እንዲሰጣቸው የቀረበውን የብድር ማመልከቻ
              በብድር አሰጣጥ መመሪያው መሠረት ሁኔታውን ከመረመረ በኋላ በአኃዝ ብር <b>{amount}</b> ብር በ{startMonth} ወር {startYear} ዓ.ም ወስደው በ{endMonth} ወር {endYear} ዓ.ም በ
              <b>{app.term_months}</b> ወራት ተከፍሎ የሚያልቅ ብድር እንዲሰጣቸው ወስኗል፡፡
            </p>
          </div>
          <Row k="ተበዳሪው አማካኝ የወር ገቢ" v={app.monthly_income ? `${fmt(app.monthly_income)} ETB` : "—"} />
          <Row k="ብድሩ የተጠየቀበት ዓላማ" v={app.purpose ?? "—"} />

          <div>
            <h4 className="font-semibold mb-1">የብድሩ መጠን እና የክፍያ ሁኔታ</h4>
            <Row k="የተጠየቀው የብድር መጠን" v={`${amount} ETB`} />
            <Row k="ተከፍሎ የሚያልቅበት" v={`${app.term_months} ወራት`} />
            <Row k="የወለድ መጠን" v={`${ratePct}%${app.is_mor_staff ? " (MoR flat)" : ""}`} />
            <Row k="ወርሃዊ የብድር ክፍያ" v={`${monthly} ETB`} />
            <Row k="25% የግዴታ ቁጠባ" v={`${fmt(app.mandatory_savings)} ETB`} />
          </div>

          <div className="border-t pt-3">
            <h4 className="font-semibold">አንቀጽ 1፡ የብድር መጠን</h4>
            <p>
              በዚህ ውል መሠረት የተበደሩትን ዋና <b>{amount}</b> ብር፤ ከወለዱ እና ከልዩ ልዩ ወጪዎች ጋር የሚታሰብ ጠቅላላ <b>{total}</b> ብር በ{endMonth} ወር {endYear} ዓ.ም ተከፍሎ የሚጠናቀቅ
              ብድር አበዳሪው ለተበዳሪ አበድሯል፡፡
            </p>
          </div>

          <div>
            <h4 className="font-semibold">አንቀጽ 3፡ የብድር ክፍያ ሁኔታ</h4>
            <p>3.1 ተበዳሪው የብድር ገንዘብ ከወለዱና ከልዩ ልዩ ወጪዎች ጋር ከ{startMonth} ወር {startYear} ዓ.ም ጀምሮ በየወሩ ብር <b>{monthly}</b> ያለማቋረጥ ለ<b>{app.term_months}</b> ወራት ለመክፈል ተስማምተዋል፡፡</p>
            <p>3.6 ተበዳሪው ክፍያ ባዘገየው ቀናት ከወርሃዊ ክፍያ ላይ <b>30%</b> (ሰላሳ በመቶ) መቀጮ የመክፈል ግዴታ አለበት፡፡</p>
          </div>

          <div>
            <h4 className="font-semibold">አንቀጽ 4፡ ወለድ</h4>
            <p>4.1 በተሰጠው ብድር ላይ በዓመት <b>{ratePct}%</b> ወለድ በየዕለቱ ባለው የብድር ገንዘብ መጠን ላይ በየወሩ ይታሰባል፡፡</p>
          </div>

          <div>
            <h4 className="font-semibold">አንቀጽ 7፡ የተበዳሪው ግዴታዎች</h4>
            <p>7.1 ለአገልግሎት ክፍያ (Service Charge) እና መድን (Insurance) 2% ማለትም ብር <b>{fmt(app.total_upfront_fees)}</b> ብር በቅድሚያ መክፈል ይኖርበታል፡፡</p>
            <p>7.2 የብድር ገንዘቡ 25% ብር <b>{fmt(app.mandatory_savings)}</b> ብር በቅድሚያ የመቆጠብ ግዴታ አለበት፡፡</p>
            <p>7.4 ተበዳሪው መደበኛ ቁጠባን ጨምሮ በየወሩ ብር <b>{fmt(app.monthly_installment + app.mandatory_savings / app.term_months)}</b> ገቢ የማድረግ ግዴታ አለበት፡፡</p>
          </div>

          <div>
            <h4 className="font-semibold">አንቀጽ 8፡ የብድሩ ዋስትና</h4>
            <p>8.1 ለብድሩ ዋስትና የቀረበው ንብረት ግምት ብር <b>{app.collateral_value ? fmt(app.collateral_value) : "—"}</b> ብር ነው፡፡</p>
            <div className="ml-4 text-[13px]">
              <Row k="ባለቤት" v={app.collateral_owner ?? "—"} />
              <Row k="የሰሌዳ/የካርታ ቁጥር" v={(app as any).collateral_plate_or_title ?? "—"} />
              <Row k="የሞተር/የሻንሲ/የይዞታ ቁጥር" v={(app as any).collateral_motor_chassis ?? "—"} />
              <Row k="ዓይነት" v={(app as any).collateral_type ?? "—"} />
            </div>
          </div>

          <div className="border-t pt-3 space-y-1">
            <h4 className="font-semibold">የስምምነት ማረጋገጫ</h4>
            <p>ተበዳሪ: እኔ <b>{name}</b> የብድር ውሉን ጠቅላላ ይዘት አንብቤ መብትና ግዴታዬን ከተረዳሁ በኋላ በፈቃደኝነት ፈርሜያለሁ፡፡</p>
            <p>ፊርማ: _________________ ቀን: _________________</p>
            <p className="mt-2">አበዳሪ: እኔ <b>{app.manager_name ?? "[የሥራ አስኪያጅ ስም]"}</b> የማህበሩ ስራ አስኪያጅ አበዳሪን በመወከል የውሉን ይዘት አስረድቼ ማስፈረሜን አረጋግጣለሁ፡፡</p>
            <p>ፊርማ: _________________ ቀን: _________________</p>
            <div className="mt-3">
              <div>ምስክሮች:</div>
              <div>ስም: <b>{app.witness_1 ?? "_______________"}</b> ፊርማ: ___________</div>
              <div>ስም: <b>{app.witness_2 ?? "_______________"}</b> ፊርማ: ___________</div>
              <div>ስም: <b>{app.witness_3 ?? "_______________"}</b> ፊርማ: ___________</div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>አትም / Print</Button>
          <Button size="sm" variant="hero" onClick={onClose}>ዝጋ</Button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-2"><span className="text-muted-foreground min-w-[180px]">{k}:</span><span className="font-medium">{v}</span></div>
);
