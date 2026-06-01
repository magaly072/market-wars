"use client";

import { useMemoFirebase, useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, History, BarChart, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useMarket } from '@/hooks/use-market';
import { useMemo } from 'react';

export default function TradeHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { prices, isInitialized: marketReady } = useMarket();

  const tradesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'trades'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: trades, loading, error } = useCollection(tradesQuery);

  const processedTrades = useMemo(() => {
    if (!trades) return [];
    
    return [...trades].map((t: any) => {
      let pnl = t.pnl || 0;
      let roi = t.roi || (t.positionSize ? (pnl / t.positionSize) * 100 : 0);

      if (t.status === 'Open' && marketReady) {
        const currentPrice = prices[t.asset] || t.entryPrice;
        const isLong = t.direction === 'Long';
        const priceDiff = isLong ? (currentPrice - t.entryPrice) : (t.entryPrice - currentPrice);
        pnl = (priceDiff / t.entryPrice) * t.positionSize * t.leverage;
        roi = (pnl / t.positionSize) * 100;
      }

      return { ...t, pnl, roi };
    }).sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [trades, prices, marketReady]);

  return (
    <div className="min-h-screen bg-background pb-20 p-6 max-w-lg mx-auto overflow-x-hidden">
      <header className="mb-8 pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Combat Log</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70">
            Full Operational History
          </p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 trading-glow-primary">
          <History className="w-5 h-5 text-primary" />
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 w-full bg-card/40 animate-pulse rounded-xl border border-white/5" />
          ))}
        </div>
      ) : processedTrades && processedTrades.length > 0 ? (
        <div className="space-y-3">
          {processedTrades.map((trade: any) => {
            const isProfit = (trade.pnl || 0) >= 0;
            const isLong = trade.direction === 'Long';
            
            return (
              <Card key={trade.id} className={`bg-card/40 border-white/5 overflow-hidden transition-colors ${trade.status === 'Closed' ? 'opacity-80' : 'hover:bg-card/60'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/5 ${isProfit ? 'bg-secondary/5' : 'bg-destructive/5'}`}>
                        {isProfit ? <TrendingUp className={`w-5 h-5 ${trade.status === 'Open' ? 'text-secondary' : 'text-secondary/40'}`} /> : <TrendingDown className={`w-5 h-5 ${trade.status === 'Open' ? 'text-destructive' : 'text-destructive/40'}`} />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm tracking-tight">{trade.asset}</h4>
                          {trade.status === 'Open' && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[8px] h-4 px-1.5 font-bold uppercase border-none ${
                              isLong ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {trade.direction}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground font-code opacity-60">
                            {trade.leverage}x
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-code font-bold text-sm ${isProfit ? 'text-secondary' : 'text-destructive'}`}>
                        {isProfit ? '+' : ''}${Math.abs(trade.pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[9px] font-bold ${isProfit ? 'text-secondary' : 'text-destructive'}`}>
                        {trade.roi >= 0 ? '+' : ''}{trade.roi?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                      <Activity className="w-3 h-3 text-primary/40" />
                      <span>{trade.status === 'Open' ? 'Entry' : 'Exit'}: ${trade.status === 'Open' ? trade.entryPrice?.toLocaleString() : trade.exitPrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end text-[9px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                      <Clock className="w-3 h-3 text-primary/40" />
                      <span>{trade.status === 'Open' ? (trade.createdAt ? format(new Date(trade.createdAt), 'MMM dd HH:mm') : 'Unknown') : (trade.closedAt ? format(new Date(trade.closedAt), 'MMM dd HH:mm') : 'Archived')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-card/10">
          <History className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic text-sm">No historical combat records found.</p>
        </div>
      )}

      <Navigation />
    </div>
  );
}
