import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, Search, ShieldCheck, ShieldAlert, CheckCircle2,
  Calculator, FileSignature, Wallet,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { LanguageToggle } from "@/components/site/LanguageToggle";

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type FoundMember = { member_id: string; full_name: string; is_mor_staff: boolean };

export default function ApplyLoan() {
  const { settings } = useSiteSettings();

  // Step 1 — identity verification
  const [memberNumber, setMemberNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [member, setMember] = useState<FoundMember | null>(null);
  const [eligible6mo, setEligible6mo] = useState<boolean | null>(null);
  const [maxEligible, setMaxEligible] = useState<number | null>(null);

  // Step 2 — application form
  const [form, setForm] = useState({
    requested_amount: "",
    term_months: "36",
    purpose: "",
    monthly_income: "",
    is_mor_staff: false,
    doc_marriage_cert: false,
    doc_fayda_kebele: false,
    doc_member_booklet: false,
    doc_vehicle_house_title: false,
    doc_insurance: false,
    doc_restraint_letter: false,
    doc_cheque: false,
    collateral_owner: "",
    collateral_plate_or_title: "",
    collateral_motor_chassis: "",
    collateral_type: "",
    collateral_value: "",
    witness_1: "",
    witness_2: "",
    witness_3: "",
    start_month: new Date().toISOString().slice(0, 7) + "-01",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ application_number?: string } | null>(null);

  const verify = async () => {
    if (!memberNumber.trim() || (!phone.trim() && !dob)) {
      return toast({ title: "የአባል ቁጥር እና ስልክ/የልደት ቀን ያስፈልጋሉ", variant: "destructive" });
    }
    setVerifying(true);
    const { data, error } = await supabase.rpc("lookup_member_for_loan", {
      _member_number: memberNumber.trim(),
      _phone: phone.trim() || undefined,
      _dob: dob || undefined,
    });
    setVerifying(false);
    if (error) return toast({ title: "Lookup failed", description: error.message, variant: "destructive" });
    const found = (data as any[])?.[0] as FoundMember | undefined;
    if (!found) return toast({ title: "አባል አልተገኘም", description: "Member not found or details don't match.", variant: "destructive" });
    setMember(found);
    setForm(f => ({ ...f, is_mor_staff: !!found.is_mor_staff }));

    // Eligibility checks
    const [{ data: max }, { data: ok }] = await Promise.all([
      supabase.rpc("eligible_loan_max", { _member_id: found.member_id }),
      supabase.rpc("member_has_6_months", { _member_id: found.member_id }),
    ]);
    if (max != null) setMaxEligible(Number(max));
    setEligible6mo(Boolean(ok));
  };

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

  const submit = async () => {
    if (!member) return;
    if (!form.requested_amount || Number(form.requested_amount) <= 0) {
      return toast({ title: "የብድር መጠን ያስፈልጋል", variant: "destructive" });
    }
    if (eligible6mo === false) {
      return toast({ title: "የአባልነት ብቃት የለም", description: "ቢያንስ 6 ወር አባልነት ያስፈልጋል.", variant: "destructive" });
    }
    const P = Number(form.requested_amount);
    if (maxEligible != null && P > maxEligible) {
      return toast({ title: "ከ4× ቁጠባ በላይ ነው", description: `Max: ${fmt(maxEligible)} ETB`, variant: "destructive" });
    }
    setBusy(true);
    const start = new Date(form.start_month);
    const end = new Date(start); end.setMonth(end.getMonth() + Number(form.term_months));
    const payload = {
      member_id: member.member_id,
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
      start_month: form.start_month || null,
      end_month: end.toISOString().slice(0, 10),
      status: "submitted",
    };
    const { data, error } = await supabase
      .from("loan_applications")
      .insert(payload as any)
      .select("application_number")
      .single();
    setBusy(false);
    if (error) return toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    setDone({ application_number: (data as any)?.application_number });
    toast({ title: "ማመልከቻ ተልኳል", description: "Loan application submitted." });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Maedot" className="size-8" />
            <span className="font-display font-bold text-secondary">Maedot SACCO</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="size-4" /> Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 sm:py-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Wallet className="size-3.5" /> Loan Application · ብድር ማመልከቻ
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-secondary">የብድር ማመልከቻ ቅፅ</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Auto-rate (15/16/17%, MoR flat 15%) · 25% mandatory savings · 2% upfront fees · 30% late penalty
          </p>
        </div>

        {done ? (
          <div className="bg-card border rounded-2xl p-8 text-center shadow-card-soft">
            <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center mx-auto mb-3">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-xl font-bold mb-1">ማመልከቻዎ ተልኳል!</h2>
            <p className="text-muted-foreground text-sm">Your loan application has been submitted for committee review.</p>
            {done.application_number && (
              <div className="mt-4 inline-block rounded-lg bg-muted px-4 py-2 font-mono text-sm">
                Application # <strong>{done.application_number}</strong>
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" asChild><Link to="/">Back home</Link></Button>
            </div>
          </div>
        ) : !member ? (
          /* Step 1: verify */
          <div className="bg-card border rounded-2xl p-6 shadow-card-soft">
            <div className="text-sm font-semibold mb-1">አባልነት ማረጋገጫ · Member Verification</div>
            <p className="text-xs text-muted-foreground mb-4">
              እባክዎ የአባል ቁጥርዎን እና ስልክ ወይም የልደት ቀንዎን ያስገቡ።
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs">የአባል ቁጥር *</Label>
                <Input value={memberNumber} onChange={e => setMemberNumber(e.target.value)} placeholder="MBR-0001" />
              </div>
              <div>
                <Label className="text-xs">ስልክ ቁጥር</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09..." />
              </div>
              <div>
                <Label className="text-xs">የልደት ቀን</Label>
                <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="hero" onClick={verify} disabled={verifying}>
                {verifying ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                አረጋግጥ · Verify
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              አባል አይደሉም? <Link to="/register" search={{ ref: undefined }} className="text-primary font-semibold">እዚህ ይመዝገቡ</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Member banner */}
            <div className="bg-card border rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-card-soft">
              <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                <ShieldCheck className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{member.full_name}</div>
                <div className="text-xs text-muted-foreground">Member #{memberNumber}{member.is_mor_staff ? " · MoR staff" : ""}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {eligible6mo === false && (
                  <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
                    <ShieldAlert className="size-3" /> 6 ወር አባልነት አልተሟላም
                  </Badge>
                )}
                {eligible6mo === true && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 gap-1">
                    <CheckCircle2 className="size-3" /> 6 ወር አባልነት ተሟልቷል
                  </Badge>
                )}
                {maxEligible != null && (
                  <Badge variant="outline" className="gap-1">
                    <Calculator className="size-3" /> Max: {fmt(maxEligible)} ETB
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setMember(null); setEligible6mo(null); setMaxEligible(null); }}>
                Change
              </Button>
            </div>

            {/* Loan request */}
            <section className="bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">የብድር መረጃ · Loan Details</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">የተጠየቀ መጠን (ETB) *</Label>
                  <Input type="number" value={form.requested_amount} onChange={e => setForm({ ...form, requested_amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">የመክፈያ ጊዜ (ወራት) *</Label>
                  <Input type="number" value={form.term_months} onChange={e => setForm({ ...form, term_months: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">ወርሃዊ ገቢ (ETB)</Label>
                  <Input type="number" value={form.monthly_income} onChange={e => setForm({ ...form, monthly_income: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <Label className="text-xs">የብድር ዓላማ · Purpose</Label>
                  <Textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="text-xs">የመጀመሪያ ወር</Label>
                  <Input type="date" value={form.start_month} onChange={e => setForm({ ...form, start_month: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Computed */}
            <section className="bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Calculator className="size-4 text-primary" /> Auto-calculated
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Stat label="የወለድ መጠን" value={`${(interestRate * 100).toFixed(0)}%`} />
                <Stat label="ወርሃዊ ክፍያ" value={`${fmt(computed.monthly)} ETB`} />
                <Stat label="ጠቅላላ ክፍያ" value={`${fmt(computed.total)} ETB`} />
                <Stat label="የግዴታ ቁጠባ (25%)" value={`${fmt(computed.mandatory)} ETB`} />
                <Stat label="የአገልግሎት ክፍያ (1%)" value={`${fmt(computed.svc)} ETB`} />
                <Stat label="ኢንሹራንስ" value={`${fmt(computed.ins)} ETB`} />
                <Stat label="ጠቅላላ ክፍያዎች" value={`${fmt(computed.fees)} ETB`} />
                <Stat label="ለተበዳሪ የሚተላለፍ" value={`${fmt(computed.net)} ETB`} tone="primary" />
              </div>
            </section>

            {/* Documents */}
            <section className="bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">የተጠቃሚ ሰነዶች · Documents Checklist</div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  ["doc_marriage_cert", "የጋብቻ ሰርተፊኬት"],
                  ["doc_fayda_kebele", "ፋይዳ / የቀበሌ መታወቂያ"],
                  ["doc_member_booklet", "የአባል ደብተር"],
                  ["doc_vehicle_house_title", "የተሽከርካሪ/የቤት ደብተር"],
                  ["doc_insurance", "ኢንሹራንስ"],
                  ["doc_restraint_letter", "የእገዳ ደብዳቤ"],
                  ["doc_cheque", "ቼክ"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/20 cursor-pointer">
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
            <section className="bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">ዋስትና · Collateral</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="ባለቤት" value={form.collateral_owner} on={v => setForm({ ...form, collateral_owner: v })} />
                <Field label="ዓይነት (ቤት/መኪና/...)" value={form.collateral_type} on={v => setForm({ ...form, collateral_type: v })} />
                <Field label="ሰሌዳ/ደብተር ቁጥር" value={form.collateral_plate_or_title} on={v => setForm({ ...form, collateral_plate_or_title: v })} />
                <Field label="የሞተር/ሻንሲ ቁጥር" value={form.collateral_motor_chassis} on={v => setForm({ ...form, collateral_motor_chassis: v })} />
                <div>
                  <Label className="text-xs">ግምታዊ ዋጋ (ETB)</Label>
                  <Input type="number" value={form.collateral_value} onChange={e => setForm({ ...form, collateral_value: e.target.value })} />
                </div>
              </div>
            </section>

            {/* Witnesses */}
            <section className="bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">ምስክሮች · Witnesses</div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="ምስክር 1" value={form.witness_1} on={v => setForm({ ...form, witness_1: v })} />
                <Field label="ምስክር 2" value={form.witness_2} on={v => setForm({ ...form, witness_2: v })} />
                <Field label="ምስክር 3" value={form.witness_3} on={v => setForm({ ...form, witness_3: v })} />
              </div>
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-2xl p-5 shadow-card-soft">
              <div className="text-xs text-muted-foreground">
                ማመልከቻዎ ለማህበሩ ኮሚቴ ይላካል። ውሳኔ በ7 የስራ ቀናት ውስጥ ይመለሳል።
              </div>
              <Button variant="hero" size="lg" onClick={submit} disabled={busy || eligible6mo === false}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <FileSignature className="size-4" />}
                ማመልከቻ አስገባ · Submit Application
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, on }: { label: string; value: string; on: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={e => on(e.target.value)} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "primary" ? "bg-primary/5 border-primary/30" : "bg-muted/20"}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`font-semibold ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}