const stats = [
  { value: "42,000+", label: "Active Members", sub: "Across Ethiopia" },
  { value: "ETB 2.4B", label: "Total Savings", sub: "Held & growing" },
  { value: "12", label: "Branch Network", sub: "Nationwide reach" },
  { value: "98.6%", label: "Loan Recovery", sub: "Industry-leading" },
];

export const Stats = () => (
  <section className="py-20 lg:py-24 bg-gradient-hero text-primary-foreground relative overflow-hidden">
    <div className="absolute inset-0 bg-mesh opacity-40" />
    <div className="container relative">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {stats.map((s) => (
          <div key={s.label} className="text-center lg:text-left">
            <div className="text-4xl lg:text-6xl font-display font-bold text-gradient-gold mb-2">{s.value}</div>
            <div className="text-base font-semibold">{s.label}</div>
            <div className="text-sm text-primary-foreground/70">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
