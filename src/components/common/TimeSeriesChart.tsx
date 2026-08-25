type Series = {
  label: string;
  color: string;
  data: { date: string; value: number }[];
};

function buildPath(values: number[], max: number, close: boolean) {
  if (values.length === 0) return "";
  const stepX = 100 / Math.max(1, values.length - 1);
  const coords = values.map((v, i) => {
    const x = i * stepX;
    const y = max > 0 ? 100 - (v / max) * 100 : 100;
    return `${x},${y}`;
  });
  let path = `M${coords[0]} L ${coords.slice(1).join(" L ")}`;
  if (close) path += ` L 100,100 L 0,100 Z`;
  return path;
}

export function TimeSeriesChart({
  series,
  height = 140,
  formatValue = (v: number) => String(v),
  compact = false,
}: {
  series: Series[];
  height?: number;
  formatValue?: (v: number) => string;
  compact?: boolean;
}) {
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const max = Math.max(1, ...allValues);
  const firstDate = series[0]?.data[0]?.date;
  const lastDate = series[0]?.data[series[0].data.length - 1]?.date;

  if (compact) {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
        {series.map((s) => (
          <path
            key={s.label}
            d={buildPath(s.data.map((d) => d.value), max, false)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    );
  }

  return (
    <div>
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-[10px] text-muted-foreground shrink-0" style={{ height }}>
          <span>{formatValue(max)}</span>
          <span>{formatValue(max / 2)}</span>
          <span>0</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="flex-1 w-full" style={{ height }}>
          <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" className="text-border" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-border" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" className="text-border" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          {series.map((s) => {
            const values = s.data.map((d) => d.value);
            return (
              <g key={s.label}>
                <path d={buildPath(values, max, true)} fill={s.color} opacity={0.12} stroke="none" />
                <path
                  d={buildPath(values, max, false)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      </div>
      {firstDate && lastDate && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 pl-8">
          <span>{firstDate}</span>
          <span>{lastDate}</span>
        </div>
      )}
    </div>
  );
}
