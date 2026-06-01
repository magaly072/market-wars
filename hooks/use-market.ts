
"use client";

import { useState, useEffect } from 'react';
import { ASSETS, generateNextCandle, getInitialHistory, calculateEMA, calculateRSI, PricePoint } from '@/lib/market-engine';

export function useMarket() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [histories, setHistories] = useState<Record<string, PricePoint[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    const initialHistories: Record<string, PricePoint[]> = {};
    
    ASSETS.forEach(a => {
      const history = getInitialHistory(a.id as any);
      initialPrices[a.id] = history[history.length - 1].close;
      initialHistories[a.id] = history;
    });

    setPrices(initialPrices);
    setHistories(initialHistories);
    setIsInitialized(true);

    const interval = setInterval(() => {
      setHistories(prev => {
        const next = { ...prev };
        ASSETS.forEach(asset => {
          const currentHistory = prev[asset.id] || [];
          const lastCandle = currentHistory[currentHistory.length - 1];
          const newCandle = generateNextCandle(lastCandle, asset.volatility);
          
          // Keep a rolling window of 100 points
          const newHistory = [...currentHistory, newCandle].slice(-100);
          
          // Re-calculate indicators
          newCandle.ema9 = calculateEMA(newHistory, 9);
          newCandle.ema20 = calculateEMA(newHistory, 20);
          newCandle.rsi = calculateRSI(newHistory, 14);
          
          next[asset.id] = newHistory;
        });
        return next;
      });

      setPrices(prev => {
        const next = { ...prev };
        ASSETS.forEach(asset => {
          setHistories(h => {
            if (h[asset.id]) {
              next[asset.id] = h[asset.id][h[asset.id].length - 1].close;
            }
            return h;
          });
        });
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { prices, histories, isInitialized };
}
