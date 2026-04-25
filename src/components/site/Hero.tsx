import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, LogIn, Wallet } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Hero = () => (
  <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-mesh">
    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/40" />
    <div className="container grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div className="animate-fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-medium tracking-wide">AI-Powered Cooperative Banking · Ethiopia</span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.05] mb-6 text-secondary">
          Maedot Saving &{" "}
          <span className="text-gradient-gold">Credit</span>
          <br />Cooperative
        </h1>

        <p className="font-display italic text-primary text-2xl mb-4">
          ማዕዶት — በጋራ እንሻገር
        </p>
        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Secure savings, fair credit, and modern digital banking — built for the Ethiopian community.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="hero" size="xl" asChild>
            <Link to="/register">Register Now <ArrowRight className="size-4" /></Link>
          </Button>
          <Button variant="dark" size="xl" asChild>
            <Link to="/admin/login"><LogIn className="size-4" /> Login</Link>
          </Button>
          <Button variant="outline" size="xl" asChild>
            <Link to="/register"><Wallet className="size-4" /> Apply Loan</Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> NBE-aligned security</div>
          <div className="flex items-center gap-2"><TrendingUp className="size-4 text-accent" /> Up to 12% p.a. on savings</div>
        </div>
      </div>

      <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="absolute -inset-6 bg-gradient-emerald opacity-20 blur-3xl rounded-[3rem]" />
        <div className="relative rounded-[2rem] overflow-hidden shadow-elegant border border-border/40">
          <img src={hero} alt="Ethiopian members using Maedot SACCO digital banking" width={1536} height={1024} className="w-full h-auto" />
        </div>

        <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 w-56 animate-float">
          <div className="text-xs text-muted-foreground">Total Savings</div>
          <div className="text-2xl font-display font-bold text-gradient-gold">ETB 2.4B+</div>
          <div className="text-xs text-primary mt-1">↑ 18.2% YoY</div>
        </div>
        <div className="absolute -top-6 -right-2 glass rounded-2xl p-4 w-52 animate-float" style={{ animationDelay: "1.5s" }}>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground font-bold text-sm">42K</div>
            <div>
              <div className="text-xs text-muted-foreground">Active Members</div>
              <div className="text-sm font-semibold">Across 12 branches</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
