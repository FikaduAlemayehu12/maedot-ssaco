import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Phone, Mail, MapPin, Sparkles, Loader2, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTIONS = [
  "How do I register as a member?",
  "How do I apply for a loan?",
  "What is the interest rate?",
  "ብድር እንዴት ነው ማመልከት የምችለው?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "👋 **Welcome to Maedot SACCO!** / **እንኳን ደህና መጡ!**\n\nI'm your AI assistant. I can help you with:\n\n- 📝 **Member Registration** — open an account online\n- 💰 **Savings & Deposits** — up to 12% p.a.\n- 🏦 **Loan Applications** — 15%–17% interest, MoR staff discount\n- 🚑 **Emergency Loans** — health/social cases bypass the 6-month rule\n- 📊 **Transactions & Statements** — PDF/Excel export\n- ✅ **Approval Workflow** — track your loan status\n\nAsk me anything in **English** or **አማርኛ**.",
};

export const Chatbot = () => {
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "help">("chat");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, tab]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > next.length - 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.filter((m) => m !== WELCOME).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (resp.status === 429) {
        toast({ title: "Too many requests", description: "Please wait a moment and try again.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Service unavailable", description: "AI credits exhausted. Please contact the administrator.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: rdDone, value } = await reader.read();
        if (rdDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsertAssistant(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast({ title: "Chat error", description: "Couldn't reach the assistant. Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Maedot Assistant chat"
          className="fixed bottom-5 right-5 z-50 group flex items-center gap-2 rounded-full bg-gradient-gold text-primary-foreground shadow-gold hover:shadow-elegant px-5 py-3.5 font-display font-semibold transition-all hover:-translate-y-0.5 animate-float"
        >
          <MessageCircle className="size-5" />
          <span className="hidden sm:inline text-sm">Ask Maedot</span>
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary ring-2 ring-background animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] z-50 max-h-[85vh] sm:max-h-[640px] flex flex-col rounded-2xl bg-card border border-border shadow-elegant overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-emerald text-primary-foreground p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/20 grid place-items-center backdrop-blur">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-base leading-tight">Maedot Assistant</div>
              <div className="text-xs opacity-90 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Online · English & አማርኛ
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="size-8 rounded-full hover:bg-white/20 grid place-items-center transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === "chat" ? "text-primary border-b-2 border-primary bg-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MessageCircle className="size-4" /> Chat
            </button>
            <button
              onClick={() => setTab("help")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === "help" ? "text-primary border-b-2 border-primary bg-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <HelpCircle className="size-4" /> Help & Contact
            </button>
          </div>

          {/* Body */}
          {tab === "chat" ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-card-soft ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border rounded-bl-sm"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-headings:my-2">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-card-soft">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {messages.length <= 1 && (
                <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border bg-background">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="p-3 border-t border-border bg-background flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question… / ጥያቄዎን ይጻፉ…"
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} variant="hero">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20 text-sm">
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <h3 className="font-display font-bold text-base text-secondary">Contact Us</h3>
                <a href={`tel:${settings.phone}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                  <div className="size-9 rounded-full bg-primary/10 grid place-items-center text-primary">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-semibold">{settings.phone}</div>
                  </div>
                </a>
                {settings.email && (
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                    <div className="size-9 rounded-full bg-primary/10 grid place-items-center text-primary">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-semibold">{settings.email}</div>
                    </div>
                  </a>
                )}
                {settings.address && (
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 grid place-items-center text-primary">
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Office</div>
                      <div className="font-semibold">{settings.address}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <h3 className="font-display font-bold text-base text-secondary">What we offer</h3>
                <ul className="space-y-2.5">
                  <li>
                    <div className="font-semibold">📝 Member Registration</div>
                    <p className="text-muted-foreground text-xs">Open a membership online with ID, live photo, and signature.</p>
                  </li>
                  <li>
                    <div className="font-semibold">💰 Savings & Deposits</div>
                    <p className="text-muted-foreground text-xs">Regular savings, fixed deposits, and share capital — up to 12% p.a.</p>
                  </li>
                  <li>
                    <div className="font-semibold">🏦 Loan Applications</div>
                    <p className="text-muted-foreground text-xs">15%–17% interest, MoR staff discount. Requires 6-month membership (except emergency loans).</p>
                  </li>
                  <li>
                    <div className="font-semibold">🚑 Emergency Loans</div>
                    <p className="text-muted-foreground text-xs">Health & social impact cases — bypass the 6-month rule.</p>
                  </li>
                  <li>
                    <div className="font-semibold">📊 Transactions & Statements</div>
                    <p className="text-muted-foreground text-xs">Full 360° member profile with PDF & Excel export.</p>
                  </li>
                  <li>
                    <div className="font-semibold">✅ Approval Workflow</div>
                    <p className="text-muted-foreground text-xs">Draft → Review → Approved with staff oversight.</p>
                  </li>
                </ul>
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={() => {
                  setTab("chat");
                }}
              >
                <MessageCircle className="size-4" /> Start chatting
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};