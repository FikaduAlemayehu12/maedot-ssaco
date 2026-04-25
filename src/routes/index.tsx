import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import logoImg from "@/assets/logo.png";
import savingsImg from "@/assets/slides/savings.jpg";
import creditImg from "@/assets/slides/credit.jpg";
import mobileImg from "@/assets/slides/mobile.jpg";
import communityImg from "@/assets/slides/community.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Maedot Digital Hub — Save, Borrow, Grow" },
      {
        name: "description",
        content:
          "Maedot Digital Hub — open an account online, save securely, access credit, and grow with our community-focused financial services.",
      },
      { property: "og:title", content: "Maedot Digital Hub" },
      { property: "og:description", content: "Save, borrow, and grow with Maedot." },
      { property: "og:image", content: heroImg },
    ],
  }),
});

const services = [
  { title: "Savings Accounts", desc: "Flexible saving and cheque accounts to grow your money safely.", img: savingsImg },
  { title: "Credit & Loans", desc: "Fair credit options designed around your needs and capacity.", img: creditImg },
  { title: "Mobile Wallet", desc: "Send, receive and pay from your phone — anywhere, anytime.", img: mobileImg },
  { title: "Community Banking", desc: "Built around our members, supporting families and small businesses.", img: communityImg },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Maedot logo" className="h-10 w-10 rounded" />
            <span className="text-lg font-semibold">Maedot Digital Hub</span>
          </div>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Maedot community" className="h-[60vh] w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col items-start justify-center px-6 text-white">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Save. Borrow. Grow with Maedot.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Open an account online in minutes and access modern, community-focused
            financial services built for you.
          </p>
          <a
            href="/register"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Open an Account
          </a>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">Our Services</h2>
        <p className="mt-2 text-muted-foreground">Everything you need, in one place.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="overflow-hidden rounded-lg border border-border bg-card">
              <img src={s.img} alt={s.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold">About Maedot</h2>
          <p className="mt-4 text-muted-foreground">
            Maedot Digital Hub is a community-driven financial platform helping
            families and small businesses save, borrow and thrive — backed by
            modern, secure technology and a trusted local network.
          </p>
        </div>
      </section>

      <footer id="contact" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Maedot Digital Hub</span>
          <span>Contact: info@maedot.example</span>
        </div>
      </footer>
    </div>
  );
}
