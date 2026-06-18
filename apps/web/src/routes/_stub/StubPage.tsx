import { useMatches } from "react-router-dom";

export function StubPage() {
  const matches = useMatches();
  const handle = matches.at(-1)?.handle as { title?: string } | undefined;
  const title = handle?.title ?? "Page";
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground text-[15px]">{title} — coming soon</p>
    </div>
  );
}
