import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLatestQuote, DEMO_STOCKS, calculateDailyReturns, calculateSharpeRatio, generateStockData } from "@/lib/stockData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  avg_cost: number;
}

const Portfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSymbol, setNewSymbol] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newCost, setNewCost] = useState("");

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["portfolio", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Holding[];
    },
  });

  const addHolding = useMutation({
    mutationFn: async () => {
      if (!newSymbol || !newShares || !newCost) throw new Error("Fill all fields");
      const { error } = await supabase.from("portfolios").insert({
        user_id: user!.id,
        symbol: newSymbol.toUpperCase(),
        shares: parseFloat(newShares),
        avg_cost: parseFloat(newCost),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      setNewSymbol("");
      setNewShares("");
      setNewCost("");
      toast.success("Holding added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeHolding = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Holding removed");
    },
  });

  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    const enriched = holdings.map((h) => {
      const quote = getLatestQuote(h.symbol);
      const currentPrice = quote?.close ?? h.avg_cost;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.avg_cost;
      const pnl = value - cost;
      totalValue += value;
      totalCost += cost;
      return { ...h, currentPrice, value, pnl, pnlPct: (pnl / cost) * 100 };
    });

    // Compute portfolio Sharpe ratio using weighted returns
    const allReturns: number[] = [];
    enriched.forEach((h) => {
      const info = DEMO_STOCKS[h.symbol];
      if (info) {
        const data = generateStockData(h.symbol, 252, info.basePrice);
        const closes = data.map((d) => d.close);
        const returns = calculateDailyReturns(closes);
        const weight = h.value / (totalValue || 1);
        returns.forEach((r, i) => {
          allReturns[i] = (allReturns[i] ?? 0) + r * weight;
        });
      }
    });

    const sharpe = calculateSharpeRatio(allReturns);

    return { enriched, totalValue, totalCost, totalPnl: totalValue - totalCost, sharpe };
  }, [holdings]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Sign in to track your portfolio</p>
            <p className="text-sm text-muted-foreground mt-1">Your holdings are saved to your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold" style={{ lineHeight: "1.1" }}>Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Track holdings with risk-adjusted metrics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold tabular-nums">${portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-xl font-bold tabular-nums ${portfolioStats.totalPnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {portfolioStats.totalPnl >= 0 ? "+" : ""}${portfolioStats.totalPnl.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
            <p className="text-xl font-bold tabular-nums">{portfolioStats.sharpe.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Holdings</p>
            <p className="text-xl font-bold tabular-nums">{holdings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add holding */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add Holding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Symbol</Label>
              <Select value={newSymbol} onValueChange={setNewSymbol}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(DEMO_STOCKS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Shares</Label>
              <Input type="number" value={newShares} onChange={(e) => setNewShares(e.target.value)} placeholder="10" className="w-24" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Avg Cost</Label>
              <Input type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="150.00" className="w-28" />
            </div>
            <Button onClick={() => addHolding.mutate()} disabled={addHolding.isPending} size="sm">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Holdings table */}
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : portfolioStats.enriched.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No holdings yet. Add your first position above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">Symbol</th>
                    <th className="text-right py-2 px-3">Shares</th>
                    <th className="text-right py-2 px-3">Avg Cost</th>
                    <th className="text-right py-2 px-3">Current</th>
                    <th className="text-right py-2 px-3">Value</th>
                    <th className="text-right py-2 px-3">P&L</th>
                    <th className="text-right py-2 pl-3" />
                  </tr>
                </thead>
                <tbody>
                  {portfolioStats.enriched.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{h.symbol}</td>
                      <td className="text-right py-2.5 px-3 tabular-nums">{h.shares}</td>
                      <td className="text-right py-2.5 px-3 tabular-nums">${h.avg_cost.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-3 tabular-nums">${h.currentPrice.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-3 tabular-nums">${h.value.toFixed(0)}</td>
                      <td className="text-right py-2.5 px-3">
                        <Badge variant={h.pnl >= 0 ? "default" : "destructive"} className="tabular-nums text-[10px]">
                          {h.pnl >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                          {h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right py-2.5 pl-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeHolding.mutate(h.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;
