/* global React, Dialog, DialogContent, CommandShell, CommandInput, CommandList,
            CommandGroup, CommandItem, CommandEmpty, CommandFooter, Avatar, Badge, Kbd,
            Sparkline, cn, I */

const { useState: usePk, useMemo: useMemoPk, useEffect: useEffectPk, useRef: useRefPk } = React;

/* =====================================================================
   Client dataset (28 firm clients, mixed entity types and statuses)
   ===================================================================== */
const CLIENTS = [
  { id: "atlas",      name: "Atlas Coffee Roasters",  initials: "AC", entity: "LLC",   industry: "Food & Beverage",   owner: "Jordan R.", openTasks: 3,  flag: null,        opened: "Now",      pinned: true,  spark: [42,48,56,52,61,58,64,72,68,74,82,78] },
  { id: "kestrel",    name: "Kestrel Studio",         initials: "KS", entity: "S-Corp",industry: "Design Agency",     owner: "Jordan R.", openTasks: 1,  flag: null,        opened: "2h ago",   pinned: true,  spark: [22,28,24,32,30,38,36,34,42,40,45,44] },
  { id: "northstar",  name: "Northstar Logistics",    initials: "NL", entity: "C-Corp",industry: "Logistics",         owner: "Priya S.",  openTasks: 12, flag: "needs-review", opened: "Yesterday", pinned: true, spark: [120,118,125,132,128,135,140,138,145,142,150,148] },
  { id: "highwire",   name: "Highwire Climbing Co.",  initials: "HC", entity: "LLC",   industry: "Retail",            owner: "Jordan R.", openTasks: 0,  flag: null,        opened: "Yesterday",pinned: true,  spark: [18,22,20,24,26,28,32,30,34,38,36,40] },
  { id: "meridian",   name: "Meridian Dental Group",  initials: "MD", entity: "PLLC",  industry: "Healthcare",        owner: "Marcus T.", openTasks: 5,  flag: null,        opened: "2d ago" },
  { id: "halcyon",    name: "Halcyon Yoga Studio",    initials: "HY", entity: "LLC",   industry: "Wellness",          owner: "Priya S.",  openTasks: 0,  flag: null,        opened: "2d ago" },
  { id: "brightwood", name: "Brightwood Pediatrics",  initials: "BP", entity: "PLLC",  industry: "Healthcare",        owner: "Marcus T.", openTasks: 2,  flag: null,        opened: "3d ago" },
  { id: "sentinel",   name: "Sentinel Security",      initials: "SS", entity: "LLC",   industry: "Services",          owner: "Jordan R.", openTasks: 14, flag: "needs-review", opened: "3d ago" },
  { id: "ironvine",   name: "Ironvine Vineyards",     initials: "IV", entity: "LLC",   industry: "Beverage",          owner: "Priya S.",  openTasks: 1,  flag: null,        opened: "4d ago" },
  { id: "lumen",      name: "Lumen Architecture",     initials: "LA", entity: "PLLC",  industry: "Architecture",      owner: "Jordan R.", openTasks: 0,  flag: null,        opened: "5d ago" },
  { id: "anchor",     name: "Anchor & Oak Furniture", initials: "AO", entity: "LLC",   industry: "Manufacturing",     owner: "Marcus T.", openTasks: 4,  flag: null,        opened: "1w ago" },
  { id: "verdant",    name: "Verdant Landscape Co.",  initials: "VL", entity: "S-Corp",industry: "Services",          owner: "Priya S.",  openTasks: 0,  flag: null,        opened: "1w ago" },
  { id: "bluepine",   name: "Bluepine Brewing",       initials: "BB", entity: "LLC",   industry: "Beverage",          owner: "Jordan R.", openTasks: 7,  flag: null,        opened: "1w ago" },
  { id: "covecast",   name: "Covecast Marketing",     initials: "CM", entity: "LLC",   industry: "Marketing",         owner: "Marcus T.", openTasks: 2,  flag: null,        opened: "1w ago" },
  { id: "ledgerly",   name: "Ledgerly Consulting",    initials: "LC", entity: "S-Corp",industry: "Consulting",        owner: "Priya S.",  openTasks: 0,  flag: null,        opened: "2w ago" },
  { id: "saltwater",  name: "Saltwater Surf Shop",    initials: "SW", entity: "LLC",   industry: "Retail",            owner: "Jordan R.", openTasks: 1,  flag: null,        opened: "2w ago" },
  { id: "rivergate",  name: "Rivergate Realty",       initials: "RR", entity: "LLC",   industry: "Real Estate",       owner: "Marcus T.", openTasks: 3,  flag: null,        opened: "2w ago" },
  { id: "polestar",   name: "Polestar Engineering",   initials: "PE", entity: "C-Corp",industry: "Engineering",       owner: "Priya S.",  openTasks: 0,  flag: null,        opened: "2w ago" },
  { id: "amber",      name: "Amber & Ivy Bakery",     initials: "AI", entity: "LLC",   industry: "Food & Beverage",   owner: "Jordan R.", openTasks: 0,  flag: null,        opened: "3w ago" },
  { id: "lighthouse", name: "Lighthouse Physical Therapy", initials:"LP", entity:"PLLC", industry:"Healthcare",        owner:"Marcus T.", openTasks: 6,  flag:"needs-review", opened: "3w ago" },
  { id: "fjord",      name: "Fjord Outdoor Gear",     initials: "FO", entity: "LLC",   industry: "Retail",            owner: "Priya S.",  openTasks: 0,  flag: null,        opened: "3w ago" },
  { id: "tinder",     name: "Tinderbox Press",        initials: "TP", entity: "LLC",   industry: "Publishing",        owner: "Jordan R.", openTasks: 1,  flag: null,        opened: "4w ago" },
  { id: "crescent",   name: "Crescent Veterinary",    initials: "CV", entity: "PLLC",  industry: "Healthcare",        owner: "Marcus T.", openTasks: 0,  flag: null,        opened: "1mo ago" },
  { id: "junction",   name: "Junction Cafe & Bar",    initials: "JC", entity: "LLC",   industry: "Food & Beverage",   owner: "Priya S.",  openTasks: 2,  flag: null,        opened: "1mo ago" },
  { id: "stoneoak",   name: "Stoneoak Property Mgmt", initials: "SO", entity: "LLC",   industry: "Real Estate",       owner: "Jordan R.", openTasks: 4,  flag: null,        opened: "1mo ago" },
  { id: "fernwood",   name: "Fernwood Childcare",     initials: "FC", entity: "LLC",   industry: "Education",         owner: "Marcus T.", openTasks: 0,  flag: null,        opened: "2mo ago" },
  { id: "whitepeak",  name: "Whitepeak Ski Lodge",    initials: "WP", entity: "S-Corp",industry: "Hospitality",       owner: "Priya S.",  openTasks: 0,  flag: "archived",   opened: "3mo ago" },
  { id: "harborline", name: "Harborline Watch Co.",   initials: "HW", entity: "LLC",   industry: "Manufacturing",     owner: "Jordan R.", openTasks: 0,  flag: "archived",   opened: "5mo ago" },
];

/* =====================================================================
   Client row (shared between picker and Clients list)
   ===================================================================== */
function ClientRowMeta({ c, compact = false }) {
  return (
    <>
      <Avatar size={compact ? 28 : 32}>{c.initials}</Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{c.name}</span>
          {c.pinned && <span className="text-warning" title="Pinned">{I.starOn}</span>}
        </div>
        <div className="text-[11px] text-text-soft truncate">
          <span className="font-mono">{c.entity}</span>
          <span className="mx-1.5">·</span>
          <span>{c.industry}</span>
        </div>
      </div>
    </>
  );
}

/* =====================================================================
   Client Picker — Dialog + Command palette
   ===================================================================== */
function ClientPicker({ open, onOpenChange, currentId = "atlas", onSelect }) {
  const [q, setQ] = usePk("");
  const [activeIdx, setActiveIdx] = usePk(0);

  // Reset query when opening
  useEffectPk(() => { if (open) { setQ(""); setActiveIdx(0); } }, [open]);

  const filtered = useMemoPk(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CLIENTS;
    return CLIENTS.filter(c =>
      c.name.toLowerCase().includes(needle) ||
      c.entity.toLowerCase().includes(needle) ||
      c.industry.toLowerCase().includes(needle) ||
      c.owner.toLowerCase().includes(needle)
    );
  }, [q]);

  const pinned = filtered.filter(c => c.pinned);
  const others = filtered.filter(c => !c.pinned);

  // Flat ordered list for keyboard nav
  const flat = useMemoPk(() => [...pinned, ...others], [pinned, others]);

  useEffectPk(() => { setActiveIdx(0); }, [q]);

  useEffectPk(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); const c = flat[activeIdx]; if (c) onSelect?.(c); onOpenChange(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, flat, activeIdx]);

  const pick = (c) => { onSelect?.(c); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px]">
        <CommandShell>
          <CommandInput value={q} onChange={setQ} placeholder="Search clients by name, industry, owner…" />
          <CommandList>
            {flat.length === 0 ? (
              <CommandEmpty>
                <div className="mb-2 text-foreground font-medium">No clients match “{q}”</div>
                <div>Try a different search term, or <a className="text-primary hover:underline" href="#">add a new client</a>.</div>
              </CommandEmpty>
            ) : (
              <>
                {pinned.length > 0 && (
                  <CommandGroup heading="Pinned">
                    {pinned.map((c, i) => (
                      <ClientPickerItem key={c.id}
                        c={c}
                        active={i === activeIdx}
                        current={c.id === currentId}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => pick(c)}
                      />
                    ))}
                  </CommandGroup>
                )}
                {others.length > 0 && (
                  <CommandGroup heading={pinned.length > 0 ? `All clients · ${others.length}` : `Clients · ${others.length}`}
                                action={<a className="text-[11px] text-primary hover:underline" href="Clients.html">Manage →</a>}>
                    {others.map((c, i) => {
                      const idx = pinned.length + i;
                      return (
                        <ClientPickerItem key={c.id}
                          c={c}
                          active={idx === activeIdx}
                          current={c.id === currentId}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => pick(c)}
                        />
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
          <CommandFooter>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd><span>navigate</span></span>
              <span className="flex items-center gap-1"><Kbd>↵</Kbd><span>open</span></span>
              <span className="flex items-center gap-1"><Kbd>esc</Kbd><span>close</span></span>
            </div>
            <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <span className="w-3.5 h-3.5 grid place-items-center">{I.plus}</span>
              <span>Add new client</span>
            </button>
          </CommandFooter>
        </CommandShell>
      </DialogContent>
    </Dialog>
  );
}

function ClientPickerItem({ c, active, current, onMouseEnter, onClick }) {
  return (
    <CommandItem active={active} onMouseEnter={onMouseEnter} onClick={onClick}>
      <ClientRowMeta c={c} compact />
      <div className="hidden md:flex items-center gap-3 text-[11px] text-text-soft">
        {c.flag === "needs-review" && <Badge variant="warning" dot>{c.openTasks} to review</Badge>}
        {c.flag === "archived" && <Badge variant="default">Archived</Badge>}
        {c.flag === null && c.openTasks > 0 && <span className="font-mono tnum">{c.openTasks} open</span>}
        <span className="w-20 text-right">{c.opened}</span>
      </div>
      {current && <Badge variant="accent">Current</Badge>}
    </CommandItem>
  );
}

Object.assign(window, { CLIENTS, ClientPicker, ClientRowMeta });
