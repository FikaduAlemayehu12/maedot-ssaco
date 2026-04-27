import { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/router-shim";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, LogIn, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

import maedotWelcome from "@/assets/slides/maedot-welcome.png";
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
    image: maedotWelcome,
    eyebrow: "Welcome · እንኳን ደህና መጡ",
    title: <>Welcome to <span className="text-gradient-gold">Maedot SSACCO</span></>,
    subtitle: "Saving and Credit Cooperative Society — Your Saving, Their Future.",
    amharic: "ማዕዶት ንንዘብ ቁጠባና ብድር መሰረታዊ የኅብረት ሥራ ማኅበር",
  },
  {
    image: slide2,
    eyebrow: "Savings · ቁጠባ",
    title: <>Save smart. <span className="text-gradient-gold">Grow stronger.</span></>,
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
    title: <>Owned by members, <span className="text-gradient-gold">built for community.</span></>,
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
    title: <>Rooted in Ethiopia, <span className="text-gradient-gold">growing with you.</span></>,
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
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const current = slides[index];

  return (
    <section
      id="home"
      className="relative min-h-[100svh] w-full overflow-hidden bg-secondary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 container pt-28 pb-16 sm:pt-32 sm:pb-20 min-h-[100svh] flex flex-col items-center justify-center text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 backdrop-blur border border-primary/30 mb-6 animate-fade-up">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-semibold tracking-wide text-primary">{current.eyebrow}</span>
        </div>

        {/* Centered hero image */}
        <div className="relative mx-auto mb-8 w-full max-w-2xl animate-fade-up">
          <div className="relative mx-auto aspect-square sm:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-elegant border border-primary/20 bg-secondary-foreground/5 flex items-center justify-center">
            {slides.map((s, i) => (
              <img
                key={i}
                src={s.image}
                alt=""
                width={1200}
                height={1200}
                loading={i === 0 ? "eager" : "lazy"}
                className={`absolute inset-0 m-auto w-full h-full object-contain object-center transition-opacity duration-1000 ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={i !== index}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Controls */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Centered text */}
        <div className="max-w-3xl text-secondary-foreground animate-fade-up">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.08] mb-4">
            {current.title}
          </h1>
          <p className="font-display italic text-primary text-lg sm:text-2xl mb-3">{current.amharic}</p>
          <p className="text-base sm:text-lg text-secondary-foreground/85 max-w-2xl mx-auto mb-8">
            {current.subtitle}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
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

          <div className="mt-8 flex items-center justify-center gap-5 text-sm text-secondary-foreground/70">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> NBE-aligned</div>
            <a href={`tel:${settings.phone}`} className="hover:text-primary font-semibold">📞 {settings.phone}</a>
          </div>
        </div>
      </div>
    </section>
  );
};
