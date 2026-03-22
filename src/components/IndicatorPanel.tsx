import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar } from "recharts";
import type { OHLCV } from "@/lib/indicators";
import { calculateRSI, calculateMACD } from "@/lib/indicators";

interface Props {
  data: OHLCV[];
  indicator: "rsi" | "macd";
}

export default function IndicatorPanel({ data, indicator }: Props) {
  const closes = useMemo(() => data.map((d) => d.close), [data]);

  if (indicator === "rsi") {
    const rsiValues = calculateRSI(closes);
    const chartData = data.map((d, i) => ({
      date: d.date,
      rsi: rsiValues[i] !== null ? +rsiValues[i]!.toFixed(2) : null,
    }));

    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">RSI (14)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} width={30} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: 11,
              }}
            />
            <ReferenceLine y={70} stroke="hsl(var(--destructive)/0.5)" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="hsl(var(--chart-2)/0.5)" strokeDasharray="3 3" />
            <Line dataKey="rsi" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // MACD
  const macdValues = calculateMACD(closes);
  const chartData = data.map((d, i) => ({
    date: d.date,
    macd: macdValues[i].macd !== null ? +macdValues[i].macd!.toFixed(2) : null,
    signal: macdValues[i].signal !== null ? +macdValues[i].signal!.toFixed(2) : null,
    histogram: macdValues[i].histogram !== null ? +macdValues[i].histogram!.toFixed(2) : null,
  }));

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">MACD (12, 26, 9)</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis tick={{ fontSize: 9 }} width={40} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: 11,
            }}
          />
          <Bar dataKey="histogram" fill="hsl(var(--primary)/0.3)" />
          <Line dataKey="macd" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
          <Line dataKey="signal" stroke="hsl(var(--destructive))" dot={false} strokeWidth={1.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
