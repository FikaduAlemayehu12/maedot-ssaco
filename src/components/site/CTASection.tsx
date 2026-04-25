import { Button } from "@/components/ui/button";
import { Apple, Download, Smartphone } from "lucide-react";

export const CTASection = () => (
  <section id="contact" className="py-24 lg:py-32">
    <div className="container">
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-hero text-primary-foreground p-10 lg:p-20 shadow-elegant">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="absolute -right-20 -bottom-20 size-96 rounded-full bg-gradient-gold opacity-20 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl lg:text-6xl font-display font-bold leading-tight mb-5">
              Your future bank, <br />in your pocket.
            </h2>
            <p className="text-primary-foreground/85 text-lg mb-8 max-w-lg">
              Download the Maedot SACCO app and join 42,000+ Ethiopians saving, borrowing and building together.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="gold" size="xl">
                <Apple className="size-5" /> App Store
              </Button>
              <Button variant="glass" size="xl">
                <Download className="size-5" /> Google Play
              </Button>
            </div>

            <div className="mt-10 pt-8 border-t border-primary-foreground/20 grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-primary-foreground/60 mb-1">Call us 24/7</div>
                <a href="tel:0903373727" className="text-2xl font-display font-bold">0903 37 37 27</a>
              </div>
              <div>
                <div className="text-sm text-primary-foreground/60 mb-1">Headquarters</div>
                <div className="font-semibold">Addis Ababa, Ethiopia</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-gold opacity-30 blur-3xl rounded-full" />
            <div className="relative mx-auto w-72 h-[560px] rounded-[3rem] bg-gradient-to-b from-secondary to-primary border-[10px] border-foreground/10 shadow-elegant overflow-hidden">
              <div className="p-6 text-primary-foreground">
                <div className="text-xs opacity-70">Good morning</div>
                <div className="font-display text-xl font-bold mb-6">Selam, Hanna 👋</div>

                <div className="rounded-2xl bg-primary-foreground/10 backdrop-blur p-5 mb-4">
                  <div className="text-xs opacity-70">Total Balance</div>
                  <div className="font-display text-3xl font-bold text-gradient-gold">ETB 248,920</div>
                  <div className="text-xs opacity-70 mt-1">+ 12.4% this month</div>
                </div>

                {["Telebirr deposit", "Loan EMI paid", "Equb dividend"].map((t, i) => (
                  <div key={t} className="flex justify-between items-center py-3 border-b border-primary-foreground/10 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gradient-gold grid place-items-center text-accent-foreground">
                        <Smartphone className="size-4" />
                      </div>
                      {t}
                    </div>
                    <span className="font-semibold">+ {(i + 1) * 1240}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
