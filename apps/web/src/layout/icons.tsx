import type { ReactNode } from "react";

interface IcnProps {
  d: ReactNode;
  size?: number;
  fill?: string;
  stroke?: string;
  sw?: number;
  className?: string;
}

export const Icn = ({ d, size = 16, fill = "none", stroke = "currentColor", sw = 1.6, className }: IcnProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

export const ICONS: Record<string, ReactNode> = {
  dash:      <Icn d={<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>} />,
  pl:        <Icn d={<><path d="M3 3v18h18"/><path d="M7 14l4-5 4 3 5-7"/></>} />,
  balance:   <Icn d={<><path d="M12 3v18"/><path d="M5 7h14"/><path d="M3 12c2 4 4 4 6 4s4 0 6-4"/><path d="M9 12c2 4 4 4 6 4s4 0 6-4"/></>} />,
  ledger:    <Icn d={<><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z"/><path d="M8 8h8M8 12h8M8 16h5"/></>} />,
  txns:      <Icn d={<><path d="M3 7h14l-3-3"/><path d="M21 17H7l3 3"/></>} />,
  accounts:  <Icn d={<><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="18" r="1" fill="currentColor"/></>} />,
  bank:      <Icn d={<><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></>} />,
  cats:      <Icn d={<><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/></>} />,
  clients:   <Icn d={<><circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2"/><path d="M21 18c0-2-1.5-3.5-4-3.5"/></>} />,
  staff:     <Icn d={<><circle cx="12" cy="8" r="3"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>} />,
  reports:   <Icn d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>} />,
  settings:  <Icn d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>} />,
  cal:       <Icn d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />,
  search:    <Icn d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} size={14} />,
  chevDown:  <Icn d={<polyline points="6 9 12 15 18 9"/>} size={14} />,
  chevRight: <Icn d={<polyline points="9 6 15 12 9 18"/>} size={14} />,
  chevUpDown:<Icn d={<><polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/></>} size={14} />,
  arrowUp:   <Icn d={<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>} size={12} sw={2} />,
  arrowDown: <Icn d={<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>} size={12} sw={2} />,
  refresh:   <Icn d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="21 3 21 8 16 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><polyline points="3 21 3 16 8 16"/></>} />,
  download:  <Icn d={<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>} />,
  print:     <Icn d={<><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M6 17h12v4H6z"/></>} />,
  more:      <Icn d={<><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></>} />,
  filter:    <Icn d={<path d="M3 5h18l-7 9v6l-4-2v-4Z"/>} />,
  share:     <Icn d={<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></>} />,
  zap:       <Icn d={<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>} />,
  trend:     <Icn d={<><path d="M3 17 9 11l4 4 8-9"/><polyline points="14 6 21 6 21 13"/></>} size={14} />,
  bell:      <Icn d={<><path d="M6 8a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8Z"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  plus:      <Icn d={<><path d="M12 5v14M5 12h14"/></>} sw={1.8} />,
  check:     <Icn d={<polyline points="20 6 9 17 4 12"/>} sw={2} size={14} />,
  x:         <Icn d={<><path d="M18 6 6 18M6 6l12 12"/></>} />,
  pin:       <Icn d={<><path d="M12 17v5"/><path d="M9 12v5h6v-5"/><path d="m9 12 2-9h2l2 9"/></>} size={14} />,
  alert:     <Icn d={<><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></>} />,
  link:      <Icn d={<><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></>} size={14} />,
  starOff:   <Icn d={<path d="M11 3.5 13.4 8.5l5.5.5-4.2 3.6 1.3 5.4L11 15.3 6 18l1.3-5.4L3.1 9l5.5-.5Z"/>} size={14} />,
  starOn:    <Icn d={<path d="M11 3.5 13.4 8.5l5.5.5-4.2 3.6 1.3 5.4L11 15.3 6 18l1.3-5.4L3.1 9l5.5-.5Z"/>} size={14} fill="currentColor" />,
  cmd:       <Icn d={<path d="M6 6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0M14 6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0M6 10h12M6 14h12"/>} size={12} />,
  health:    <Icn d={<><path d="M3 12h4l2-5 4 10 2-5h6"/></>} />,
  approve:   <Icn d={<><path d="M9 11l3 3 7-7"/><path d="M21 12a9 9 0 1 1-3.2-6.9"/></>} />,
  card:      <Icn d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M11 15h2"/></>} />,
};
