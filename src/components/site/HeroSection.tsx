import { Link } from "@/lib/router-shim";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ClipboardCheck,
  FileImage,
  PenLine,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const HeroSection = () => {
  const { t } = useLang();
  const { settings } = useSiteSettings();

  const steps = [
    { icon: PenLine, title: t.steps.s1Title, desc: t.steps.s1Desc },
    { icon: FileImage, title: t.steps.s2Title, desc: t.steps.s2Desc },
    { icon: ClipboardCheck, title: t.steps.s3Title, desc: t.steps.s3Desc },
    { icon: UserCheck, title: t.steps.s4Title, desc: t.steps.s4Desc },
  ];

  return (
    <section id="home" className="relative min-h-screen flex flex-col bg-mesh overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/40" />
      <div className="absolute top-1/4 -left-40 size-[28rem] rounded-full bg-primary/15 blur-3xl -z-10" />
      <div className="absolute bottom-0 -right-40 size-[34rem] rounded-full bg-accent/15 blur-3xl -z-10" />

      <div className="container flex-1 flex flex-col items-center justify-center text-center pt-32 pb-12 sm:pt-36 sm:pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-up">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide">{t.brand.tagline}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.05] mb-5 max-w-4xl text-secondary animate-fade-up">
          {t.hero.title.split(" ").slice(0, -1).join(" ")} <span className="text-gradient-gold">{t.hero.title.split(" ").slice(-1)}</span>
        </h1>
        <p className="font-display italic text-primary text-xl sm:text-2xl mb-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
          {t.brand.motto}
        </p>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {t.hero.subtitle}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <Button variant="hero" size="xl" asChild>
            <Link to="/register">{t.hero.registerNow} <ArrowRight className="size-4" /></Link>
          </Button>
          <Button variant="outline" size="xl" asChild>
            <Link to="/apply-loan">{t.hero.applyLoan}</Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> NBE-aligned</div>
          <div className="flex items-center gap-2"><TrendingUp className="size-4 text-accent" /> Up to 12% p.a.</div>
          <a href={`tel:${settings.phone}`} className="font-semibold text-primary hover:underline">📞 {settings.phone}</a>
        </div>
      </div>

      {/* Step flow */}
      <div className="container pb-16 sm:pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-secondary mb-2">{t.steps.title}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">{t.steps.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative bg-card border rounded-2xl p-6 shadow-card-soft hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute -top-4 left-6 size-10 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground font-display font-bold shadow-gold">
                {i + 1}
              </div>
              <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary mb-4 mt-2">
                <s.icon className="size-6" />
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="hero" size="lg" asChild>
            <Link to="/register">{t.steps.cta} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
