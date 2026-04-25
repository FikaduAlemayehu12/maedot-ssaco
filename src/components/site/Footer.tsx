import logo from "@/assets/logo.png";

const cols = [
  { title: "Services", links: ["Savings", "Loans", "Mobile Wallet", "Insurance", "Group Accounts"] },
  { title: "Company", links: ["About Us", "Careers", "Branches", "Press", "Contact"] },
  { title: "Support", links: ["FAQs", "Help Center", "Privacy Policy", "Terms of Service", "Security"] },
];

export const Footer = () => (
  <footer className="border-t border-border bg-muted/30">
    <div className="container py-16 grid lg:grid-cols-5 gap-10">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-2.5 mb-4">
          <img src={logo} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 object-contain" />
          <div>
            <div className="font-display font-bold">Maedot SACCO</div>
            <div className="text-xs text-muted-foreground">በጋራ እንሻገር · Transforming Together</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Maedot Saving and Credit Cooperative — a member-owned Ethiopian financial cooperative empowering communities through modern, secure digital banking.
        </p>
        <a href="tel:0903373727" className="text-sm font-semibold text-primary">📞 0903 37 37 27</a>
      </div>

      {cols.map((c) => (
        <div key={c.title}>
          <div className="font-display font-semibold mb-4">{c.title}</div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {c.links.map((l) => (
              <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border">
      <div className="container py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Maedot Saving and Credit Cooperative. All rights reserved.</div>
        <div>Regulated under Ethiopian Cooperative Society Proclamation</div>
      </div>
    </div>
  </footer>
);
