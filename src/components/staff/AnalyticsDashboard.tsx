import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileSpreadsheet, FileText, TrendingUp, AlertTriangle, Wallet, HandCoins, Users } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import * as XLSX from "xlsx";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }).format(n || 0);
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

type Kpis = {
  members: number;
  activeLoans: number;
  totalSavings: number;
  totalShareCapital: number;
  outstandingPrincipal: number;
  overdueCount: number;
  monthDeposits: number;
  monthRepayments: number;
  ytdInterestEarned: number;
  ytdInterestPaid: number;
};

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [trend, setTrend] = useState<{ month: string; deposits: number; repayments: number; disbursed: number }[]>([]);
  const [loanMix, setLoanMix] = useState<{ name: string; value: number }[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const since = new Date(); since.setMonth(since.getMonth() - 11);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const [members, savings, shares, loans, txns, repays, disb, accruals, overdues] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("savings_accounts").select("balance,product").eq("status", "active"),
      supabase.from("share_capital").select("balance"),
      supabase.from("loans").select("id,principal,outstanding_balance,status,interest_rate,term_months"),
      supabase.from("savings_transactions").select("amount,txn_type,posted_at").gte("posted_at", since.toISOString()),
      supabase.from("loan_repayments").select("amount,paid_at,status").gte("paid_at", since.toISOString()).not("paid_at", "is", null),
      supabase.from("loan_disbursements").select("principal,disbursed_at").gte("disbursed_at", since.toISOString()),
      supabase.from("savings_interest_accruals").select("net_interest,period").gte("period", yearStart.toISOString().slice(0, 10)),
      supabase.from("loan_schedule").select("id,loan_id,due_date,installment_amount,status").lt("due_date", new Date().toISOString().slice(0, 10)).neq("status", "paid"),
    ]);

    const totalSavings = (savings.data ?? []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0);
    const totalShares = (shares.data ?? []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0);
    const activeLoans = (loans.data ?? []).filter((l: any) => l.status !== "closed").length;
    const outstanding = (loans.data ?? []).reduce((s: number, l: any) => s + Number(l.outstanding_balance || 0), 0);
    const monthDeposits = (txns.data ?? [])
      .filter((t: any) => t.txn_type === "deposit" && new Date(t.posted_at) >= monthStart)
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const monthRepays = (repays.data ?? [])
      .filter((r: any) => new Date(r.paid_at) >= monthStart)
      .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const ytdInterestPaid = (accruals.data ?? []).reduce((s: number, a: any) => s + Number(a.net_interest || 0), 0);
    const ytdInterestEarned = (loans.data ?? []).reduce(
      (s: number, l: any) => s + Number(l.principal || 0) * Number(l.interest_rate || 0) * (Math.min(Number(l.term_months || 0), 12) / 12),
      0,
    );

    setKpis({
      members: members.count ?? 0,
      activeLoans,
      totalSavings,
      totalShareCapital: totalShares,
      outstandingPrincipal: outstanding,
      overdueCount: overdues.data?.length ?? 0,
      monthDeposits,
      monthRepayments: monthRepays,
      ytdInterestEarned,
      ytdInterestPaid,
    });

    // 12-month trend buckets
    const buckets: Record<string, { deposits: number; repayments: number; disbursed: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
      const key = d.toISOString().slice(0, 7);
      buckets[key] = { deposits: 0, repayments: 0, disbursed: 0 };
    }
    (txns.data ?? []).forEach((t: any) => {
      const k = String(t.posted_at).slice(0, 7);
      if (buckets[k] && t.txn_type === "deposit") buckets[k].deposits += Number(t.amount || 0);
    });
    (repays.data ?? []).forEach((r: any) => {
      const k = String(r.paid_at).slice(0, 7);
      if (buckets[k]) buckets[k].repayments += Number(r.amount || 0);
    });
    (disb.data ?? []).forEach((d: any) => {
      const k = String(d.disbursed_at).slice(0, 7);
      if (buckets[k]) buckets[k].disbursed += Number(d.principal || 0);
    });
    setTrend(Object.entries(buckets).map(([month, v]) => ({ month: month.slice(5), ...v })));

    // Loan mix by status
    const mix: Record<string, number> = {};
    (loans.data ?? []).forEach((l: any) => {
      mix[l.status] = (mix[l.status] || 0) + 1;
    });
    setLoanMix(Object.entries(mix).map(([name, value]) => ({ name, value })));

    // Overdue detail (top 10)
    setOverdue((overdues.data ?? []).slice(0, 10));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportXlsx = () => {
    if (!kpis) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
      "Active Members": kpis.members,
      "Active Loans": kpis.activeLoans,
      "Total Savings (ETB)": kpis.totalSavings,
      "Share Capital (ETB)": kpis.totalShareCapital,
      "Outstanding Principal (ETB)": kpis.outstandingPrincipal,
      "Overdue Installments": kpis.overdueCount,
      "Month Deposits": kpis.monthDeposits,
      "Month Repayments": kpis.monthRepayments,
      "YTD Interest Earned (proj.)": kpis.ytdInterestEarned,
      "YTD Interest Paid to Members": kpis.ytdInterestPaid,
    }]), "KPIs");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trend), "12-Month Trend");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loanMix), "Loan Mix");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overdue), "Overdue");
    XLSX.writeFile(wb, `maedot_analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCsv = () => {
    if (!trend.length) return;
    const header = "month,deposits,repayments,disbursed";
    const body = trend.map(r => `${r.month},${r.deposits},${r.repayments},${r.disbursed}`).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `maedot_trend_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => window.print();

  if (loading || !kpis) return <div className="p-12 grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6" id="analytics-print">
      <style>{`@media print { body * { visibility: hidden !important; } #analytics-print, #analytics-print * { visibility: visible !important; } #analytics-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; } .no-print { display:none !important; } }`}</style>

      <div className="flex items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold">Analytics & Insights</h2>
          <p className="text-xs text-muted-foreground">Real-time KPIs · 12-month trends · drill-down ready</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
          <Button size="sm" variant="outline" onClick={exportXlsx}><FileSpreadsheet className="size-4" /> Excel</Button>
          <Button size="sm" variant="hero" onClick={printPdf}><FileText className="size-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi icon={<Users className="size-4" />} label="Active Members" value={String(kpis.members)} />
        <Kpi icon={<Wallet className="size-4" />} label="Total Savings" value={fmt(kpis.totalSavings)} />
        <Kpi icon={<HandCoins className="size-4" />} label="Outstanding Loans" value={fmt(kpis.outstandingPrincipal)} sub={`${kpis.activeLoans} active`} />
        <Kpi icon={<TrendingUp className="size-4" />} label="Share Capital" value={fmt(kpis.totalShareCapital)} />
        <Kpi icon={<AlertTriangle className="size-4" />} label="Overdue Installments" value={String(kpis.overdueCount)} tone={kpis.overdueCount > 0 ? "danger" : "ok"} />
        <Kpi label="This Month — Deposits" value={fmt(kpis.monthDeposits)} />
        <Kpi label="This Month — Repayments" value={fmt(kpis.monthRepayments)} />
        <Kpi label="YTD Interest Earned (proj.)" value={fmt(kpis.ytdInterestEarned)} />
        <Kpi label="YTD Interest Paid to Members" value={fmt(kpis.ytdInterestPaid)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-4 shadow-card-soft">
          <div className="text-sm font-semibold mb-3">12-Month Cash Flow</div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="dep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.6} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="dis" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="deposits" stroke="#10b981" fill="url(#dep)" name="Deposits" />
                <Area type="monotone" dataKey="repayments" stroke="hsl(var(--primary))" fill="url(#rep)" name="Repayments" />
                <Area type="monotone" dataKey="disbursed" stroke="#f59e0b" fill="url(#dis)" name="Disbursed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-card-soft">
          <div className="text-sm font-semibold mb-3">Loan Portfolio Mix</div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={loanMix} dataKey="value" nameKey="name" outerRadius={90} label>
                  {loanMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-4 shadow-card-soft">
        <div className="text-sm font-semibold mb-3">Monthly Disbursements</div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" /><YAxis />
              <Tooltip formatter={(v: any) => fmt(Number(v))} />
              <Bar dataKey="disbursed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="bg-card border rounded-2xl shadow-card-soft overflow-hidden">
          <div className="p-4 border-b text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" /> Overdue Installments (top 10)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase bg-muted/40 text-muted-foreground">
                <th className="px-4 py-2">Loan</th><th className="px-4 py-2">Due</th>
                <th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {overdue.map((o: any) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 font-mono text-xs">{String(o.loan_id).slice(0, 8)}…</td>
                    <td className="px-4 py-2">{o.due_date}</td>
                    <td className="px-4 py-2 text-right font-mono">{fmt(Number(o.installment_amount))}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs">{o.status}</span></td>
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

const Kpi = ({ icon, label, value, sub, tone }: { icon?: React.ReactNode; label: string; value: string; sub?: string; tone?: "ok" | "danger" }) => (
  <div className={`bg-card border rounded-xl p-3 shadow-card-soft ${tone === "danger" ? "border-destructive/40" : ""}`}>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
    <div className="text-lg font-bold mt-1 font-mono">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);