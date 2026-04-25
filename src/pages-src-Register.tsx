import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Copy, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { LivePhotoCapture } from "@/components/registration/LivePhotoCapture";
import { IdUpload } from "@/components/registration/IdUpload";
import { SignaturePad } from "@/components/registration/SignaturePad";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLang } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/components/site/LanguageToggle";

const personalSchema = z.object({
  full_name: z.string().trim().min(2).max(200),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.string().min(1),
  nationality: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(255),
  marital_status: z.string().optional(),
  education: z.string().optional(),
  mothers_name: z.string().trim().max(200).optional().or(z.literal("")),
});
const idSchema = z.object({
  id_type: z.string().min(1),
  id_number: z.string().trim().min(3).max(50),
  tin_number: z.string().trim().max(50).optional().or(z.literal("")),
});
const accountSchema = z.object({
  occupation: z.string().trim().max(100).optional().or(z.literal("")),
  monthly_income: z.string().optional(),
  annual_income: z.string().optional(),
  account_type: z.enum(["saving", "cheque", "mobile_wallet"]),
  branch: z.string().optional(),
});

type Result = { customer_number?: string | null; account_number?: string | null };
type FormData = Record<string, string>;

const Register = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { t } = useLang();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [data, setData] = useState<FormData>({ nationality: "Ethiopian", referral_code: searchParams.get("ref") || "" });

  const [livePhoto, setLivePhoto] = useState<string>("");
  const [optionalPhoto, setOptionalPhoto] = useState<File | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [optPhotoUrl, setOptPhotoUrl] = useState<string | null>(null);
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);

  useEffect(() => {
    setOptPhotoUrl(optionalPhoto ? URL.createObjectURL(optionalPhoto) : null);
    return () => { if (optPhotoUrl) URL.revokeObjectURL(optPhotoUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionalPhoto]);
  useEffect(() => {
    setIdFrontUrl(idFront ? URL.createObjectURL(idFront) : null);
    return () => { if (idFrontUrl) URL.revokeObjectURL(idFrontUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFront]);
  useEffect(() => {
    setIdBackUrl(idBack ? URL.createObjectURL(idBack) : null);
    return () => { if (idBackUrl) URL.revokeObjectURL(idBackUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idBack]);

  const update = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, body] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const uploadFile = async (bucket: string, path: string, file: Blob): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return path;
  };

  const submit = async () => {
    const p = personalSchema.safeParse(data);
    if (!p.success) { toast({ title: t.reg.validatePersonal, description: p.error.issues[0]?.message, variant: "destructive" }); return; }
    const i = idSchema.safeParse(data);
    if (!i.success) { toast({ title: t.reg.validateID, description: i.error.issues[0]?.message, variant: "destructive" }); return; }
    const a = accountSchema.safeParse(data);
    if (!a.success) { toast({ title: t.reg.validateAccount, variant: "destructive" }); return; }
    if (!idFront || !idBack) { toast({ title: t.reg.validateID_images, variant: "destructive" }); return; }

    setLoading(true);
    try {
      const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let livePath: string | null = null;
      if (livePhoto) {
        const liveBlob = dataUrlToBlob(livePhoto);
        livePath = await uploadFile("member-photos", `${folder}/live.jpg`, liveBlob);
      }
      const idFrontPath = await uploadFile("member-ids", `${folder}/id-front-${idFront.name}`, idFront);
      const idBackPath = await uploadFile("member-ids", `${folder}/id-back-${idBack.name}`, idBack);
      let optPath: string | null = null;
      if (optionalPhoto) {
        optPath = await uploadFile("member-photos", `${folder}/optional-${optionalPhoto.name}`, optionalPhoto);
      }

      const registrationPayload: Record<string, any> = {
          full_name: data.full_name,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          nationality: data.nationality,
          region: data.region,
          phone: data.phone,
          email: data.email,
          marital_status: data.marital_status || null,
          education: data.education || null,
          mothers_name: data.mothers_name || null,
          id_type: data.id_type,
          id_number: data.id_number,
          tin_number: data.tin_number || null,
          monthly_income: data.monthly_income ? Number(data.monthly_income) : null,
          annual_income: data.annual_income ? Number(data.annual_income) : null,
          occupation: data.occupation || null,
          account_type: data.account_type as TablesInsert<"registrations">["account_type"],
          branch: data.branch || null,
          heir_full_name: data.heir_full_name || null,
          heir_phone: data.heir_phone || null,
          heir_relationship: data.heir_relationship || null,
          heir2_full_name: data.heir2_full_name || null,
          heir2_phone: data.heir2_phone || null,
          heir2_relationship: data.heir2_relationship || null,
          witness_1: data.witness_1 || null,
          witness_2: data.witness_2 || null,
          witness_3: data.witness_3 || null,
          referral_code: data.referral_code?.trim() ? data.referral_code.trim().toUpperCase() : null,
          live_photo_url: livePath,
          optional_photo_url: optPath,
          id_front_url: idFrontPath,
          id_back_url: idBackPath,
          signature_data_url: signature || null,
        };

      const { data: rpcData, error } = await supabase
        .rpc("submit_registration", { payload: registrationPayload });

      if (error) throw error;
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      setResult({
        customer_number: row?.customer_number ?? null,
        account_number: row?.account_number ?? null,
      });
      toast({ title: t.reg.submittedTitle, description: t.reg.submittedDesc });
    } catch (e: any) {
      toast({ title: t.reg.failedTitle, description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-mesh grid place-items-center px-4 py-10">
        <div className="max-w-lg w-full bg-card border rounded-2xl p-8 shadow-elegant text-center animate-fade-up">
          <div className="size-16 rounded-full bg-gradient-to-r from-primary to-primary-glow grid place-items-center mx-auto mb-4">
            <CheckCircle2 className="size-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{t.reg.successTitle}</h1>
          <p className="text-muted-foreground mb-6">{t.reg.successMsg}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl border bg-muted/50 p-4 text-left">
              <div className="text-xs text-muted-foreground">{t.reg.customerNumber}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="font-display text-xl font-bold text-primary">{result.customer_number}</div>
                <button onClick={() => result.customer_number && navigator.clipboard.writeText(result.customer_number)} className="p-1 hover:text-primary"><Copy className="size-4" /></button>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/50 p-4 text-left">
              <div className="text-xs text-muted-foreground">{t.reg.accountNumber}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="font-display text-xl font-bold text-secondary">{result.account_number}</div>
                <button onClick={() => result.account_number && navigator.clipboard.writeText(result.account_number)} className="p-1 hover:text-primary"><Copy className="size-4" /></button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t.reg.saveNumbers}</p>
          <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/")}>{t.reg.backHome}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4 gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img src={settings.logo_url || logo} alt="Maedot SACCO" className="h-10 w-10 object-contain shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="font-display font-bold text-base sm:text-lg text-secondary truncate">{t.brand.shortName}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold truncate">{t.common.register} · {t.brand.motto}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">{t.common.back}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-secondary">{t.reg.title}</h1>
          <p className="text-primary italic font-display mt-1">{t.brand.shortName} — {t.brand.motto}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.reg.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Personal */}
          <Section title={t.reg.sec_personal}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t.reg.f_full_name} name="full_name" value={data.full_name} onChange={update} required />
              <Field label={t.reg.f_mothers_name} name="mothers_name" value={data.mothers_name} onChange={update} />
              <Field label={t.reg.f_email} name="email" type="email" value={data.email} onChange={update} required />
              <Field label={t.reg.f_phone} name="phone" type="tel" value={data.phone} onChange={update} placeholder="+251..." required />
              <Field label={t.reg.f_dob} name="date_of_birth" type="date" value={data.date_of_birth} onChange={update} required />
              <SelectField label={t.reg.f_gender} name="gender" value={data.gender} onChange={update} options={[["male", t.reg.g_male], ["female", t.reg.g_female], ["other", t.reg.g_other]]} required />
              <SelectField label={t.reg.f_marital} name="marital_status" value={data.marital_status} onChange={update} options={[["single", t.reg.m_single], ["married", t.reg.m_married], ["divorced", t.reg.m_divorced], ["widowed", t.reg.m_widowed]]} />
              <SelectField label={t.reg.f_education} name="education" value={data.education} onChange={update} options={[["primary", t.reg.e_primary], ["secondary", t.reg.e_secondary], ["diploma", t.reg.e_diploma], ["bachelor", t.reg.e_bachelor], ["master", t.reg.e_master], ["phd", t.reg.e_phd], ["other", t.reg.e_other]]} />
              <Field label={t.reg.f_nationality} name="nationality" value={data.nationality} onChange={update} required />
              <Field label={t.reg.f_region} name="region" value={data.region} onChange={update} required />
            </div>
          </Section>

          {/* ID */}
          <Section title={t.reg.sec_id}>
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label={t.reg.f_id_type} name="id_type" value={data.id_type} onChange={update} options={[["national_id", t.reg.it_national_id], ["passport", t.reg.it_passport], ["driver_license", t.reg.it_driver_license], ["kebele_id", t.reg.it_kebele_id]]} required />
              <Field label={t.reg.f_id_number} name="id_number" value={data.id_number} onChange={update} required />
              <Field label={t.reg.f_tin} name="tin_number" value={data.tin_number} onChange={update} />
            </div>
          </Section>

          {/* Account */}
          <Section title={t.reg.sec_account}>
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label={t.reg.f_account_type} name="account_type" value={data.account_type} onChange={update} options={[["saving", t.reg.at_saving], ["cheque", t.reg.at_cheque], ["mobile_wallet", t.reg.at_mobile_wallet]]} required />
              <Field label={t.reg.f_branch} name="branch" value={data.branch} onChange={update} placeholder="Addis Ababa" />
              <Field label={t.reg.f_occupation} name="occupation" value={data.occupation} onChange={update} />
              <Field label={t.reg.f_monthly} name="monthly_income" type="number" value={data.monthly_income} onChange={update} />
              <Field label={t.reg.f_annual} name="annual_income" type="number" value={data.annual_income} onChange={update} />
              <Field label={t.reg.f_referral} name="referral_code" value={data.referral_code} onChange={(k, v) => update(k, v.toUpperCase())} placeholder="MAE-XXXXXXX" />
            </div>
          </Section>

          {/* Heirs & Witnesses */}
          <Section title={t.reg.sec_heirs}>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label={t.reg.f_heir1_name} name="heir_full_name" value={data.heir_full_name} onChange={update} />
              <Field label={t.reg.f_heir1_phone} name="heir_phone" type="tel" value={data.heir_phone} onChange={update} />
              <Field label={t.reg.f_heir1_rel} name="heir_relationship" value={data.heir_relationship} onChange={update} />
              <Field label={t.reg.f_heir2_name} name="heir2_full_name" value={data.heir2_full_name} onChange={update} />
              <Field label={t.reg.f_heir2_phone} name="heir2_phone" type="tel" value={data.heir2_phone} onChange={update} />
              <Field label={t.reg.f_heir2_rel} name="heir2_relationship" value={data.heir2_relationship} onChange={update} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
              <Field label={t.reg.f_witness1} name="witness_1" value={data.witness_1} onChange={update} />
              <Field label={t.reg.f_witness2} name="witness_2" value={data.witness_2} onChange={update} />
              <Field label={t.reg.f_witness3} name="witness_3" value={data.witness_3} onChange={update} />
            </div>
          </Section>

          {/* Photo & Documents */}
          <Section title={t.reg.sec_docs}>
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold mb-2">{t.reg.photoLive}</div>
                <p className="text-xs text-muted-foreground mb-3">{t.reg.photoLiveHelp}</p>
                <LivePhotoCapture capturedUrl={livePhoto || null} onCapture={(d) => setLivePhoto(d)} />
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-semibold mb-1">{t.reg.idBoth} <span className="text-primary">*</span></div>
                <p className="text-xs text-muted-foreground mb-3">{t.reg.idBothHelp}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IdUpload label={t.reg.idFront} file={idFront} previewUrl={idFrontUrl} onChange={setIdFront} />
                  <IdUpload label={t.reg.idBack} file={idBack} previewUrl={idBackUrl} onChange={setIdBack} />
                </div>
              </div>
              <div className="pt-4 border-t">
                <IdUpload label={t.reg.optionalPhoto} file={optionalPhoto} previewUrl={optPhotoUrl} onChange={setOptionalPhoto} />
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-semibold mb-1">{t.reg.signature}</div>
                <p className="text-xs text-muted-foreground mb-3">{t.reg.signatureHelp}</p>
                <SignaturePad value={signature} onChange={setSignature} />
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-card-soft">
            <p className="text-xs text-muted-foreground mb-4">{t.reg.submitConsent}</p>
            <Button type="button" variant="hero" size="lg" onClick={submit} disabled={loading} className="w-full sm:w-auto">
              {loading ? <><Loader2 className="size-4 animate-spin" /> {t.common.submitting}</> : <>{t.reg.submitBtn} <CheckCircle2 className="size-4" /></>}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">{t.brand.shortName} · {settings.phone}</p>
      </main>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-card border rounded-2xl p-6 sm:p-8 shadow-card-soft">
    <h2 className="font-display text-xl font-bold text-secondary mb-4">{title}</h2>
    {children}
  </section>
);

const Field = ({ label, name, type = "text", required, value, onChange, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; value?: string; onChange: (k: string, v: string) => void; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={name} className="text-sm">{label}{required && <span className="text-primary"> *</span>}</Label>
    <Input id={name} name={name} type={type} required={required} value={value || ""} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} />
  </div>
);

const SelectField = ({ label, name, options, required, value, onChange }: {
  label: string; name: string; options: [string, string][]; required?: boolean; value?: string; onChange: (k: string, v: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={name} className="text-sm">{label}{required && <span className="text-primary"> *</span>}</Label>
    <Select value={value || ""} onValueChange={(v) => onChange(name, v)}>
      <SelectTrigger id={name}><SelectValue placeholder="..." /></SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export default Register;
