import { PiggyBank, Banknote, Smartphone, Users, ShieldCheck, LineChart } from "lucide-react";

const services = [
  { icon: PiggyBank, title: "Savings Accounts", desc: "Regular, fixed and youth savings with competitive returns up to 12% per annum.", color: "from-primary/20 to-primary/5" },
  { icon: Banknote, title: "Smart Loans", desc: "Business, agriculture, education and emergency loans with AI-powered fair scoring.", color: "from-accent/25 to-accent/5" },
  { icon: Smartphone, title: "Mobile Wallet", desc: "Telebirr, CBE Birr and Chapa integrations — pay, save and transfer anywhere.", color: "from-secondary/20 to-secondary/5" },
  { icon: Users, title: "Group Cooperatives", desc: "Iddir, Equb and women's cooperative accounts to grow together as a community.", color: "from-primary/20 to-accent/10" },
  { icon: ShieldCheck, title: "Insurance & Heir", desc: "Heir nomination, life cover and account protection built into every membership.", color: "from-secondary/20 to-primary/10" },
  { icon: LineChart, title: "Wealth Advisory", desc: "Personalized financial planning powered by data and human cooperative values.", color: "from-accent/20 to-primary/10" },
];

export const Services = () => (
  <section id="services" className="py-24 lg:py-32">
    <div className="container">
      <div className="max-w-2xl mb-16">
        <div className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Services</div>
        <h2 className="text-4xl lg:text-5xl font-display font-bold mb-4">
          Banking that grows <span className="text-gradient-emerald">with you</span>.
        </h2>
        <p className="text-muted-foreground text-lg">
          From your first ETB saved to your largest business loan — every Maedot product is built around cooperative values and modern technology.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div key={s.title} className="group relative rounded-2xl border border-border bg-card p-7 hover:shadow-elegant transition-all duration-500 hover:-translate-y-1">
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative">
              <div className="size-12 rounded-xl bg-gradient-emerald grid place-items-center text-primary-foreground mb-5 shadow-card-soft">
                <s.icon className="size-6" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
