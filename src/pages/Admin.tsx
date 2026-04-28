import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/lib/router-shim";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Check, X, LogOut, Search, Users, Clock, CheckCircle2, XCircle, Loader2,
  ShieldCheck, Download, Eye, Trash2, UserPlus, ArrowLeft, Copy,
  LayoutDashboard, UserCircle2, Wallet, HandCoins, BookOpen, Receipt, PieChart,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { downloadRegistrationPdf, openRegistrationPdf, type FullRegistration } from "@/lib/registrationPdf";
import { useLang } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import {
  DashboardModule, MembersModule, SavingsModule, LoansModule, FinanceModule,
  PaymentsModule, DividendsModule,
} from "@/components/staff/Modules";

type Registration = FullRegistration & {
  status: "pending" | "approved" | "rejected";
  account_type: "saving" | "cheque" | "mobile_wallet";
};

type Tab = "pending" | "approved" | "rejected" | "all";
type Section =
  | "dashboard"
  | "registrations"
  | "members"
  | "payments"
  | "savings"
  | "loans"
  | "dividends"
  | "finance"
  | "staff";

interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  referral_code: string;
  active: boolean;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { t } = useLang();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Registration[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [section, setSection] = useState<Section>("dashboard");
  const [q, setQ] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: "", email: "", phone: "", password: "", role: "checker" as "admin" | "checker" | "maker" });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Auth + initial load
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (!data.session) { navigate("/admin/login", { replace: true }); return; }
      setEmail(data.session.user.email ?? "");
      const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
      const list = (rolesData ?? []).map((r: any) => r.role as string);
      setRoles(list);
      setIsAdmin(list.includes("admin"));
      load();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/admin/login", { replace: true });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time updates
  useEffect(() => {
    const ch = supabase
      .channel("registrations-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast({ title: t.admin.actionFailed, description: error.message, variant: "destructive" }); return; }
    setRows((data ?? []) as unknown as Registration[]);
  };

  const loadStaff = async () => {
    const { data, error } = await supabase.from("staff_profiles").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: t.admin.actionFailed, description: error.message, variant: "destructive" }); return; }
    setStaff((data ?? []) as StaffProfile[]);
  };

  useEffect(() => { if (section === "staff" && isAdmin) loadStaff(); }, [section, isAdmin]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActing(id);
    const { error } = await supabase.from("registrations").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    setActing(null);
    if (error) { toast({ title: t.admin.actionFailed, description: error.message, variant: "destructive" }); return; }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast({ title: status === "approved" ? t.admin.memberApproved : t.admin.memberRejected });
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm(t.admin.confirmDelete)) return;
    setActing(id);
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    setActing(null);
    if (error) { toast({ title: t.admin.actionFailed, description: error.message, variant: "destructive" }); return; }
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast({ title: t.admin.deleted });
  };

  const handlePdf = async (reg: Registration, mode: "view" | "download") => {
    setPdfBusy(reg.id + mode);
    try {
      if (mode === "view") await openRegistrationPdf(reg, settings as any);
      else await downloadRegistrationPdf(reg, settings as any);
    } catch (e: any) {
      toast({ title: "PDF generation failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setPdfBusy(null); }
  };

  const createStaff = async () => {
    if (!newStaff.full_name || !newStaff.email || !newStaff.password) {
      toast({ title: t.admin.staffCreateFailed, description: "Name, email and password required", variant: "destructive" });
      return;
    }
    setCreatingStaff(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-staff", { body: newStaff });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: t.admin.staffCreated, description: `${newStaff.email}` });
      setShowStaffForm(false);
      setNewStaff({ full_name: "", email: "", phone: "", password: "", role: "checker" });
      loadStaff();
    } catch (e: any) {
      toast({ title: t.admin.staffCreateFailed, description: e?.message ?? String(e), variant: "destructive" });
    } finally { setCreatingStaff(false); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    all: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    const base = tab === "all" ? rows : rows.filter((r) => r.status === tab);
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter((r) =>
      [r.full_name, r.customer_number, r.account_number, r.email, r.phone, r.region]
        .join(" ").toLowerCase().includes(term),
    );
  }, [rows, tab, q]);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Maedot" className="h-10 w-10 object-contain bg-white rounded-lg p-0.5" />
            <div>
              <div className="font-display font-bold">{t.brand.shortName}</div>
              <div className="text-[10px] uppercase tracking-widest text-primary">Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <SidebarItem icon={<LayoutDashboard className="size-4" />} active={section === "dashboard"} label="Dashboard" onClick={() => setSection("dashboard")} />
          <SidebarItem icon={<Users className="size-4" />} active={section === "registrations"} label={t.admin.tabs.registrations} onClick={() => setSection("registrations")} />
          {(isAdmin || roles.some(r => ["savings_officer","loan_officer","cashier","maker","checker"].includes(r))) && (
            <SidebarItem icon={<UserCircle2 className="size-4" />} active={section === "members"} label="Members" onClick={() => setSection("members")} />
          )}
          {(isAdmin || roles.includes("savings_officer") || roles.includes("cashier") || roles.includes("maker") || roles.includes("checker") || roles.includes("finance_officer")) && (
            <SidebarItem icon={<Receipt className="size-4" />} active={section === "payments"} label="Payments" onClick={() => setSection("payments")} />
          )}
          {(isAdmin || roles.includes("savings_officer") || roles.includes("cashier") || roles.includes("finance_officer")) && (
            <SidebarItem icon={<Wallet className="size-4" />} active={section === "savings"} label="Savings" onClick={() => setSection("savings")} />
          )}
          {(isAdmin || roles.includes("loan_officer") || roles.includes("finance_officer") || roles.includes("cashier")) && (
            <SidebarItem icon={<HandCoins className="size-4" />} active={section === "loans"} label="Loans" onClick={() => setSection("loans")} />
          )}
          {(isAdmin || roles.includes("finance_officer")) && (
            <SidebarItem icon={<PieChart className="size-4" />} active={section === "dividends"} label="Dividends" onClick={() => setSection("dividends")} />
          )}
          {(isAdmin || roles.includes("finance_officer")) && (
            <SidebarItem icon={<BookOpen className="size-4" />} active={section === "finance"} label="Finance / GL" onClick={() => setSection("finance")} />
          )}
          {isAdmin && (
            <SidebarItem icon={<ShieldCheck className="size-4" />} active={section === "staff"} label={t.admin.tabs.staff} onClick={() => setSection("staff")} />
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <LanguageToggle variant="light" />
          <div>
            <div className="text-xs text-sidebar-foreground/60 mb-1">{t.admin.signedInAs}</div>
            <div className="text-sm font-medium truncate">{email}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary">
            <LogOut className="size-4" /> {t.common.logout}
          </Button>
          <Link to="/" className="block text-xs text-primary hover:underline">{t.common.backToSite}</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="" className="h-9 w-9 object-contain bg-muted rounded-lg p-0.5 lg:hidden" />
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-secondary truncate">
                {section === "registrations" ? t.admin.title
                  : section === "staff" ? t.admin.staffMgmt
                  : section === "dashboard" ? "Dashboard"
                  : section === "members" ? "Members"
                  : section === "payments" ? "Member Payments"
                  : section === "savings" ? "Savings"
                  : section === "loans" ? "Loans"
                  : section === "dividends" ? "Share Dividends"
                  : "Finance / General Ledger"}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {section === "registrations" ? t.admin.subtitle
                  : section === "staff" ? t.admin.staffMgmtDesc
                  : section === "dashboard" ? "Overview of SACCO performance"
                  : section === "members" ? "Manage member accounts"
                  : section === "payments" ? "Bank transfers · registration fees · monthly contributions"
                  : section === "savings" ? "Savings accounts & transactions"
                  : section === "loans" ? "Loan applications & repayments"
                  : section === "dividends" ? "Annual share dividend distribution"
                  : "Chart of accounts & journal entries"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden"><LanguageToggle /></div>
            <Button variant="ghost" size="sm" onClick={logout} className="lg:hidden">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Mobile section tabs */}
        <div className="lg:hidden border-b bg-card px-3 py-2 flex gap-1 overflow-x-auto">
          {([
            ["dashboard","Dashboard"],
            ["registrations", t.admin.tabs.registrations],
            ["members","Members"],
            ["payments","Payments"],
            ["savings","Savings"],
            ["loans","Loans"],
            ["dividends","Dividends"],
            ["finance","Finance"],
            ...(isAdmin ? [["staff", t.admin.tabs.staff] as const] : []),
          ] as const).map(([s, label]) => (
            <button key={s} onClick={() => setSection(s as Section)} className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${section === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {label}
            </button>
          ))}
          <Link to="/" className="ml-auto text-xs text-primary self-center px-2">{t.common.backToSite}</Link>
        </div>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {section === "dashboard" && <DashboardModule />}
          {section === "members" && <MembersModule />}
          {section === "payments" && <PaymentsModule />}
          {section === "savings" && <SavingsModule />}
          {section === "loans" && <LoansModule />}
          {section === "dividends" && <DividendsModule />}
          {section === "finance" && <FinanceModule />}
          {section === "registrations" && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label={t.admin.stats.pending} value={counts.pending} tone="primary" icon={<Clock className="size-5" />} />
                <StatCard label={t.admin.stats.approved} value={counts.approved} tone="success" icon={<CheckCircle2 className="size-5" />} />
                <StatCard label={t.admin.stats.rejected} value={counts.rejected} tone="destructive" icon={<XCircle className="size-5" />} />
                <StatCard label={t.admin.stats.total} value={counts.all} tone="dark" icon={<Users className="size-5" />} />
              </div>

              <div className="bg-card rounded-2xl border shadow-card-soft">
                <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
                    {(["pending", "approved", "rejected", "all"] as Tab[]).map((tt) => (
                      <button key={tt} onClick={() => setTab(tt)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${tab === tt ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                        {t.status[tt]} ({counts[tt]})
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.admin.searchPh} className="pl-9" />
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  {loading ? (
                    <div className="p-12 grid place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
                  ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">{t.admin.empty}</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                          <th className="px-4 py-3">{t.admin.colCustomer}</th>
                          <th className="px-4 py-3">{t.admin.colMember}</th>
                          <th className="px-4 py-3 hidden lg:table-cell">{t.admin.colAccount}</th>
                          <th className="px-4 py-3 hidden xl:table-cell">{t.admin.colRegion}</th>
                          <th className="px-4 py-3">{t.admin.colType}</th>
                          <th className="px-4 py-3">{t.admin.colStatus}</th>
                          <th className="px-4 py-3 text-right">{t.admin.colActions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/30 align-top">
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{r.customer_number}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{r.full_name}</div>
                              <div className="text-xs text-muted-foreground">{r.email} · {r.phone}</div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs">{r.account_number}</td>
                            <td className="px-4 py-3 hidden xl:table-cell">{r.region}</td>
                            <td className="px-4 py-3 capitalize text-xs">{r.account_type.replace("_", " ")}</td>
                            <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap justify-end gap-1">
                                <Button size="sm" variant="outline" disabled={pdfBusy === r.id + "view"} onClick={() => handlePdf(r, "view")}>
                                  {pdfBusy === r.id + "view" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                                </Button>
                                <Button size="sm" variant="outline" disabled={pdfBusy === r.id + "download"} onClick={() => handlePdf(r, "download")}>
                                  {pdfBusy === r.id + "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                </Button>
                                {r.status === "pending" && (
                                  <>
                                    <Button size="sm" variant="hero" disabled={acting === r.id} onClick={() => updateStatus(r.id, "approved")}>
                                      <Check className="size-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => updateStatus(r.id, "rejected")}>
                                      <X className="size-4" />
                                    </Button>
                                  </>
                                )}
                                {isAdmin && (
                                  <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => deleteRegistration(r.id)} title={t.admin.deleteRegistration}>
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Mobile cards */}
                <div className="md:hidden p-3 space-y-3">
                  {loading ? (
                    <div className="p-12 grid place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
                  ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">{t.admin.empty}</div>
                  ) : filtered.map((r) => (
                    <div key={r.id} className="border rounded-xl p-3 bg-card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="font-mono text-[11px] font-semibold text-primary">{r.customer_number}</div>
                          <div className="font-medium truncate">{r.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.phone} · {r.region}</div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 font-mono">{r.account_number} · <span className="capitalize">{r.account_type.replace("_", " ")}</span></div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" onClick={() => handlePdf(r, "view")} disabled={pdfBusy === r.id + "view"}>
                          {pdfBusy === r.id + "view" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} {t.admin.viewPdf}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePdf(r, "download")} disabled={pdfBusy === r.id + "download"}>
                          {pdfBusy === r.id + "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} {t.admin.downloadPdf}
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="hero" onClick={() => updateStatus(r.id, "approved")} disabled={acting === r.id}>
                              <Check className="size-4" /> {t.common.approve}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "rejected")} disabled={acting === r.id}>
                              <X className="size-4" /> {t.common.reject}
                            </Button>
                          </>
                        )}
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => deleteRegistration(r.id)} disabled={acting === r.id} className="col-span-2">
                            <Trash2 className="size-4 text-destructive" /> {t.common.delete}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {section === "staff" && (
            <div className="bg-card rounded-2xl border shadow-card-soft">
              {!isAdmin ? (
                <div className="p-12 text-center text-muted-foreground">{t.admin.adminOnly}</div>
              ) : (
                <>
                  <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                    <div className="text-sm font-semibold">{t.admin.staffMgmt}</div>
                    <Button size="sm" variant="hero" onClick={() => setShowStaffForm((s) => !s)}>
                      <UserPlus className="size-4" /> {t.admin.addStaff}
                    </Button>
                  </div>
                  {showStaffForm && (
                    <div className="p-4 border-b bg-muted/30 grid sm:grid-cols-2 gap-3">
                      <div><Label className="text-xs">{t.admin.staffName}</Label><Input value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} /></div>
                      <div><Label className="text-xs">{t.admin.staffEmail}</Label><Input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} /></div>
                      <div><Label className="text-xs">{t.admin.staffPhone}</Label><Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} /></div>
                      <div><Label className="text-xs">{t.admin.staffPassword}</Label><Input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} /></div>
                      <div>
                        <Label className="text-xs">Role</Label>
                        <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="checker">Checker</SelectItem>
                            <SelectItem value="maker">Maker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2 flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowStaffForm(false)}>{t.common.cancel}</Button>
                        <Button variant="hero" size="sm" onClick={createStaff} disabled={creatingStaff}>
                          {creatingStaff ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} {t.admin.addStaff}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    {staff.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">{t.admin.noStaff}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                              <th className="px-3 py-2">{t.admin.staffName}</th>
                              <th className="px-3 py-2">{t.admin.staffEmail}</th>
                              <th className="px-3 py-2">{t.admin.staffReferral}</th>
                              <th className="px-3 py-2">{t.admin.staffActive}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {staff.map((s) => (
                              <tr key={s.id} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-medium">{s.full_name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{s.email}</td>
                                <td className="px-3 py-2">
                                  <span className="font-mono text-xs font-semibold text-primary">{s.referral_code}</span>
                                  <button onClick={() => navigator.clipboard.writeText(s.referral_code)} className="ml-2 text-muted-foreground hover:text-primary"><Copy className="size-3 inline" /></button>
                                </td>
                                <td className="px-3 py-2">{s.active ? <Badge variant="outline" className="border-emerald-500/30 text-emerald-700">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
    active ? "bg-sidebar-accent text-primary font-semibold" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
  }`}>
    {icon} {label}
  </button>
);

const StatCard = ({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "primary" | "success" | "destructive" | "dark" }) => {
  const tones = {
    primary: "from-primary/10 to-primary/5 text-primary",
    success: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    destructive: "from-destructive/10 to-destructive/5 text-destructive",
    dark: "from-secondary/10 to-secondary/5 text-secondary",
  };
  return (
    <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-card-soft">
      <div className={`size-9 sm:size-10 rounded-xl grid place-items-center bg-gradient-to-br ${tones[tone]} mb-2 sm:mb-3`}>{icon}</div>
      <div className="text-2xl sm:text-3xl font-display font-bold">{value.toLocaleString()}</div>
      <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: "pending" | "approved" | "rejected" }) => {
  const { t } = useLang();
  const map = {
    pending: "bg-primary/10 text-primary border-primary/30",
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  } as const;
  return <Badge variant="outline" className={`${map[status]} font-semibold`}>{t.status[status]}</Badge>;
};

export default Admin;
