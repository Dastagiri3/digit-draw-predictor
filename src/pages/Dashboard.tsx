import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import StockChart from "@/components/StockChart";
import IndicatorPanel from "@/components/IndicatorPanel";
import { generateStockData, DEMO_STOCKS, getLatestQuote } from "@/lib/stockData";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "@/lib/indicators";

const FEATURED = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "BTC-USD"];

const Dashboard = () => {
  const [selected, setSelected] = useState("AAPL");
  const [showBollinger, setShowBollinger] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<"rsi" | "macd">("rsi");

  const stockData = useMemo(
    () => generateStockData(selected, 252, DEMO_STOCKS[selected]?.basePrice ?? 100),
    [selected]
  );

  const quotes = useMemo(() => FEATURED.map((s) => getLatestQuote(s)!), []);
  const latest = stockData[stockData.length - 1];
  const prev = stockData[stockData.length - 2];
  const change = latest.close - prev.close;
  const changePct = (change / prev.close) * 100;

  const closes = stockData.map((d) => d.close);
  const rsi = calculateRSI(closes);
  const latestRSI = rsi[rsi.length - 1];
  const macd = calculateMACD(closes);
  const latestMACD = macd[macd.length - 1];

  const signal = latestRSI !== null && latestRSI < 30
    ? "Oversold"
    : latestRSI !== null && latestRSI > 70
      ? "Overbought"
      : "Neutral";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold" style={{ lineHeight: "1.1" }}>Market Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Live market overview with technical analysis</p>
      </div>

      {/* Market ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quotes.map((q) => (
          <button
            key={q.symbol}
            onClick={() => setSelected(q.symbol)}
            className={`p-3 rounded-lg border text-left transition-all active:scale-[0.97] ${
              selected === q.symbol
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:shadow-sm"
            }`}
          >
            <p className="text-xs font-medium truncate">{q.symbol}</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">
              {q.close >= 1000 ? `$${(q.close / 1000).toFixed(1)}k` : `$${q.close.toFixed(2)}`}
            </p>
            <p className={`text-xs tabular-nums ${q.changePct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {q.changePct >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%
            </p>
          </button>
        ))}
      </div>

      {/* Main chart area */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{DEMO_STOCKS[selected]?.name ?? selected}</CardTitle>
                <Badge variant={changePct >= 0 ? "default" : "destructive"} className="tabular-nums">
                  {changePct >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={showBollinger ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBollinger(!showBollinger)}
                  className="text-xs h-7"
                >
                  BB
                </Button>
                <Button
                  variant={activeIndicator === "rsi" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveIndicator("rsi")}
                  className="text-xs h-7"
                >
                  RSI
                </Button>
                <Button
                  variant={activeIndicator === "macd" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveIndicator("macd")}
                  className="text-xs h-7"
                >
                  MACD
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StockChart data={stockData} showBollinger={showBollinger} />
            <div className="mt-3 border-t pt-3">
              <IndicatorPanel data={stockData} indicator={activeIndicator} />
            </div>
          </CardContent>
        </Card>

        {/* Stats sidebar */}
        <div className="space-y-3">
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-2xl font-bold tabular-nums">
                  ${latest.close >= 1000 ? latest.close.toLocaleString() : latest.close.toFixed(2)}
                </p>
                <p className={`text-sm tabular-nums ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {change >= 0 ? "+" : ""}${change.toFixed(2)} ({changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Open</p>
                  <p className="font-medium tabular-nums">${latest.open.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-medium tabular-nums">{(latest.volume / 1e6).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-muted-foreground">High</p>
                  <p className="font-medium tabular-nums">${latest.high.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Low</p>
                  <p className="font-medium tabular-nums">${latest.low.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3 space-y-2">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Indicators
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">RSI (14)</span>
                  <Badge variant={
                    latestRSI !== null && latestRSI > 70 ? "destructive" :
                    latestRSI !== null && latestRSI < 30 ? "default" : "secondary"
                  } className="text-[10px] h-5">
                    {latestRSI?.toFixed(1) ?? "—"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Signal</span>
                  <span className="font-medium">{signal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">MACD</span>
                  <span className={`font-medium tabular-nums ${
                    latestMACD.macd !== null && latestMACD.macd > 0 ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {latestMACD.macd?.toFixed(2) ?? "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3.5 h-3.5" /> Sector
              </p>
              <Badge variant="outline">{DEMO_STOCKS[selected]?.sector ?? "—"}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
