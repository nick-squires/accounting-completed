import type { WorkloadClient, ActivityItem, DeadlineItem } from "../types";

export const WORKLOAD_CLIENTS: WorkloadClient[] = [
  { id: "atlas",      name: "Atlas Coffee Roasters",       initials: "AC", entity: "LLC",    industry: "Food & Beverage",  owner: "Scott T.",  openTasks: 3,  flag: null,           opened: "Now",       pinned: true,  spark: [42,48,56,52,61,58,64,72,68,74,82,78] },
  { id: "kestrel",    name: "Kestrel Studio",              initials: "KS", entity: "S-Corp", industry: "Design Agency",    owner: "Scott T.",  openTasks: 1,  flag: null,           opened: "2h ago",    pinned: true,  spark: [22,28,24,32,30,38,36,34,42,40,45,44] },
  { id: "northstar",  name: "Northstar Logistics",         initials: "NL", entity: "C-Corp", industry: "Logistics",        owner: "Priya S.",  openTasks: 12, flag: "needs-review",  opened: "Yesterday", pinned: true,  spark: [120,118,125,132,128,135,140,138,145,142,150,148] },
  { id: "highwire",   name: "Highwire Climbing Co.",       initials: "HC", entity: "LLC",    industry: "Retail",           owner: "Scott T.",  openTasks: 0,  flag: null,           opened: "Yesterday", pinned: true,  spark: [18,22,20,24,26,28,32,30,34,38,36,40] },
  { id: "meridian",   name: "Meridian Dental Group",       initials: "MD", entity: "PLLC",   industry: "Healthcare",       owner: "Marcus T.", openTasks: 5,  flag: null,           opened: "2d ago" },
  { id: "halcyon",    name: "Halcyon Yoga Studio",         initials: "HY", entity: "LLC",    industry: "Wellness",         owner: "Priya S.",  openTasks: 0,  flag: null,           opened: "2d ago" },
  { id: "brightwood", name: "Brightwood Pediatrics",       initials: "BP", entity: "PLLC",   industry: "Healthcare",       owner: "Marcus T.", openTasks: 2,  flag: null,           opened: "3d ago" },
  { id: "sentinel",   name: "Sentinel Security",           initials: "SS", entity: "LLC",    industry: "Services",         owner: "Scott T.",  openTasks: 14, flag: "needs-review",  opened: "3d ago" },
  { id: "ironvine",   name: "Ironvine Vineyards",          initials: "IV", entity: "LLC",    industry: "Beverage",         owner: "Priya S.",  openTasks: 1,  flag: null,           opened: "4d ago" },
  { id: "lumen",      name: "Lumen Architecture",          initials: "LA", entity: "PLLC",   industry: "Architecture",     owner: "Scott T.",  openTasks: 0,  flag: null,           opened: "5d ago" },
  { id: "anchor",     name: "Anchor & Oak Furniture",      initials: "AO", entity: "LLC",    industry: "Manufacturing",    owner: "Marcus T.", openTasks: 4,  flag: null,           opened: "1w ago" },
  { id: "verdant",    name: "Verdant Landscape Co.",       initials: "VL", entity: "S-Corp", industry: "Services",         owner: "Priya S.",  openTasks: 0,  flag: null,           opened: "1w ago" },
  { id: "bluepine",   name: "Bluepine Brewing",            initials: "BB", entity: "LLC",    industry: "Beverage",         owner: "Scott T.",  openTasks: 7,  flag: null,           opened: "1w ago" },
  { id: "covecast",   name: "Covecast Marketing",          initials: "CM", entity: "LLC",    industry: "Marketing",        owner: "Marcus T.", openTasks: 2,  flag: null,           opened: "1w ago" },
  { id: "ledgerly",   name: "Ledgerly Consulting",         initials: "LC", entity: "S-Corp", industry: "Consulting",       owner: "Priya S.",  openTasks: 0,  flag: null,           opened: "2w ago" },
  { id: "saltwater",  name: "Saltwater Surf Shop",         initials: "SW", entity: "LLC",    industry: "Retail",           owner: "Scott T.",  openTasks: 1,  flag: null,           opened: "2w ago" },
  { id: "rivergate",  name: "Rivergate Realty",            initials: "RR", entity: "LLC",    industry: "Real Estate",      owner: "Marcus T.", openTasks: 3,  flag: null,           opened: "2w ago" },
  { id: "polestar",   name: "Polestar Engineering",        initials: "PE", entity: "C-Corp", industry: "Engineering",      owner: "Priya S.",  openTasks: 0,  flag: null,           opened: "2w ago" },
  { id: "amber",      name: "Amber & Ivy Bakery",          initials: "AI", entity: "LLC",    industry: "Food & Beverage",  owner: "Scott T.",  openTasks: 0,  flag: null,           opened: "3w ago" },
  { id: "lighthouse", name: "Lighthouse Physical Therapy", initials: "LP", entity: "PLLC",   industry: "Healthcare",       owner: "Marcus T.", openTasks: 6,  flag: "needs-review",  opened: "3w ago" },
  { id: "fjord",      name: "Fjord Outdoor Gear",          initials: "FO", entity: "LLC",    industry: "Retail",           owner: "Priya S.",  openTasks: 0,  flag: null,           opened: "3w ago" },
  { id: "tinder",     name: "Tinderbox Press",             initials: "TP", entity: "LLC",    industry: "Publishing",       owner: "Scott T.",  openTasks: 1,  flag: null,           opened: "4w ago" },
  { id: "crescent",   name: "Crescent Veterinary",         initials: "CV", entity: "PLLC",   industry: "Healthcare",       owner: "Marcus T.", openTasks: 0,  flag: null,           opened: "1mo ago" },
  { id: "junction",   name: "Junction Cafe & Bar",         initials: "JC", entity: "LLC",    industry: "Food & Beverage",  owner: "Priya S.",  openTasks: 2,  flag: null,           opened: "1mo ago" },
  { id: "stoneoak",   name: "Stoneoak Property Mgmt",      initials: "SO", entity: "LLC",    industry: "Real Estate",      owner: "Scott T.",  openTasks: 4,  flag: null,           opened: "1mo ago" },
  { id: "fernwood",   name: "Fernwood Childcare",          initials: "FC", entity: "LLC",    industry: "Education",        owner: "Marcus T.", openTasks: 0,  flag: null,           opened: "2mo ago" },
  { id: "whitepeak",  name: "Whitepeak Ski Lodge",         initials: "WP", entity: "S-Corp", industry: "Hospitality",      owner: "Priya S.",  openTasks: 0,  flag: "archived",     opened: "3mo ago" },
  { id: "harborline", name: "Harborline Watch Co.",        initials: "HW", entity: "LLC",    industry: "Manufacturing",    owner: "Scott T.",  openTasks: 0,  flag: "archived",     opened: "5mo ago" },
];

export const ACTIVITY: ActivityItem[] = [
  { who: "Priya S.",  initials: "PS", action: "approved 18 transactions for", client: "Northstar Logistics",  what: "Bank rules matched · $12,480.21",              time: "8m ago",    kind: "approve" },
  { who: "Scott T.",  initials: "ST", action: "reconciled May statement for",  client: "Atlas Coffee Roasters", what: "Chase Business Checking ·5847",              time: "32m ago",   kind: "reconcile" },
  { who: "System",    initials: "··", action: "pulled new bank transactions for", client: "Sentinel Security",  what: "14 new transactions from Finicity",        time: "1h ago",    kind: "system" },
  { who: "Marcus T.", initials: "MT", action: "asked a question on",          client: "Meridian Dental Group", what: "“Is this travel re-imbursable?”",        time: "2h ago",    kind: "comment" },
  { who: "Priya S.",  initials: "PS", action: "closed April period for",      client: "Halcyon Yoga Studio",   what: "Books locked through 04/30/26",                    time: "Yesterday", kind: "close" },
  { who: "Scott T.",  initials: "ST", action: "created a new rule on",        client: "Atlas Coffee Roasters", what: "“Square Settlement” → 4020 Retail",  time: "Yesterday", kind: "rule" },
  { who: "System",    initials: "··", action: "flagged 2 duplicate entries on", client: "Bluepine Brewing",    what: "Possible duplicates · awaiting review", time: "2d ago",    kind: "alert" },
];

export const DEADLINES: DeadlineItem[] = [
  { date: "May 30", label: "Sales tax filing — CA",       client: "Atlas Coffee Roasters",  in: "2 days",  urgent: true },
  { date: "May 31", label: "Monthly close — May",         client: "Atlas Coffee Roasters",  in: "3 days",  urgent: true },
  { date: "Jun 02", label: "Quarterly estimates — Q2",    client: "Kestrel Studio",          in: "5 days" },
  { date: "Jun 05", label: "Form 941 — payroll taxes",    client: "Northstar Logistics",     in: "8 days" },
  { date: "Jun 10", label: "Worker's comp audit",              client: "Anchor & Oak Furniture",  in: "13 days" },
  { date: "Jun 15", label: "Quarterly estimates — Q2",    client: "Sentinel Security",       in: "18 days" },
];
