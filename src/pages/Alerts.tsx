import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEMO_STOCKS, getLatestQuote } from "@/lib/stockData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Alert {
  id: string;
  symbol: string;
  condition: string;
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
}

const Alerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState("above");
  const [threshold, setThreshold] = useState("");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
  });

  const addAlert = useMutation({
    mutationFn: async () => {
      if (!symbol || !threshold) throw new Error("Fill all fields");
      const { error } = await supabase.from("stock_alerts").insert({
        user_id: user!.id,
        symbol,
        condition,
        threshold: parseFloat(threshold),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setSymbol("");
      setThreshold("");
      toast.success("Alert created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert removed");
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Sign in to manage alerts</p>
            <p className="text-sm text-muted-foreground mt-1">Set price alerts for your watched stocks</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold" style={{ lineHeight: "1.1" }}>Price Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">Get notified when stocks hit your target prices</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Symbol</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(DEMO_STOCKS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Price Above</SelectItem>
                  <SelectItem value="below">Price Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price ($)</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="150.00" className="w-28" />
            </div>
            <Button onClick={() => addAlert.mutate()} disabled={addAlert.isPending} size="sm">Create</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No alerts set. Create one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => {
                const quote = getLatestQuote(a.symbol);
                const currentPrice = quote?.close ?? 0;
                const triggered = a.condition === "above"
                  ? currentPrice >= a.threshold
                  : currentPrice <= a.threshold;

                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant={triggered ? "destructive" : "secondary"} className="text-xs">
                        {a.symbol}
                      </Badge>
                      <span className="text-sm">
                        Price {a.condition} <span className="font-medium tabular-nums">${a.threshold.toFixed(2)}</span>
                      </span>
                      {triggered && (
                        <Badge variant="default" className="text-[10px] bg-amber-500">TRIGGERED</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Now: ${currentPrice.toFixed(2)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAlert.mutate(a.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
