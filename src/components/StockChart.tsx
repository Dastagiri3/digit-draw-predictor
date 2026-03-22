import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { OHLCV } from "@/lib/indicators";
import {
  calculateSMA,
  calculateBollingerBands,
} from "@/lib/indicators";

interface Props {
  data: OHLCV[];
  showSMA?: boolean;
  showBollinger?: boolean;
}

export default function StockChart({ data, showSMA = true, showBollinger = false }: Props) {
  const chartData = useMemo(() => {
    const closes = data.map((d) => d.close);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const bb = calculateBollingerBands(closes, 20);

    return data.map((d, i) => ({
      date: d.date,
      close: d.close,
      high: d.high,
      low: d.low,
      volume: d.volume,
      sma20: sma20[i],
      sma50: sma50[i],
      bbUpper: bb[i].upper,
      bbMiddle: bb[i].middle,
      bbLower: bb[i].lower,
    }));
  }, [data]);

  const minPrice = Math.min(...data.map((d) => d.low)) * 0.98;
  const maxPrice = Math.max(...data.map((d) => d.high)) * 1.02;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => v.slice(5)}
            className="fill-muted-foreground"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10 }}
            className="fill-muted-foreground"
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
            labelFormatter={(v) => v}
          />

          {showBollinger && (
            <>
              <Area dataKey="bbUpper" stroke="none" fill="hsl(var(--primary)/0.08)" />
              <Area dataKey="bbLower" stroke="none" fill="hsl(var(--background))" />
              <Line dataKey="bbUpper" stroke="hsl(var(--muted-foreground)/0.4)" strokeDasharray="4 2" dot={false} strokeWidth={1} />
              <Line dataKey="bbLower" stroke="hsl(var(--muted-foreground)/0.4)" strokeDasharray="4 2" dot={false} strokeWidth={1} />
            </>
          )}

          <Area
            dataKey="close"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary)/0.1)"
            strokeWidth={2}
            dot={false}
          />

          {showSMA && (
            <>
              <Line dataKey="sma20" stroke="hsl(var(--chart-2))" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
              <Line dataKey="sma50" stroke="hsl(var(--chart-3))" dot={false} strokeWidth={1.5} strokeDasharray="6 3" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={80}>
        <ComposedChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Bar dataKey="volume" fill="hsl(var(--muted-foreground)/0.2)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
