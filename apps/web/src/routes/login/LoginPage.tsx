import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@accounting-completed/api-client";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail]       = useState("");
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
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 py-10 text-[#13181d]"
      style={{
        background: "#f4f5f3",
        backgroundImage: "radial-gradient(circle at 50% 0%, #ffffff, transparent 60%)",
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-[400px]">
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-4 mb-7">
          <img
            src="/assets/logo.png"
            alt="Accounting Completed"
            width={96}
            height={96}
            className="block w-24 h-24"
          />
        </div>

        {/* Card */}
        <div
          className="bg-white border border-[#e6e8e4] rounded-2xl px-8 py-9"
          style={{
            boxShadow:
              "0 1px 2px rgba(19,24,29,0.04), 0 12px 32px -12px rgba(19,24,29,0.12)",
          }}
        >
          <div className="text-center mb-[26px]">
            <h2 className="text-[23px] leading-[1.2] font-semibold tracking-[-0.02em] m-0">
              Welcome back
            </h2>
            <p className="text-[13.5px] text-[#6b747c] mt-2">
              Enter your credentials to access your account.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
            <div className="flex flex-col gap-[7px]">
              <label htmlFor="email" className="text-[12px] font-medium text-[#4a525a]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@firm.com"
                className="h-[42px] px-[13px] text-[14px] text-[#13181d] bg-[#fbfbfa] border border-[#dde0db] rounded-[9px] transition-[border-color,box-shadow] duration-150 placeholder:text-[#9aa3ad] focus:outline-none focus:bg-white focus:border-[#1f6f5c] focus:shadow-[0_0_0_3px_rgba(31,111,92,0.12)]"
                style={{ fontFamily: "inherit" }}
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-medium text-[#4a525a]">
                  Password
                </label>
                <a href="#" className="text-[12px] font-medium text-[#1f6f5c] no-underline hover:underline">
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••••••"
                className="h-[42px] px-[13px] text-[14px] text-[#13181d] bg-[#fbfbfa] border border-[#dde0db] rounded-[9px] transition-[border-color,box-shadow] duration-150 placeholder:text-[#9aa3ad] focus:outline-none focus:bg-white focus:border-[#1f6f5c] focus:shadow-[0_0_0_3px_rgba(31,111,92,0.12)]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <label className="flex items-center gap-2 mt-0.5 text-[12.5px] text-[#6b747c] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(r => !r)}
                className="w-[15px] h-[15px] cursor-pointer"
                style={{ accentColor: "#0d1622" }}
              />
              Keep me signed in on this browser
            </label>

            {error && (
              <p
                role="alert"
                className="text-[13px] text-[#c2453a] bg-[#fdf1f0] border border-[#f6d9d6] rounded-lg px-3 py-[9px] m-0"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="h-11 mt-1 flex items-center justify-center gap-[9px] w-full text-[14px] font-semibold text-white bg-[#0d1622] rounded-[9px] cursor-pointer transition-colors duration-150 hover:bg-[#1b2735] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "inherit" }}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
