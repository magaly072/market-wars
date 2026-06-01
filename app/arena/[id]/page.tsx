
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, addDoc, updateDoc, collection, query, where } from 'firebase/firestore';
import { AssetId } from '@/lib/market-engine';
import { useMarket } from '@/hooks/use-market';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, XCircle, Trophy, Activity, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';

export function getLevelInfo(xp: number = 0) {
  const level = Math.floor(0.5 + Math.sqrt(0.25 + xp / 50));
  const currentLevelTotalXp = 50 * level * (level - 1);
  const nextLevelTotalXp = 50 * (level + 1) * level;
  const xpInCurrentLevel = xp - currentLevelTotalXp;
  const xpNeededForNextLevel = nextLevelTotalXp - currentLevelTotalXp;
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  let rank = 'Rookie';
  if (level >= 31) rank = 'Market Legend';
  else if (level >= 21) rank = 'Elite Trader';
  else if (level >= 11) rank = 'Professional';
  else if (level >= 6) rank = 'Trader';

  let color = 'bg-slate-500/20 text-slate-500 border-slate-500/50';
  if (level >= 31) color = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
  else if (level >= 21) color = 'bg-purple-500/20 text-purple-500 border-purple-500/50';
  else if (level >= 11) color = 'bg-blue-500/20 text-blue-500 border-blue-500/50';
  else if (level >= 6) color = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';

  return { level, rank, color, progress, xpInCurrentLevel, xpNeededForNextLevel };
}

interface BattleReport {
  asset: string;
  direction: string;
  pnl: number;
  roi: number;
  xpEarned: number;
  coinsEarned: number;
  isWin: boolean;
}

export default function ArenaPage() {
  const { id: tournamentId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { prices, histories } = useMarket();
  const { toast } = useToast();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [selectedAsset] = useState<AssetId>('BTC/USD');
  const [battleReport, setBattleReport] = useState<BattleReport | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userRef);

  const activeTradesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !tournamentId) return null;
    return query(
      collection(firestore, 'trades'),
      where('userId', '==', user.uid),
      where('status', '==', 'Open'),
      where('tournamentId', '==', tournamentId)
    );
  }, [firestore, user?.uid, tournamentId]);
  const { data: activeTrades } = useCollection(activeTradesQuery);

  const progression = getLevelInfo(userData?.xp || 0);
  const equity = userData?.balance || 10000;
  const currentPrice = prices[selectedAsset] || 0;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      width: container.clientWidth || 400,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && histories[selectedAsset]) {
      const data = histories[selectedAsset].map(d => ({
        time: d.time as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      const uniqueData = Array.from(new Map(data.map(item => [item.time, item])).values())
        .sort((a: any, b: any) => a.time - b.time);
      
      seriesRef.current.setData(uniqueData);
    }
  }, [histories, selectedAsset]);

  const executeTrade = (direction: 'Long' | 'Short') => {
    if (!user || !firestore) return;
    const tradeData = {
      userId: user.uid,
      tournamentId: tournamentId as string,
      asset: selectedAsset,
      direction,
      leverage: 10,
      positionSize: 1000,
      entryPrice: currentPrice,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    
    addDoc(collection(firestore, 'trades'), tradeData).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'trades', operation: 'create', requestResourceData: tradeData }));
    });
    
    toast({ title: 'POSITION OPEN', description: `${direction} ${selectedAsset}` });
  };

  const handleCloseTrade = async (trade: any) => {
    if (!firestore || !user || !userData) return;
    const livePrice = prices[trade.asset] || trade.entryPrice;
    const isLong = trade.direction === 'Long';
    const priceDiff = isLong ? (livePrice - trade.entryPrice) : (trade.entryPrice - livePrice);
    const finalPnl = (priceDiff / trade.entryPrice) * trade.positionSize * trade.leverage;
    const isWin = finalPnl >= 0;

    updateDoc(doc(firestore, 'trades', trade.id), { 
      status: 'Closed', exitPrice: livePrice, pnl: finalPnl, 
      closedAt: new Date().toISOString()
    });

    updateDoc(doc(firestore, 'users', user.uid), {
      balance: (userData.balance || 10000) + finalPnl,
      xp: (userData.xp || 0) + (isWin ? 50 : 10)
    });
    
    setBattleReport({
      asset: trade.asset, direction: trade.direction, pnl: finalPnl, roi: (finalPnl / trade.positionSize) * 100,
      xpEarned: 50, coinsEarned: 100, isWin
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto overflow-hidden h-screen text-foreground">
      <header className="px-4 py-3 bg-card/50 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-headline font-bold uppercase tracking-tight">{selectedAsset}</h1>
                <Badge variant="outline" className="text-[10px] font-bold border-green-500/20 text-green-400 bg-green-500/5">+2.45%</Badge>
              </div>
              <p className="text-xs font-code font-bold text-primary">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Equity</p>
             <p className="text-sm font-code font-bold text-white">${equity.toLocaleString()}</p>
             <div className="flex items-center gap-1.5 mt-0.5">
               <Badge className={cn("text-[8px] font-bold border-none h-3.5 px-1.5", progression.color)}>LVL {progression.level}</Badge>
             </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="chart" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-4 bg-card/30 h-10 border-b border-white/5 p-1 rounded-none">
          <TabsTrigger value="chart" className="text-[10px] font-bold uppercase tracking-widest">Chart</TabsTrigger>
          <TabsTrigger value="intel" className="text-[10px] font-bold uppercase tracking-widest">Intel</TabsTrigger>
          <TabsTrigger value="news" className="text-[10px] font-bold uppercase tracking-widest">News</TabsTrigger>
          <TabsTrigger value="challenge" className="text-[10px] font-bold uppercase tracking-widest">Eval</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="flex-1 m-0 flex flex-col overflow-hidden bg-[#09090b]">
          <div 
            ref={chartContainerRef}
            id="tradingview-container"
            style={{ 
              width: '100%', 
              height: '450px', 
              minHeight: '450px',
              display: 'block',
              position: 'relative',
              backgroundColor: '#09090b'
            }}
          />

          <div className="flex-1 bg-card/50 border-t border-white/5 p-4 flex flex-col gap-4 overflow-y-auto pb-24">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="h-14 bg-green-500 hover:bg-green-600 text-black font-bold rounded-2xl text-base shadow-lg shadow-green-500/10 flex flex-col" 
                onClick={() => executeTrade('Long')}
              >
                <span>BUY / LONG</span>
                <span className="text-[9px] opacity-60 font-code tracking-widest">MARKET EXEC</span>
              </Button>
              <Button 
                className="h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-base shadow-lg shadow-red-500/10 flex flex-col" 
                onClick={() => executeTrade('Short')}
              >
                <span>SELL / SHORT</span>
                <span className="text-[9px] opacity-60 font-code tracking-widest">MARKET EXEC</span>
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Active Operations
              </h3>
              <div className="space-y-2">
                {activeTrades && activeTrades.length > 0 ? (
                  activeTrades.map((t: any) => {
                    const livePrice = prices[t.asset] || t.entryPrice;
                    const pnl = (t.direction === 'Long' ? (livePrice - t.entryPrice) : (t.entryPrice - livePrice)) / t.entryPrice * t.positionSize * t.leverage;
                    const isProfit = pnl >= 0;
                    return (
                      <div key={t.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", t.direction === 'Long' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                            {t.direction === 'Long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{t.asset}</span>
                              <span className="text-[9px] font-code opacity-40">{t.leverage}x</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-code">Entry: ${t.entryPrice.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn("font-code font-bold text-sm", isProfit ? 'text-green-500' : 'text-red-500')}>
                              {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                            </p>
                            <p className={cn("text-[9px] font-bold", isProfit ? 'text-green-500' : 'text-red-500')}>
                              {isProfit ? '+' : ''}{(pnl / t.positionSize * 100).toFixed(2)}%
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleCloseTrade(t)} className="h-8 w-8 text-red-500/50 hover:text-red-500 hover:bg-red-500/10">
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-30">No active operations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intel" className="flex-1 p-6 bg-background space-y-6 overflow-y-auto">
          <div className="space-y-4">
             <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2">
               <Zap className="w-4 h-4" /> AI Market Intelligence
             </h2>
             <Card className="bg-white/[0.02] border-white/5 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Current Sentiment</p>
                    <h3 className="text-2xl font-headline font-bold text-green-400">STRONGLY BULLISH</h3>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-2xl">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Confidence Score</span>
                    <span>88%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[88%]" />
                  </div>
                </div>
             </Card>
          </div>

          <div className="space-y-4">
             <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Target className="w-4 h-4" /> Tactical Parameters
             </h2>
             <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                 <p className="text-[8px] text-muted-foreground uppercase font-bold">Position Size</p>
                 <p className="text-sm font-code font-bold">$1,000</p>
               </div>
               <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                 <p className="text-[8px] text-muted-foreground uppercase font-bold">Max Risk %</p>
                 <p className="text-sm font-code font-bold">2.5%</p>
               </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="news" className="flex-1 p-6 bg-background">
           <div className="text-center py-20 opacity-30">
             <Activity className="w-10 h-10 mx-auto mb-4" />
             <p className="text-xs uppercase font-bold tracking-widest">Global News Feed Syncing...</p>
           </div>
        </TabsContent>

        <TabsContent value="challenge" className="flex-1 p-6 bg-background space-y-6">
          <Card className="bg-primary/5 border-primary/20 p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-4">Elite Prop Firm Evaluation</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Profit Target</span>
                <span className="text-green-400">+$12,000</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[35%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                   <p className="text-[8px] text-muted-foreground uppercase font-bold">Max Drawdown</p>
                   <p className="text-sm font-code font-bold text-red-400">-$4,000</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] text-muted-foreground uppercase font-bold">Time Limit</p>
                   <p className="text-sm font-code font-bold text-white">29 Days</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={battleReport !== null} onOpenChange={open => !open && setBattleReport(null)}>
        <DialogContent className="max-w-md w-[90%] p-8 bg-background/98 backdrop-blur-3xl rounded-[40px] border-none shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>Combat Result</DialogTitle></DialogHeader>
          {battleReport && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={cn("p-6 rounded-full", battleReport.isWin ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                {battleReport.isWin ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>
              <h2 className={cn("text-2xl font-headline font-bold uppercase", battleReport.isWin ? "text-green-500" : "text-red-500")}>
                {battleReport.isWin ? "OPERATION SUCCESS" : "OPERATION FAILURE"}
              </h2>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Realized PnL</p>
                <p className="text-3xl font-code font-bold">${battleReport.pnl.toFixed(2)}</p>
              </div>
              <Button onClick={() => setBattleReport(null)} className="w-full h-12 font-bold rounded-2xl uppercase tracking-widest bg-primary text-black">Confirm & Return</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Navigation />
    </div>
  );
}
