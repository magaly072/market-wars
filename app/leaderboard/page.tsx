
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, where, orderBy } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Star, Target, Users, BarChart, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { getLevelInfo } from '@/app/arena/[id]/page';
import { getLeagueInfo } from '@/app/dashboard/page';
import { ASSETS } from '@/lib/market-engine';

export default function LeaderboardPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [assetFilter, setAssetFilter] = useState<string>('GLOBAL');

  const leadersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore]);

  const tradesQuery = useMemoFirebase(() => {
    if (!firestore || assetFilter === 'GLOBAL') return null;
    return query(
      collection(firestore, 'trades'),
      where('asset', '==', assetFilter),
      where('status', '==', 'Closed'),
      limit(200)
    );
  }, [firestore, assetFilter]);

  const { data: rawLeaders, loading: loadingUsers } = useCollection(leadersQuery);
  const { data: rawTrades, loading: loadingTrades } = useCollection(tradesQuery);

  const sortedLeaders = useMemo(() => {
    if (assetFilter === 'GLOBAL') {
      if (!rawLeaders) return [];
      return [...rawLeaders].sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0));
    }

    if (!rawTrades || !rawLeaders) return [];

    const userStats: Record<string, { pnl: number, count: number }> = {};
    rawTrades.forEach((t: any) => {
      if (!userStats[t.userId]) userStats[t.userId] = { pnl: 0, count: 0 };
      userStats[t.userId].pnl += (t.pnl || 0);
      userStats[t.userId].count += 1;
    });

    return rawLeaders
      .filter(u => !!userStats[u.id])
      .map(u => ({
        ...u,
        assetPnl: userStats[u.id].pnl,
        assetTrades: userStats[u.id].count
      }))
      .sort((a, b) => b.assetPnl - a.assetPnl);
  }, [rawLeaders, rawTrades, assetFilter]);

  const loading = loadingUsers || loadingTrades;

  return (
    <div className="min-h-screen bg-background pb-24 p-6 max-w-lg mx-auto overflow-x-hidden">
      <header className="mb-8 pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">Hall of Fame</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70">
              Top Global Elite
            </p>
          </div>
          <div className="p-3 bg-secondary/10 rounded-2xl border border-secondary/20 trading-glow-accent">
            <Trophy className="w-8 h-8 text-secondary" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary opacity-70" />
          <Select value={assetFilter} onValueChange={setAssetFilter}>
            <SelectTrigger className="w-full bg-card/50 border-white/5 font-bold h-9 text-xs">
              <SelectValue placeholder="Market Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GLOBAL">Global Equity</SelectItem>
              {ASSETS.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.id} Champions</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-[3rem_1fr_6rem] gap-2 px-4 mb-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
        <span className="text-center">Rank</span>
        <span>Commander</span>
        <span className="text-right">{assetFilter === 'GLOBAL' ? 'Equity' : 'Asset PnL'}</span>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-card/40 border border-white/5" />
          ))
        ) : sortedLeaders.length > 0 ? (
          sortedLeaders.map((user: any, index: number) => {
            const rank = index + 1;
            const isMe = currentUser?.uid === user.id;
            const value = assetFilter === 'GLOBAL' ? (user.balance || 10000) : (user.assetPnl || 0);
            const progression = getLevelInfo(user.xp || 0);
            const career = getLeagueInfo(user.balance || 10000);
            const CareerIcon = career.currentLeague.icon;

            return (
              <Card 
                key={user.id} 
                className={cn(
                  "overflow-hidden transition-all border-white/5",
                  isMe ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : "bg-card/40",
                  rank === 1 && !isMe && "border-yellow-500/20 bg-yellow-500/[0.02]"
                )}
              >
                <CardContent className="p-4 grid grid-cols-[3rem_1fr_6rem] items-center gap-2">
                  <div className="flex flex-col items-center justify-center">
                    {rank === 1 ? (
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    ) : rank === 2 ? (
                      <Medal className="w-6 h-6 text-slate-300" />
                    ) : rank === 3 ? (
                      <Medal className="w-6 h-6 text-amber-600" />
                    ) : (
                      <span className="font-code font-bold text-muted-foreground opacity-60">#{rank}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={user.profilePhoto} />
                      <AvatarFallback className="bg-muted text-[10px] font-bold">
                        {user.username?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="overflow-hidden">
                      <h4 className={cn("font-bold text-sm leading-tight truncate flex items-center gap-1", isMe && "text-primary")}>
                        {user.username}
                        {isMe && <Badge className="text-[8px] h-3 px-1 bg-primary/20 text-primary border-none uppercase">YOU</Badge>}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${career.currentLeague.bg} ${career.currentLeague.color}`}>
                          <CareerIcon className="w-2.5 h-2.5" /> {career.currentLeague.name}
                        </div>
                        {assetFilter !== 'GLOBAL' && (
                          <span className="text-[9px] text-muted-foreground font-bold">
                            {user.assetTrades} Ops
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className={cn("text-sm font-code font-bold leading-none", (assetFilter !== 'GLOBAL' && value < 0) ? 'text-destructive' : 'text-primary')}>
                      {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <div className="flex flex-col items-end opacity-60">
                      <span className="text-[9px] font-bold uppercase flex items-center gap-1">
                        LVL {progression.level}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-card/10">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground italic text-sm">No tactical data for this filter.</p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
