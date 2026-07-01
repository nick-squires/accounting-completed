import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, Badge, Button, Card } from "@accounting-completed/ui";

/**
 * Public marketing landing page shown at "/".
 * A clean, in-design-system reskin of the live accountingcompleted.com landing
 * page: same content and section rhythm, rendered with the rebuild's theme
 * tokens, IBM Plex Sans, and shared UI components. All CTAs route to /login.
 */

const HEADING_FONT = "'Inter Tight', system-ui, sans-serif";

const TRUST_POINTS = [
  { icon: "card", label: "No credit card needed" },
  { icon: "calendar", label: "75-day free trial" },
  { icon: "cancel", label: "Cancel anytime" },
  { icon: "lock", label: "Secure bank connection" },
] as const;

const STEPS = [
  {
    n: 1,
    title: "Connect your bank",
    body: "Securely connect your bank in minutes.",
  },
  {
    n: 2,
    title: "Organize income & expenses",
    body: "Your Profit & Loss is built automatically.",
  },
  {
    n: 3,
    title: "Review your report",
    body: "See daily updates and know where your business stands.",
  },
] as const;

const TESTIMONIALS = [
  {
    name: "Alexandria Detrio",
    detail: "ReImagine Power, Inc. · San Francisco, CA",
    quote:
      "…top notch small business accounting… makes it easy to manage my books and navigate… allowing me as a business owner to focus on my company and clients.",
    avatar:
      "https://static.wixstatic.com/media/bdb851_c248ace4c2174551804f6f58665ed06e~mv2.jpg",
  },
  {
    name: "Dr. Michael Digrado",
    detail: "Newport Center Family Chiropractic · Newport Beach, CA",
    quote:
      "I completely trust them with all of my accounting needs, and I am 100% satisfied…",
    avatar:
      "https://static.wixstatic.com/media/bdb851_4fa70dd6198c44ee89eb9b5ae862a9cf~mv2.jpg",
  },
  {
    name: "Yasmine Mason",
    detail: "Fermentation Farm · Costa Mesa, CA",
    quote:
      "…Instrumental to our business. We couldn't give a higher recommendation.",
    avatar:
      "https://static.wixstatic.com/media/71f788_60893ad6a3b54ce5938f4edac333e3d6~mv2.png",
  },
  {
    name: "Reuben Montemagni",
    detail: "The Art of Chiropractic · New York, NY",
    quote:
      "An invaluable part of our business… we rely on their accuracy & efficiency in keeping our books updated.",
    avatar:
      "https://static.wixstatic.com/media/bdb851_0e96eea3f18c442390516986521d6a39~mv2.jpg",
  },
  {
    name: "Anne Carr",
    detail: "Stanford Chiropractic Center · Menlo Park, CA",
    quote:
      "I highly recommend this app… We have complicated accounting across entities, and it has been our saving grace!",
    avatar:
      "https://static.wixstatic.com/media/71f788_42a30f90826e4582b207dc4fa7bc9859~mv2.jpg",
  },
  {
    name: "Michael Gelder",
    detail: "Nationwide Bird Control · Tracy, CA",
    quote:
      "This cloud accounting system is easy to access and gives me a clear snapshot of my business anytime, anywhere.",
    avatar:
      "https://static.wixstatic.com/media/71f788_20f9a0a17caa493e97e75c489f96e76c~mv2.jpg",
  },
  {
    name: "Kimberly Darrow",
    detail: "Darrow Management · El Granada, CA",
    quote:
      "It's about trust & customer service. With them in charge of accounting we have complete confidence.",
    avatar:
      "https://static.wixstatic.com/media/71f788_5d046fddd6bc46c5a1710cf05d117d45~mv2.png",
  },
  {
    name: "Dr. Samila Hifai",
    detail: "San Diego, CA",
    quote: "…the most amazing service I HAVE EVER HAD!!!!! Thank you.",
    avatar:
      "https://static.wixstatic.com/media/bdb851_cfeee5a266a84842b8079125899e877f~mv2.jpg",
  },
] as const;

type Tier = "basic" | "standard" | "executive";

const PLANS: { key: Tier; name: string; price: string; note: string }[] = [
  { key: "basic", name: "Basic", price: "$PWYW", note: "pay what's worth it" },
  { key: "standard", name: "Standard", price: "$167", note: "per month" },
  { key: "executive", name: "Executive", price: "Custom", note: "tailored pricing" },
];

const FEATURES: { label: string; basic: boolean; standard: boolean; executive: boolean }[] = [
  { label: "Continuously Updated Transactions", basic: true, standard: true, executive: true },
  { label: "Automatically Categorizes Your Transactions", basic: true, standard: true, executive: true },
  { label: "View, Click & Print Results of Business Operations", basic: true, standard: true, executive: true },
  { label: "Invite Your Own Tax CPA or Preparer", basic: true, standard: true, executive: true },
  { label: "Connect Unlimited Financial Institutions", basic: true, standard: true, executive: true },
  { label: "Retrieve & Categorize Older Transactions (you propose the price)", basic: true, standard: true, executive: true },
  { label: "Tax-Ready Year-End Statements", basic: true, standard: true, executive: true },
  { label: "Gratis Annual Consult With An Accounting CPA", basic: true, standard: true, executive: true },
  { label: "Easy Edit for Uncategorized Transactions", basic: true, standard: true, executive: true },
  { label: "Import Your Previous Chart of Accounts (optional)", basic: false, standard: true, executive: true },
  { label: "Import Your Previous Accounting Record (optional)", basic: false, standard: true, executive: true },
  { label: "Priority Support", basic: false, standard: false, executive: true },
  { label: "Bank Statement Retrieval", basic: false, standard: false, executive: true },
  { label: "Employee Users (with controls)", basic: false, standard: false, executive: true },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "How quickly does data show up?",
    a: "As soon as you connect your business bank(s) and credit card(s), your data populates into your Profit & Loss, typically within minutes.",
  },
  {
    q: "Who is this for?",
    a: "Service companies and entrepreneurs around or under $5M in annual revenue using cash-basis accounting, who do not need this software for invoices, receivables/payables tracking, or inventory.",
  },
  {
    q: "What do I get when I buy?",
    a: "This CPA-built system updates your Profit & Loss information daily, with your data easily and readily viewable (and printable) from any device. The app can post your starting balances, or import your previously completed accounting at no extra fee.",
  },
  {
    q: "Is this tax prep?",
    a: "No, it's accounting and reporting (tax-ready info for your tax preparer at year-end).",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, the first 75 days of data are free.",
  },
  {
    q: "What's the price?",
    a: "You decide what it is worth to you. That monthly fee starts after your 75 days of free data. No credit card required.",
  },
  {
    q: "Will I get a monthly Profit & Loss report?",
    a: "Yes. Your Profit & Loss is available anytime to view and print, or you can schedule periodic delivery.",
  },
  {
    q: "Would you use my Chart of Accounts that I have used in the past?",
    a: "Yes. We can import any Chart of Accounts as part of your plan at no extra cost, or start with the income and expense categories we have in our system and add what you request over time.",
  },
  {
    q: "I already have some of my accounting done for the year. Can you use that data?",
    a: "The app can import accounting previously prepared on other software at no charge, or you can start fresh — it's your plan, so it's your choice.",
  },
  {
    q: "How do you make sure you get everything right?",
    a: "Every business has its uniqueness and specialty items. That's why we provide customized plans for more complex situations, and why our service includes setting up a session with a professional within the first several days.",
  },
  {
    q: "What if I haven't had my accounting done for a while — how do I catch up?",
    a: "Back-work or \"catch-up\" is priced separately. You give us a price you believe is fair and we go from there. From the day you connect, the app automatically goes back to the first day of the prior month as part of your 75 days of free data, and can gather catch-up data 6–24 months back depending on your institutions.",
  },
  {
    q: "How do I get started?",
    a: "Click below and connect your accounts to see your income and expense numbers populate. Look it over in the coming weeks. Decide what it is worth to you.",
  },
];

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon({ kind }: { kind: (typeof TRUST_POINTS)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-[18px] h-[18px]",
    "aria-hidden": true,
  };
  switch (kind) {
    case "card":
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="M2.5 9.5h19" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
          <path d="M3.5 9h17M8 3v3M16 3v3" />
        </svg>
      );
    case "cancel":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
          <path d="M8 10.5V8a4 4 0 018 0v2.5" />
        </svg>
      );
  }
}

/** Teal primary CTA button that routes to /login. */
function TrialButton({ className = "", label = "Start Your Free Trial" }: { className?: string; label?: string }) {
  return (
    <Button
      asChild
      variant="primary"
      className={`h-11 px-5 text-[14px] bg-primary hover:bg-primary/90 border-primary ${className}`}
    >
      <Link to="/login">
        {label}
        <span aria-hidden="true">→</span>
      </Link>
    </Button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mx-auto max-w-2xl text-center text-[28px] sm:text-[34px] font-bold leading-[1.15] tracking-[-0.02em] text-primary"
      style={{ fontFamily: HEADING_FONT }}
    >
      {children}
    </h2>
  );
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- Top navigation ---- */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="Accounting Completed" className="h-8 w-8" />
            <span
              className="text-[15px] font-bold leading-none tracking-[-0.01em]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Accounting <span className="text-primary">Completed</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-[13.5px] font-medium text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How It Works</a>
            <a href="#reviews" className="transition-colors hover:text-foreground">Reviews</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Plans &amp; Pricing</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQs</a>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="h-9 px-3 text-[13.5px]">
              <Link to="/login">Login</Link>
            </Button>
            <TrialButton className="hidden h-9 px-4 sm:inline-flex" label="Start Your Free Trial" />
          </div>
        </nav>
      </header>

      {/* ---- Hero ---- */}
      <section id="top" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge variant="accent" className="mb-5">CPA-built for Small Business Owners</Badge>
            <h1
              className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[56px]"
              style={{ fontFamily: HEADING_FONT }}
            >
              A Profit &amp; Loss You Can Trust in Minutes
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Connect your bank securely and get a clean Profit &amp; Loss without
              QuickBooks, Xero, or software to install.
            </p>
            <div className="mt-7">
              <TrialButton className="h-12 px-6 text-[15px]" />
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_POINTS.map((p) => (
                <li key={p.label} className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span className="text-primary"><TrustIcon kind={p.icon} /></span>
                  {p.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute inset-0 -z-10 rounded-full bg-accent/50 blur-3xl"
              aria-hidden="true"
            />
            <img
              src="/assets/preview-desktop.png"
              alt="Accounting Completed dashboard preview"
              className="w-full rounded-xl border border-border shadow-elev-lg"
              width={1424}
              height={916}
            />
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <SectionHeading>How It Works</SectionHeading>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[14px] font-bold text-primary">
                {s.n}
              </div>
              <h3 className="mt-4 text-[17px] font-semibold" style={{ fontFamily: HEADING_FONT }}>
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>

        {/* Free-trial banner */}
        <Card className="mt-8 flex flex-col items-center justify-between gap-5 p-7 sm:flex-row">
          <div>
            <h3 className="text-[20px] font-bold" style={{ fontFamily: HEADING_FONT }}>
              75-Day Free Trial
            </h3>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Try it free, then decide what it's worth to you.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <TrialButton />
            <div className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="text-primary"><TrustIcon kind="card" /></span>No credit card needed</span>
              <span className="flex items-center gap-1.5"><span className="text-primary"><TrustIcon kind="cancel" /></span>Cancel anytime</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ---- Testimonials ---- */}
      <section id="reviews" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <SectionHeading>
            Here's How Daily-Updated Financial Data is Improving Small Businesses
          </SectionHeading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} src={t.avatar} size={44} className="rounded-full" />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold leading-tight">{t.name}</div>
                    <div className="truncate text-[12px] text-text-soft">{t.detail}</div>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">"{t.quote}"</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5">
            <TrialButton />
            <div className="flex items-center gap-2 text-[12px] text-text-soft">
              <span>Bank &amp; credit card transactions gathered by</span>
              <img src="/assets/mc-logo.svg" alt="Mastercard Data Connect" className="h-6 w-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Plans & pricing ---- */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <SectionHeading>Plans &amp; Pricing</SectionHeading>

        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-elev-sm">
          {/* Header row */}
          <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] border-b border-border bg-secondary/50">
            <div className="hidden px-5 py-4 sm:block" />
            {PLANS.map((p) => (
              <div key={p.key} className="px-3 py-4 text-center">
                <div className="text-[14px] font-bold" style={{ fontFamily: HEADING_FONT }}>{p.name}</div>
                <div className="mt-1 text-[18px] font-bold text-primary">{p.price}</div>
                <div className="text-[11px] text-text-soft">{p.note}</div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`grid grid-cols-[1.6fr_repeat(3,1fr)] items-center ${i % 2 ? "bg-secondary/25" : "bg-card"}`}
            >
              <div className="px-4 py-3 text-[12.5px] leading-snug text-foreground sm:px-5 sm:text-[13.5px]">
                {f.label}
              </div>
              {(["basic", "standard", "executive"] as Tier[]).map((tier) => (
                <div key={tier} className="flex justify-center px-3 py-3">
                  {f[tier] ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-positive-soft text-positive">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="text-[15px] leading-none text-border-strong">—</span>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center border-t border-border bg-secondary/40">
            <div className="hidden px-5 py-4 sm:block" />
            {PLANS.map((p) => (
              <div key={p.key} className="flex justify-center px-3 py-4">
                <Button asChild variant="primary" className="h-9 px-4 text-[13px] bg-primary hover:bg-primary/90 border-primary">
                  <Link to="/login">Start</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <div className="mt-10 flex flex-col gap-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <Card key={item.q} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[14.5px] font-medium text-foreground">{item.q}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    >
                      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                      {item.a}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-5">
            <TrialButton />
            <div className="flex items-center gap-2 text-[12px] text-text-soft">
              <span>Bank &amp; credit card transactions gathered by</span>
              <img src="/assets/mc-logo.svg" alt="Mastercard Data Connect" className="h-6 w-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="bg-action text-action-foreground">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-center justify-center gap-3">
            <img src="/assets/logo.png" alt="Accounting Completed" className="h-10 w-10" />
            <span className="text-[20px] font-bold tracking-[-0.01em]" style={{ fontFamily: HEADING_FONT }}>
              Accounting Completed
            </span>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-center text-[13px] leading-relaxed text-action-foreground/70">
            AccountingCompleted is a powerful automated tool for keeping your bookkeeping
            up to date. Professional services are provided separately under separate terms,
            at your option.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 text-[12.5px] text-action-foreground/60">
            <span>© {2026}. All Rights Reserved.</span>
            <div className="flex items-center gap-3">
              <a href="#top" className="hover:text-action-foreground">Terms &amp; Conditions</a>
              <span aria-hidden="true">|</span>
              <a href="#top" className="hover:text-action-foreground">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
