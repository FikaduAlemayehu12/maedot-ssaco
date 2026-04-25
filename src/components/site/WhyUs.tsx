import { CheckCircle2 } from "lucide-react";

const points = [
  { title: "Cooperative-owned, member-first", desc: "Every member is an owner. Profits return to you as dividends and lower loan rates." },
  { title: "AI loan risk scoring", desc: "Faster, fairer credit decisions powered by responsible AI — built for Ethiopian realities." },
  { title: "Bank-grade security", desc: "End-to-end encryption, OTP, biometric login, and full audit trails on every action." },
  { title: "Multi-language", desc: "English, አማርኛ, Afaan Oromoo and ትግርኛ — banking in the language you live in." },
  { title: "Ethiopian + Gregorian calendars", desc: "Loan schedules, statements and notifications respect both calendar systems." },
  { title: "Telebirr, CBE Birr & Chapa", desc: "Pay, deposit and transfer instantly through the wallets you already use." },
];

export const WhyUs = () => (
  <section id="why" className="py-24 lg:py-32 bg-muted/30">
    <div className="container grid lg:grid-cols-2 gap-16 items-start">
      <div className="lg:sticky lg:top-32">
        <div className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Why Maedot</div>
        <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
          A modern bank with the <span className="text-gradient-gold">soul of a cooperative</span>.
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          For over a decade, Maedot has helped Ethiopian families, farmers and entrepreneurs build wealth — together. Now we're bringing that same trust into a beautiful, secure digital experience.
        </p>
        <div className="glass rounded-2xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Member Support · 24/7</div>
          <a href="tel:0903373727" className="text-3xl font-display font-bold text-gradient-emerald">0903 37 37 27</a>
        </div>
      </div>

      <div className="space-y-4">
        {points.map((p, i) => (
          <div key={p.title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex gap-4">
              <CheckCircle2 className="size-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
