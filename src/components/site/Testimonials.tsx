import { Star } from "lucide-react";

const items = [
  { name: "Hanna Mekonnen", role: "Café owner, Addis Ababa", quote: "Maedot funded my second branch in two weeks. The mobile app makes daily deposits effortless." },
  { name: "Dawit Tadesse", role: "Coffee farmer, Sidama", quote: "I got a fair harvest loan without traveling to the city. The Afaan Oromoo support changed everything." },
  { name: "Selamawit Girma", role: "Teacher & saver", quote: "Watching my Equb savings grow with monthly dividends feels like the cooperative truly works for me." },
];

export const Testimonials = () => (
  <section className="py-24 lg:py-32">
    <div className="container">
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Voices of our members</div>
        <h2 className="text-4xl lg:text-5xl font-display font-bold">
          Trusted by <span className="text-gradient-emerald">Ethiopians</span> who build their future every day.
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <figure key={t.name} className="rounded-2xl border border-border bg-card p-7 shadow-card-soft hover:shadow-elegant transition-all">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="size-4 fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="text-foreground/90 leading-relaxed mb-6">"{t.quote}"</blockquote>
            <figcaption className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-gradient-emerald grid place-items-center text-primary-foreground font-display font-bold">
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);
