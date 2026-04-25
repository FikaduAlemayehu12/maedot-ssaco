import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLang } from "@/i18n/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.services, href: "#services" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.whyUs, href: "#why" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container flex items-center justify-between gap-4">
        <a href="#home" className="flex items-center gap-2.5 min-w-0">
          <img src={logo} alt="Maedot SACCO logo" width={44} height={44} className="h-11 w-11 object-contain shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="font-display font-bold text-base sm:text-lg text-secondary truncate">{t.brand.shortName}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold truncate">{t.brand.motto}</div>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/75 hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <LanguageToggle />
          <Button variant="hero" size="sm" asChild>
            <Link to="/register"><ShieldCheck className="size-4" /> {t.nav.openAccount}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass mx-4 mt-3 rounded-2xl p-6 space-y-4 animate-fade-up">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-foreground/80 font-medium">
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-border">
            <Button variant="hero" size="sm" className="w-full" asChild>
              <Link to="/register" onClick={() => setOpen(false)}>{t.nav.openAccount}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
