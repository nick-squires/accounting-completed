import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@accounting-completed/api-client";
import { Button, Input, Kbd } from "@accounting-completed/ui";

const features = [
  { k: "Bank feeds",     v: "14,000+ institutions" },
  { k: "Auto-categorize", v: "98% accuracy" },
  { k: "Multi-client",   v: "Built for firms" },
  { k: "Audit trail",    v: "Every change tracked" },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail]       = useState("scott@recordsinorder.com");
  const [pw, setPw]             = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ username: email, password: pw });
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <div className="grid grid-cols-2 h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ── Brand panel ── */}
      <div
        className="relative text-white overflow-hidden flex flex-col"
        style={{
          backgroundColor: "hsl(217 43% 10%)",
          backgroundImage: [
            "radial-gradient(circle at 20% 30%, hsl(202 85% 30% / 0.18), transparent 40%)",
            "radial-gradient(circle at 80% 80%, hsl(184 81% 29% / 0.16), transparent 40%)",
          ].join(", "),
        }}
      >
        {/* grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundSize: "28px 28px",
            backgroundImage: [
              "linear-gradient(to right, hsl(0 0% 100% / 0.04) 1px, transparent 1px)",
              "linear-gradient(to bottom, hsl(0 0% 100% / 0.04) 1px, transparent 1px)",
            ].join(", "),
          }}
        />

        {/* Top: brand mark */}
        <div className="relative p-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white text-primary grid place-items-center font-mono font-semibold text-[12px]">
            AC
          </div>
          <div>
            <div className="font-semibold text-[18px] tracking-tight">Accounting Completed</div>
            <div className="text-[11px] text-white/60 uppercase tracking-wider">Cloud Accounting</div>
          </div>
        </div>

        {/* Mid: pitch */}
        <div className="relative px-10 pt-12 pb-10 flex-1 flex flex-col justify-center max-w-[560px]">
          <span className="inline-flex items-center gap-2 mb-5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-medium uppercase tracking-wider w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(151_76%_55%)]" />
            v6.2 · released May 24
          </span>
          <h1
            className="text-[40px] leading-[1.1] font-semibold tracking-tight m-0 mb-6"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Bookkeeping that gets out of the way of the books.
          </h1>
          <p
            className="text-[16px] text-white/70 mb-12 max-w-[48ch]"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            Cloud accounting for firms managing many clients — bank feeds, reports, and reconciliation, all in one place.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3 max-w-[480px]">
            {features.map(f => (
              <div
                key={f.k}
                className="border border-white/10 bg-white/[0.03] rounded-md px-3 py-2.5"
              >
                <div className="text-[11px] text-white/50 uppercase tracking-wider">{f.k}</div>
                <div className="text-[13px] font-medium mt-0.5">{f.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: testimonial */}
        <div className="relative p-10 border-t border-white/10">
          <p
            className="text-[13px] leading-relaxed text-white/85 italic max-w-[60ch]"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            "We migrated 28 clients in a weekend. The categorization rules learned our chart of accounts faster than any junior we've ever onboarded."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div
              className="w-8 h-8 rounded-full grid place-items-center text-white font-semibold text-[12px]"
              style={{
                background: "linear-gradient(to bottom right, hsl(213 25% 60%), hsl(213 18% 42%))",
              }}
            >
              AC
            </div>
            <div>
              <div className="text-[13px] font-medium">Adelina Costa</div>
              <div className="text-[11px] text-white/60">Founder, Records in Order</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex items-center justify-center p-10 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div className="text-[11px] text-text-soft uppercase tracking-wider font-medium mb-2">Sign in</div>
            <h2 className="text-[26px] leading-7 font-semibold tracking-tight m-0">Welcome back.</h2>
            <p className="text-[14px] text-muted-foreground mt-2">
              Don't have an account?{" "}
              <a href="#" className="text-primary font-medium hover:underline">
                Ask your firm admin →
              </a>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@firm.com"
                className="h-10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[12px] font-medium text-muted-foreground">
                  Password
                </label>
                <a href="#" className="text-[12px] text-primary hover:underline">
                  Forgot?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(r => !r)}
                className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer"
              />
              Keep me signed in on this browser
            </label>

            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 justify-center"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in…" : "Sign in to Accounting Completed"}
              {!login.isPending && (
                <span className="text-[11px] opacity-70">
                  <Kbd>↵</Kbd>
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center text-[11.5px] text-text-soft">
            Protected by SOC 2 Type II controls.{" "}
            <a href="#" className="text-primary hover:underline">
              Security overview →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
