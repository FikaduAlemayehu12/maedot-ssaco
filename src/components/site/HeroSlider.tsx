import { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/router-shim";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, LogIn, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import slide1 from "@/assets/slides/welcome.jpg";
import slide2 from "@/assets/slides/savings.jpg";
import slide3 from "@/assets/slides/credit.jpg";
import slide4 from "@/assets/slides/community.jpg";
import slide5 from "@/assets/slides/mobile.jpg";
import slide6 from "@/assets/slides/family.jpg";
import slide7 from "@/assets/slides/business.jpg";
import slide8 from "@/assets/slides/agriculture.jpg";
import slide9 from "@/assets/slides/education.jpg";
import slide10 from "@/assets/slides/trust.jpg";

type Slide = {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  amharic: string;
};

const slides: Slide[] = [
  {
    image: slide1,
    eyebrow: "Welcome · እንኳን ደህና መጡ",
    title: <>Welcome to <span className="text-gradient-gold">Maedot</span><br />Transforming Together</>,
    subtitle: "Ethiopia's modern saving & credit cooperative — built on trust, powered by technology.",
    amharic: "ማዕዶት — በጋራ እንሻገር",
  },
  {
    image: slide2,
    eyebrow: "Savings · ቁጠባ",
    title: <>Save smart.<br /><span className="text-gradient-gold">Grow stronger.</span></>,
    subtitle: "Up to 12% annual returns on your savings, with full transparency and member dividends.",
    amharic: "ቁጠባዎ — ብልጥ ምርጫ",
  },
  {
    image: slide3,
    eyebrow: "Credit · ብድር",
    title: <>Fair credit for <span className="text-gradient-gold">every farmer.</span></>,
    subtitle: "AI-powered loan scoring that gives Ethiopian entrepreneurs the capital to grow their dreams.",
    amharic: "ለሁሉም ኢትዮጵያዊ ፍትሐዊ ብድር",
  },
  {
    image: slide4,
    eyebrow: "Community · ማህበረሰብ",
    title: <>Owned by members,<br /><span className="text-gradient-gold">built for community.</span></>,
    subtitle: "A cooperative where every member is an owner — your prosperity is our purpose.",
    amharic: "የማህበረሰብ ባንክ",
  },
  {
    image: slide5,
    eyebrow: "Digital · ዲጂታል",
    title: <>Banking in your <span className="text-gradient-gold">pocket.</span></>,
    subtitle: "Telebirr, CBE Birr and Chapa integrations — pay, save and transfer in seconds.",
    amharic: "ሞባይል ባንኪንግ",
  },
  {
    image: slide6,
    eyebrow: "Family · ቤተሰብ",
    title: <>Build a <span className="text-gradient-gold">legacy</span> for your family.</>,
    subtitle: "Junior savings, heir nomination and family financial planning — all under one roof.",
    amharic: "ለቤተሰብዎ ቅርስ ይገንቡ",
  },
  {
    image: slide7,
    eyebrow: "Enterprise · የንግድ ሥራ",
    title: <>Empowering <span className="text-gradient-gold">small businesses.</span></>,
    subtitle: "From your first machine to your tenth employee — Maedot grows with your enterprise.",
    amharic: "የንግድ ሥራ ብድር",
  },
  {
    image: slide8,
    eyebrow: "Agriculture · ግብርና",
    title: <>Rooted in Ethiopia,<br /><span className="text-gradient-gold">growing with you.</span></>,
    subtitle: "Seasonal harvest loans, equipment finance and crop insurance for Ethiopian farmers.",
    amharic: "ለግብርና የተዘጋጀ የገንዘብ መፍትሄ",
  },
  {
    image: slide9,
    eyebrow: "Education · ትምህርት",
    title: <>Invest in the <span className="text-gradient-gold">next generation.</span></>,
    subtitle: "Education savings plans and student loans that open doors for Ethiopian youth.",
    amharic: "የትምህርት ቁጠባ ዕቅድ",
  },
  {
    image: slide10,
    eyebrow: "Trust · እምነት",
    title: <>Banking with <span className="text-gradient-gold">trust.</span></>,
    subtitle: "Decades of cooperative integrity. Members' savings safeguarded, members' voices heard.",
    amharic: "በእምነት ላይ የተመሰረተ",
  },
];

export const HeroSlider = () => {
  const { settings } = useSiteSettings();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 6500);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section
      id="home"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-secondary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          aria-hidden={i !== index}
        >
          <img
            src={s.image}
            alt=""
            width={1920}
            height={1080}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 w-full h-full object-cover ${i === index ? "scale-105" : "scale-100"} transition-transform duration-[8000ms] ease-out`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full container flex flex-col justify-center pt-28 pb-24 sm:pt-32 sm:pb-28">
        <div className="max-w-2xl text-secondary-foreground text-left">
          {slides.map((s, i) => (
            <div
              key={i}
              className={`transition-all duration-700 ${i === index ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 absolute pointer-events-none"}`}
            >
              {i === index && (
                <>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 backdrop-blur border border-primary/30 mb-5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-xs font-semibold tracking-wide text-primary">{s.eyebrow}</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold leading-[1.05] mb-5">
                    {s.title}
                  </h1>
                  <p className="font-display italic text-primary text-lg sm:text-xl mb-3">{s.amharic}</p>
                  <p className="text-base sm:text-lg text-secondary-foreground/85 max-w-xl mb-8">{s.subtitle}</p>
                </>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">Register Now <ArrowRight className="size-4" /></Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/admin/login"><LogIn className="size-4" /> Login</Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="bg-transparent text-secondary-foreground border-secondary-foreground/40 hover:bg-secondary-foreground/10 hover:text-secondary-foreground">
              <Link to="/register"><Wallet className="size-4" /> Apply Loan</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-5 text-sm text-secondary-foreground/70">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> NBE-aligned</div>
            <a href={`tel:${settings.phone}`} className="hover:text-primary font-semibold">📞 {settings.phone}</a>
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 size-12 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-6 lg:right-10 z-20 font-display text-secondary-foreground/70 text-sm">
        <span className="text-primary text-lg font-bold">{String(index + 1).padStart(2, "0")}</span>
        <span className="mx-1">/</span>
        {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
};
