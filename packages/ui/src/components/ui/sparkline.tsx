export interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({ values, color = "hsl(var(--primary))", width = 72, height = 28, strokeWidth = 1.6 }: SparklineProps) {
  if (!values || values.length < 2) return null;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = pad + (i * (width - pad * 2)) / (values.length - 1);
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
