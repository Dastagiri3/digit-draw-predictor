import type { OHLCV } from "./indicators";

// Seeded random for reproducible demo data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateStockData(
  symbol: string,
  days = 252,
  basePrice = 150
): OHLCV[] {
  const seeds: Record<string, number> = {
    AAPL: 42, GOOGL: 137, MSFT: 88, AMZN: 256, TSLA: 314,
    NVDA: 777, META: 555, "BTC-USD": 999, "ETH-USD": 444, SPY: 123,
  };
  const rand = seededRandom(seeds[symbol] ?? 42);
  const volatility: Record<string, number> = {
    TSLA: 0.035, "BTC-USD": 0.04, "ETH-USD": 0.045,
  };
  const vol = volatility[symbol] ?? 0.018;
  const data: OHLCV[] = [];
  let price = basePrice;

  const start = new Date();
  start.setDate(start.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const drift = 0.0003;
    const change = drift + vol * (rand() - 0.48);
    price = price * (1 + change);

    const dayVol = vol * price;
    const open = price + (rand() - 0.5) * dayVol * 0.5;
    const high = Math.max(open, price) + rand() * dayVol * 0.8;
    const low = Math.min(open, price) - rand() * dayVol * 0.8;
    const volume = Math.floor(5_000_000 + rand() * 30_000_000);

    data.push({
      date: date.toISOString().split("T")[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume,
    });
  }
  return data;
}

export const DEMO_STOCKS: Record<string, { name: string; basePrice: number; sector: string }> = {
  AAPL: { name: "Apple Inc.", basePrice: 178, sector: "Technology" },
  GOOGL: { name: "Alphabet Inc.", basePrice: 141, sector: "Technology" },
  MSFT: { name: "Microsoft Corp.", basePrice: 378, sector: "Technology" },
  AMZN: { name: "Amazon.com Inc.", basePrice: 178, sector: "Consumer" },
  TSLA: { name: "Tesla Inc.", basePrice: 248, sector: "Automotive" },
  NVDA: { name: "NVIDIA Corp.", basePrice: 875, sector: "Technology" },
  META: { name: "Meta Platforms", basePrice: 505, sector: "Technology" },
  "BTC-USD": { name: "Bitcoin", basePrice: 67000, sector: "Crypto" },
  "ETH-USD": { name: "Ethereum", basePrice: 3400, sector: "Crypto" },
  SPY: { name: "S&P 500 ETF", basePrice: 520, sector: "Index" },
};

export function getLatestQuote(symbol: string) {
  const info = DEMO_STOCKS[symbol];
  if (!info) return null;
  const data = generateStockData(symbol, 5, info.basePrice);
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const change = latest.close - prev.close;
  const changePct = (change / prev.close) * 100;
  return { ...latest, symbol, name: info.name, change, changePct, sector: info.sector };
}

export function calculateSharpeRatio(returns: number[], riskFreeRate = 0.05): number {
  const n = returns.length;
  if (n < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const annualizedReturn = mean * 252;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (n - 1);
  const annualizedVol = Math.sqrt(variance * 252);
  if (annualizedVol === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVol;
}

export function calculateDailyReturns(closes: number[]): number[] {
  return closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
}
