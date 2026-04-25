import { useLang } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

interface Props {
  variant?: "light" | "dark";
  className?: string;
}

export const LanguageToggle = ({ variant = "dark", className = "" }: Props) => {
  const { lang, setLang } = useLang();
  const base =
    variant === "light"
      ? "bg-white/10 border-white/20 text-secondary-foreground hover:bg-white/20"
      : "bg-card border-border text-foreground hover:bg-muted";
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border p-1 ${base} ${className}`}
      role="group"
      aria-label="Language"
    >
      <Globe className="size-3.5 ml-1.5 opacity-60" />
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
          lang === "en" ? "bg-primary text-primary-foreground" : "opacity-70 hover:opacity-100"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("am")}
        className={`px-3 py-1 text-xs font-bold rounded-full font-ethiopic transition-colors ${
          lang === "am" ? "bg-primary text-primary-foreground" : "opacity-70 hover:opacity-100"
        }`}
        aria-pressed={lang === "am"}
      >
        አማ
      </button>
    </div>
  );
};
