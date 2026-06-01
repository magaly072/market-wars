
export const ASSETS = [
  // Crypto
  { id: 'BTC/USD', name: 'Bitcoin', basePrice: 65000, volatility: 0.002, multiplier: 1.0 },
  { id: 'ETH/USD', name: 'Ethereum', basePrice: 3500, volatility: 0.003, multiplier: 1.2 },
  { id: 'SOL/USD', name: 'Solana', basePrice: 140, volatility: 0.005, multiplier: 1.5 },
  // Stocks
  { id: 'AAPL', name: 'Apple Inc.', basePrice: 220, volatility: 0.001, multiplier: 0.8 },
  { id: 'TSLA', name: 'Tesla Inc.', basePrice: 250, volatility: 0.004, multiplier: 1.3 },
  { id: 'NVDA', name: 'NVIDIA Corp.', basePrice: 120, volatility: 0.006, multiplier: 2.0 },
  // Forex
  { id: 'EUR/USD', name: 'Euro / US Dollar', basePrice: 1.08, volatility: 0.0003, multiplier: 0.5 },
  { id: 'GBP/USD', name: 'British Pound / US Dollar', basePrice: 1.27, volatility: 0.0004, multiplier: 0.6 },
  { id: 'USD/JPY', name: 'US Dollar / Japanese Yen', basePrice: 158.5, volatility: 0.0005, multiplier: 0.7 },
  // Indices
  { id: 'SPY', name: 'S&P 500 ETF', basePrice: 540, volatility: 0.0005, multiplier: 0.9 },
  { id: 'QQQ', name: 'Nasdaq 100 ETF', basePrice: 480, volatility: 0.0008, multiplier: 1.1 },
] as const;

export type AssetId = typeof ASSETS[number]['id'];

export interface PricePoint {
  time: number; // Seconds for Lightweight Charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema20?: number;
  rsi?: number;
}

export function calculateRSI(data: PricePoint[], period: number = 14): number {
  if (data.length <= period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i-1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i-1].close;
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function generateNextCandle(prevCandle: PricePoint, volatility: number): PricePoint {
  const open = prevCandle.close;
  const changePercent = (Math.random() - 0.5) * 2 * volatility;
  const drift = 0.00005;
  const close = open * (1 + changePercent + drift);
  const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
  const volume = Math.random() * 1000 + 500;

  return {
    time: prevCandle.time + 5, // 5 seconds step
    open,
    high,
    low,
    close,
    volume
  };
}

export function calculateEMA(data: PricePoint[], period: number): number {
  if (data.length < period) return data[data.length - 1].close;
  const k = 2 / (period + 1);
  let ema = data[0].close;
  for (let i = 1; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
  }
  return ema;
}

export function getInitialHistory(assetId: AssetId, points: number = 60): PricePoint[] {
  const asset = ASSETS.find(a => a.id === assetId)!;
  let currentPrice = asset.basePrice;
  const history: PricePoint[] = [];
  const nowInSeconds = Math.floor(Date.now() / 1000);
  
  let lastCandle: PricePoint = {
    time: nowInSeconds - (points * 5),
    open: currentPrice,
    high: currentPrice * 1.001,
    low: currentPrice * 0.999,
    close: currentPrice,
    volume: 1000
  };

  for (let i = 0; i < points; i++) {
    const next = generateNextCandle(lastCandle, asset.volatility);
    history.push(next);
    lastCandle = next;
  }

  // Add Indicators
  return history.map((p, i, arr) => {
    const subArr = arr.slice(0, i + 1);
    return {
      ...p,
      ema9: calculateEMA(subArr, 9),
      ema20: calculateEMA(subArr, 20),
      rsi: calculateRSI(subArr, 14)
    };
  });
}
