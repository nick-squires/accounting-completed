/* global React, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor,
            Sidebar, Topbar, ClientPicker */

const { useState: usePg, useEffect: useEffPg } = React;

const PAGE_ACCENT_HSL = {
  "#0B5C8C": "202 85% 30%",
  "#0E7C86": "184 81% 29%",
  "#1D4ED8": "224 76% 48%",
  "#5C3FB5": "256 49% 47%",
  "#0F1724": "217 43% 10%",
};

const PAGE_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent":   "#0B5C8C",
  "density":  "comfy",
  "role":     "staff"
}/*EDITMODE-END*/;

/* PageShell — full-bleed app frame with sidebar, topbar, tweaks, client picker.
   Provides ⌘K shortcut to open picker. */
function PageShell({ activeKey, crumbs, topbarChildren, children, mainClassName, density: densityOverride }) {
  const [t, setTweak] = useTweaks(PAGE_TWEAK_DEFAULTS);
  const [pickerOpen, setPickerOpen] = usePg(false);
  const [currentClient, setCurrentClient] = usePg("atlas");

  useEffPg(() => {
    const hsl = PAGE_ACCENT_HSL[t.accent] || PAGE_ACCENT_HSL["#0B5C8C"];
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--accent-foreground", hsl);
  }, [t.accent]);

  useEffPg(() => {
    document.body.setAttribute("data-density", densityOverride || t.density);
  }, [t.density, densityOverride]);

  // ⌘K opens picker globally (firm staff only — owner/employee don't have multi-client)
  useEffPg(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (t.role === "staff") setPickerOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [t.role]);

  return (
    <div className="h-full w-full grid" style={{ gridTemplateColumns: "240px 1fr", gridTemplateRows: "56px 1fr" }}>
      <div className="row-span-2">
        <Sidebar activeKey={activeKey}
                 role={t.role}
                 onClientClick={() => setPickerOpen(true)} />
      </div>
      <Topbar crumbs={crumbs} role={t.role}>{topbarChildren}</Topbar>
      <main className={"overflow-auto " + (mainClassName || "p-6 md:p-8")}>{children}</main>

      {t.role === "staff" && (
        <ClientPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          currentId={currentClient}
          onSelect={(c) => setCurrentClient(c.id)}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Role" />
        <TweakRadio label="View as" value={t.role}
                    options={["staff", "owner", "employee"]}
                    onChange={(v) => setTweak("role", v)} />
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
                    options={Object.keys(PAGE_ACCENT_HSL)}
                    onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Density" />
        <TweakRadio label="Rows" value={t.density}
                    options={["compact", "comfy"]}
                    onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

/* PageHeader — consistent title + sub + action row */
function PageHeader({ title, sub, actions }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
      <div>
        <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">{title}</h1>
        {sub && <div className="text-[15px] text-muted-foreground">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* StatTile — used on several pages */
function StatTile({ label, value, sub, intent, spark, sparkColor }) {
  const vc =
    intent === "warning"  ? "text-warning" :
    intent === "positive" ? "text-positive" :
    intent === "accent"   ? "text-primary" :
    intent === "destructive" ? "text-destructive" :
                              "text-foreground";
  return (
    <div className="bg-card border border-border rounded-lg shadow-elev-xs p-5 relative overflow-hidden">
      <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft mb-3">{label}</div>
      <div className={`font-mono tnum text-[28px] leading-none font-medium tracking-tight ${vc}`}>{value}</div>
      {sub && <div className="text-[12px] text-muted-foreground mt-2">{sub}</div>}
      {spark && (
        <div className="absolute right-4 top-4 opacity-70">
          <Sparkline values={spark} color={sparkColor || "hsl(var(--primary))"} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PageShell, PageHeader, StatTile });
