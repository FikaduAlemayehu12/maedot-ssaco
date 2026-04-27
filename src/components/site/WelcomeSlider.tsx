import { useEffect, useState, useCallback } from "react";
import { Link } from "@/lib/router-shim";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Coins } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

import s1 from "@/assets/birr/birr-1.jpg";
import s2 from "@/assets/birr/birr-2.jpg";
import s3 from "@/assets/birr/birr-3.jpg";
import s4 from "@/assets/birr/birr-4.jpg";
import s5 from "@/assets/birr/birr-5.jpg";
import s6 from "@/assets/birr/birr-6.jpg";
import s7 from "@/assets/birr/birr-7.jpg";
import s8 from "@/assets/birr/birr-8.jpg";
import s9 from "@/assets/birr/birr-9.jpg";
import s10 from "@/assets/birr/birr-10.jpg";

type Slide = { src: string; titleEn: string; titleAm: string };

const SLIDES: Slide[] = [
  { src: s1, titleEn: "Saving builds the future", titleAm: "ቁጠባ ነገን ይገነባል" },
  { src: s2, titleEn: "Every santim counts", titleAm: "እያንዳንዱ ሳንቲም ዋጋ አለው" },
  { src: s3, titleEn: "Supporting every student", titleAm: "ለእያንዳንዱ ተማሪ ድጋፍ" },
  { src: s4, titleEn: "Rooted in our culture", titleAm: "በባሕላችን የተመሰረተ" },
  { src: s5, titleEn: "Trust, transparency, growth", titleAm: "እምነት፣ ግልጽነት፣ እድገት" },
  { src: s6, titleEn: "Watch your savings grow", titleAm: "ቁጠባዎ ሲያድግ ይመልከቱ" },
  { src: s7, titleEn: "Empowering communities", titleAm: "ማህበረሰብን ማብቃት" },
  { src: s8, titleEn: "Heritage meets prosperity", titleAm: "ቅርስና ብልጽግና" },
  { src: s9, titleEn: "Modern banking, Ethiopian roots", titleAm: "ዘመናዊ ባንክ፣ ኢትዮጵያዊ መሰረት" },
  { src: s10, titleEn: "Proudly Ethiopian", titleAm: "በኢትዮጵያዊነታችን እንኮራለን" },
];

export const WelcomeSlider = () => {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section
      id="home"
      className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-mesh"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/40" />

      <div className="container">
        {/* Centered bilingual welcome */}
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide">
              {lang === "am" ? "ማዕዶት SSACO · በኢትዮጵያ" : "Maedot SSACO · Ethiopia"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.08] mb-4 text-secondary">
            Welcome to <span className="text-gradient-gold">Maedot SSACO</span>
          </h1>
          <p className="font-display italic text-primary text-2xl sm:text-3xl mb-6">
            እንኳን ወደ ማዕዶት SSACO በደህና መጡ
          </p>

          <div className="max-w-2xl mx-auto mb-6 rounded-2xl glass p-5 text-left sm:text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-primary font-semibold mb-2">
              SSACO
            </p>
            <p className="text-base sm:text-lg text-foreground/85">
              <strong>Student Support and Community Outreach</strong>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-display">የተማሪዎች ድጋፍና ማህበረሰብ አገልግሎት</span>
            </p>
          </div>

          {/* Bilingual motto */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            <em>“Saving Today, Empowering Tomorrow — Together We Rise.”</em>
          </p>
          <p className="font-display text-lg sm:text-xl text-secondary/90 max-w-2xl mx-auto mb-8">
            “ዛሬ እንቆጥብ፣ ነገን እናብቃ — በጋራ እንሻገር።”
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                {lang === "am" ? "አሁን ተመዝገብ" : "Become a Member"} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#services">
                <Coins className="size-4" /> {lang === "am" ? "አገልግሎቶቻችን" : "Our Services"}
              </a>
            </Button>
          </div>
        </div>

        {/* Centered Slider */}
        <div
          className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden shadow-elegant border border-border/50 bg-secondary"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[16/9]">
            {SLIDES.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-hidden={i !== index}
              >
                <img
                  src={s.src}
                  alt={lang === "am" ? s.titleAm : s.titleEn}
                  width={1600}
                  height={1024}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`w-full h-full object-cover ${i === index ? "scale-105" : "scale-100"} transition-transform duration-[6000ms] ease-out`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-secondary-foreground">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur border border-primary/40 mb-3">
                    <Coins className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
                      Ethiopian Birr · ብር
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight">
                    {lang === "am" ? s.titleAm : s.titleEn}
                  </h3>
                  <p className="font-display italic text-primary mt-1 text-sm sm:text-base">
                    {lang === "am" ? s.titleEn : s.titleAm}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-secondary-foreground/10 backdrop-blur border border-secondary-foreground/20 grid place-items-center text-secondary-foreground hover:bg-primary hover:border-primary transition-all"
          >
            <ChevronRight className="size-5" />
          </button>

        </div>
      </div>
    </section>
  );
};