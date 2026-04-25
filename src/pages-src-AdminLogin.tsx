import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLang } from "@/i18n/LanguageContext";
import { LanguageToggle } from "@/components/site/LanguageToggle";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast({ title: t.login.failed, description: error.message, variant: "destructive" }); return; }
    toast({ title: t.login.welcomeBack, description: t.login.redirect });
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-secondary text-secondary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-primary/20" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Maedot" className="h-12 w-12 object-contain bg-white rounded-xl p-1" />
            <div>
              <div className="font-display font-bold text-xl">{t.brand.shortName}</div>
              <div className="text-xs uppercase tracking-widest text-primary">Staff Control Panel</div>
            </div>
          </Link>
        </div>
        <div className="relative space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight">
            {t.brand.shortName}<br /><span className="text-primary">{t.brand.motto}</span>
          </h1>
          <p className="text-secondary-foreground/70 max-w-md">{t.brand.tagline}</p>
          <div className="flex items-center gap-2 text-sm text-secondary-foreground/60 pt-4">
            <ShieldCheck className="size-4 text-primary" /> Encrypted · Audit-logged · Role-based
          </div>
        </div>
        <Link to="/" className="relative text-xs text-secondary-foreground/70 hover:text-primary inline-flex items-center gap-1.5">
          <ArrowLeft className="size-3.5" /> {t.common.backToSite}
        </Link>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <img src={logo} alt="Maedot" className="h-10 w-10 object-contain" />
              <div className="font-display font-bold text-secondary">{t.brand.shortName}</div>
            </Link>
            <div className="ml-auto"><LanguageToggle /></div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Lock className="size-3" /> STAFF ACCESS
            </div>
            <h2 className="font-display text-3xl font-bold text-secondary">{t.login.title}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t.login.desc}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.login.email}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.login.password}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> {t.login.signingIn}</> : t.login.signIn}
            </Button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">{t.login.protected}</p>
            <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ArrowLeft className="size-3.5" /> {t.common.backToSite}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
