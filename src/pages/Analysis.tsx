import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateStockData, DEMO_STOCKS } from "@/lib/stockData";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "@/lib/indicators";
import StockChart from "@/components/StockChart";

const Analysis = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stockData = useMemo(
    () => generateStockData(symbol, 252, DEMO_STOCKS[symbol]?.basePrice ?? 100),
    [symbol]
  );

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);

    try {
      const closes = stockData.map((d) => d.close);
      const rsi = calculateRSI(closes);
      const macd = calculateMACD(closes);
      const bb = calculateBollingerBands(closes);

      const last5 = stockData.slice(-5);
      const indicators = {
        rsi: rsi[rsi.length - 1]?.toFixed(2),
        macd: {
          macd: macd[macd.length - 1].macd?.toFixed(2),
          signal: macd[macd.length - 1].signal?.toFixed(2),
          histogram: macd[macd.length - 1].histogram?.toFixed(2),
        },
        bollingerBands: {
          upper: bb[bb.length - 1].upper?.toFixed(2),
          middle: bb[bb.length - 1].middle?.toFixed(2),
          lower: bb[bb.length - 1].lower?.toFixed(2),
        },
        sma20: closes.slice(-20).reduce((a, b) => a + b, 0) / 20,
        sma50: closes.slice(-50).reduce((a, b) => a + b, 0) / 50,
      };

      const { data, error } = await supabase.functions.invoke("analyze-stock", {
        body: { symbol, priceData: last5, indicators },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold" style={{ lineHeight: "1.1" }}>AI Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered stock analysis with technical indicators</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DEMO_STOCKS).map(([s, info]) => (
              <SelectItem key={s} value={s}>
                {s} — {info.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
          {loading ? "Analyzing..." : "Run AI Analysis"}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{DEMO_STOCKS[symbol]?.name}</CardTitle>
            <Badge variant="outline" className="text-xs">{DEMO_STOCKS[symbol]?.sector}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <StockChart data={stockData} showBollinger />
        </CardContent>
      </Card>

      {analysis && (
        <Card className="shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4" /> AI Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
          </CardContent>
        </Card>
      )}

      {!analysis && !loading && (
        <Card className="shadow-sm border-dashed">
          <CardContent className="py-12 text-center">
            <Brain className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select a stock and click "Run AI Analysis" to get insights</p>
            <p className="text-xs text-muted-foreground mt-1">Analysis includes trend, signals, risk assessment, and price targets</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analysis;
