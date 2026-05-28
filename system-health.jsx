/* global React, ReactDOM, PageShell, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, Sparkline, cn, I */

const { useState } = React;

const SERVICES = [
  { name: "Application servers (US-West)", status: "ok", uptime: "99.99%", latency: "82ms",  region: "us-west-2"  },
  { name: "Application servers (US-East)", status: "ok", uptime: "99.99%", latency: "61ms",  region: "us-east-1"  },
  { name: "PostgreSQL primary",            status: "ok", uptime: "100%",  latency: "12ms",  region: "us-west-2"  },
  { name: "PostgreSQL read replica",       status: "ok", uptime: "100%",  latency: "14ms",  region: "us-east-1"  },
  { name: "Redis cache",                   status: "ok", uptime: "100%",  latency: "3ms",   region: "us-west-2"  },
  { name: "Finicity bank feeds",           status: "degraded", uptime: "98.42%", latency: "1840ms", region: "us-west-2", note: "Wells Fargo OAuth refresh issues (vendor)" },
  { name: "QuickBooks Online sync",        status: "ok", uptime: "99.94%", latency: "412ms", region: "us-west-2" },
  { name: "Stripe webhooks",               status: "ok", uptime: "100%",  latency: "62ms",  region: "us-west-2" },
  { name: "SendGrid email",                status: "ok", uptime: "99.98%", latency: "120ms", region: "us-east-1" },
  { name: "S3 receipt storage",            status: "ok", uptime: "100%",  latency: "48ms",  region: "us-west-2" },
  { name: "Background workers",            status: "warn", uptime: "99.20%", latency: "—",    region: "us-west-2", note: "Queue depth elevated (1,420 jobs)" },
];

const INCIDENTS = [
  { when: "2026-05-26 14:22 PT", title: "Finicity — Wells Fargo OAuth refresh failures",  severity: "ongoing", impact: "12 customers affected · ~4% of WF connections", duration: "ongoing · 2d 4h" },
  { when: "2026-05-19 03:14 PT", title: "PostgreSQL primary failover (us-west-2)",         severity: "resolved", impact: "Read-only mode for 4 min · 0 data loss",         duration: "4m 12s" },
  { when: "2026-05-08 11:08 PT", title: "Background worker queue saturation",              severity: "resolved", impact: "Bank feed refresh delayed by 18 min",            duration: "23m 04s" },
  { when: "2026-04-30 22:01 PT", title: "QBO Intuit-side rate limit",                       severity: "resolved", impact: "Sync deferred for 14 firms · no transactions lost", duration: "1h 18m" },
];

const JOBS = [
  { name: "bank-feed.refresh",          queued: 142, processing: 18, errors:  2, throughput: "8.4/s",  workers: 12 },
  { name: "qbo.sync",                   queued:  86, processing: 12, errors:  0, throughput: "4.2/s",  workers:  8 },
  { name: "rule.evaluate",              queued: 240, processing: 24, errors:  1, throughput: "32.1/s", workers:  6 },
  { name: "report.profitloss.cache",    queued:  12, processing:  2, errors:  0, throughput: "0.8/s",  workers:  2 },
  { name: "email.daily-digest",         queued:   0, processing:  0, errors:  0, throughput: "—",      workers:  2 },
  { name: "audit.write",                queued:   3, processing:  1, errors:  0, throughput: "182/s",  workers:  4 },
  { name: "receipt.ocr",                queued:  18, processing:  4, errors:  3, throughput: "0.4/s",  workers:  3, warn: "OCR vendor latency elevated" },
];

const STATUS_MAP = {
  ok:       { variant: "positive",    dot: "bg-positive",    label: "Operational",        dotPulse: false },
  degraded: { variant: "warning",     dot: "bg-warning",     label: "Degraded",           dotPulse: true  },
  warn:     { variant: "warning",     dot: "bg-warning",     label: "Watch",              dotPulse: false },
  down:     { variant: "destructive", dot: "bg-destructive", label: "Outage",             dotPulse: true  },
};

const SEVERITY = {
  ongoing:  { variant: "warning", label: "Investigating" },
  resolved: { variant: "positive", label: "Resolved" },
};

function ServiceRow({ s }) {
  const m = STATUS_MAP[s.status] || STATUS_MAP.ok;
  return (
    <tr className="border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
      <td className="px-5 align-middle" style={{ height: 44 }}>
        <div className="flex items-center gap-3">
          <span className={cn("w-2 h-2 rounded-full", m.dot, m.dotPulse && "animate-pulse")}></span>
          <span className="font-medium">{s.name}</span>
          {s.note && <span className="text-[11.5px] text-warning ml-2">— {s.note}</span>}
        </div>
      </td>
      <td className="px-3 align-middle">
        <Badge variant={m.variant} dot>{m.label}</Badge>
      </td>
      <td className="px-3 align-middle font-mono tnum text-[12.5px]">{s.uptime}</td>
      <td className="px-3 align-middle font-mono tnum text-[12.5px] text-muted-foreground">{s.latency}</td>
      <td className="px-3 align-middle font-mono text-[11.5px] text-text-soft">{s.region}</td>
    </tr>
  );
}

function App() {
  const [tab, setTab] = useState("Overview");

  const liveSeries = [82, 86, 90, 88, 94, 91, 96, 100, 98, 95, 92, 89, 92, 96];

  return (
    <PageShell activeKey="health" crumbs={["Admin", "System health"]}>
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">System health</h1>
          <p className="text-[15px] text-muted-foreground">
            All systems <span className="text-positive font-medium">operational</span> with one degraded integration. Last refresh <span className="font-mono text-foreground">8s ago</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>{I.refresh}<span>Refresh</span></Button>
          <Button>{I.download}<span>Export status</span></Button>
          <Button variant="primary">{I.alert}<span>Declare incident</span></Button>
        </div>
      </div>

      {/* Hero status banner */}
      <div className="mb-6 bg-card border border-border rounded-lg p-5 flex items-center gap-5 shadow-elev-xs">
        <div className="relative w-12 h-12 rounded-full bg-positive/15 grid place-items-center flex-shrink-0">
          <span className="w-5 h-5 text-positive">{I.check}</span>
          <span className="absolute inset-0 rounded-full bg-positive/20 animate-ping" />
        </div>
        <div className="flex-1">
          <div className="text-[16px] font-semibold">Overall status: Operational</div>
          <div className="text-[13px] text-muted-foreground">
            10 of 11 services reporting normal. <span className="text-warning font-medium">Finicity bank feeds are degraded</span> — see incidents below.
          </div>
        </div>
        <div className="flex items-end gap-1 h-10">
          {liveSeries.map((v, i) => (
            <span key={i}
                  className={cn("w-1.5 rounded-full",
                                  v < 85 ? "bg-warning" : "bg-positive")}
                  style={{ height: `${v * 0.4}px` }} />
          ))}
        </div>
        <div className="text-right min-w-[100px]">
          <div className="text-[11px] text-text-soft uppercase tracking-wider mb-0.5">P50 latency · 5min</div>
          <div className="font-mono tnum text-[18px] font-medium">96ms</div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Uptime (90d)" value="99.97%" sub="vs 99.95% SLO" intent="positive" />
        <StatTile label="Active requests / s" value="1,240" sub="across regions" intent="accent"
                  spark={[420,480,520,500,580,610,640,720,700,820,1100,1240]} sparkColor="hsl(var(--primary))" />
        <StatTile label="Error rate (5xx)" value="0.04%" sub="last 24h" intent="positive" />
        <StatTile label="Queue depth" value="1,420" sub="bank-feed.refresh" intent="warning" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsTrigger value="Overview">Services</TabsTrigger>
        <TabsTrigger value="Jobs">Background jobs</TabsTrigger>
        <TabsTrigger value="Incidents">Incidents <span className="ml-1 font-mono tnum opacity-60">1 open</span></TabsTrigger>
        <TabsTrigger value="Audit">Audit log</TabsTrigger>
      </Tabs>

      <div className="mt-4 space-y-6">
        {tab === "Overview" && (
          <Card>
            <CardHeader>
              <CardTitle>Services &amp; integrations</CardTitle>
              <span className="text-[12px] text-muted-foreground">snapshot · last 5 minutes</span>
            </CardHeader>
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted/60 border-b border-border/60">
                <tr>
                  <th className="text-left px-5 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Service</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Status</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Uptime · 30d</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">P50 latency</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Region</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map(s => <ServiceRow key={s.name} s={s} />)}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "Jobs" && (
          <Card>
            <CardHeader>
              <CardTitle>Background job queues</CardTitle>
              <Button size="sm" variant="ghost">{I.refresh}<span>Refresh</span></Button>
            </CardHeader>
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted/60 border-b border-border/60">
                <tr>
                  <th className="text-left px-5 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Queue</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Queued</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Processing</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Errors (24h)</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Throughput</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[80px]">Workers</th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map(j => (
                  <tr key={j.name} className="border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors">
                    <td className="px-5 align-middle font-mono text-[12.5px]" style={{ height: 40 }}>
                      <div className="text-foreground">{j.name}</div>
                      {j.warn && <div className="text-[11px] text-warning mt-0.5">⚠ {j.warn}</div>}
                    </td>
                    <td className="px-3 align-middle text-right font-mono tnum">{j.queued}</td>
                    <td className="px-3 align-middle text-right font-mono tnum text-info">{j.processing}</td>
                    <td className={cn("px-3 align-middle text-right font-mono tnum", j.errors > 0 ? "text-destructive" : "text-text-soft")}>{j.errors}</td>
                    <td className="px-3 align-middle text-right font-mono tnum text-[12px] text-muted-foreground">{j.throughput}</td>
                    <td className="px-3 align-middle text-right font-mono tnum text-text-soft">{j.workers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span>7 active queues · <span className="font-mono text-foreground">501</span> jobs across all queues</span>
                <span>Auto-refresh in <span className="font-mono text-foreground">8s</span></span>
              </div>
            </CardFooter>
          </Card>
        )}

        {tab === "Incidents" && (
          <Card>
            <CardHeader>
              <CardTitle>Incidents · last 30 days</CardTitle>
              <Button size="sm" variant="ghost">View timeline</Button>
            </CardHeader>
            <div className="divide-y divide-border/60">
              {INCIDENTS.map((i, idx) => {
                const sv = SEVERITY[i.severity];
                return (
                  <div key={idx} className="px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                                              i.severity === "ongoing" ? "bg-warning animate-pulse" : "bg-positive")} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{i.title}</span>
                          <Badge variant={sv.variant} dot>{sv.label}</Badge>
                        </div>
                        <div className="text-[12.5px] text-muted-foreground mt-1">{i.impact}</div>
                        <div className="text-[11.5px] text-text-soft mt-1.5 font-mono">{i.when} · duration {i.duration}</div>
                      </div>
                      <Button size="sm" variant="ghost">Details →</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {tab === "Audit" && (
          <Card className="p-10 text-center text-muted-foreground">
            <div className="font-medium mb-1 text-foreground">Audit log streaming…</div>
            <div className="text-[13px]">Live feed of permissioned actions across the firm. Use filters on the right to narrow.</div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
