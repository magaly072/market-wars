"use client";

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Users, DollarSign, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function TournamentsPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const tournamentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Removed orderBy to ensure the page loads immediately without requiring composite indexes
    return collection(firestore, 'tournaments');
  }, [firestore]);

  const { data: tournaments, loading } = useCollection(tournamentsQuery);

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 p-6 max-w-lg mx-auto">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">Battle Arena</h1>
        <p className="text-muted-foreground">Select a tournament to enter the fray.</p>
      </header>

      <div className="space-y-4">
        {tournaments && tournaments.length > 0 ? (
          tournaments.map((t: any) => (
            <Card 
              key={t.id} 
              className="overflow-hidden border-white/5 bg-card/40 transition-all active:scale-[0.98] hover:bg-card/60 cursor-pointer"
              onClick={() => router.push(`/arena/${t.id}`)}
            >
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{t.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-code uppercase opacity-60">Pool: ${t.prizePool?.toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={t.isLive ? 'default' : 'secondary'} className={t.isLive ? 'bg-secondary text-[8px] h-4 animate-pulse' : 'text-[8px] h-4'}>
                    {t.isLive ? 'LIVE' : 'QUEUED'}
                  </Badge>
                </div>
                <div className="p-4 grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <Users className="w-3 h-3 mb-1 text-primary/60" />
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Players</span>
                    <span className="text-xs font-bold font-code">{t.activeTraders || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <DollarSign className="w-3 h-3 mb-1 text-secondary/60" />
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Entry</span>
                    <span className="text-xs font-bold font-code">${t.entryFeed || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <Clock className="w-3 h-3 mb-1 text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Duration</span>
                    <span className="text-xs font-bold font-code">24H</span>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Start Capital: <span className="text-primary">${t.startBalance?.toLocaleString() || '10,000'}</span></span>
                  <Button size="sm" className="font-bold h-8 text-[10px] uppercase tracking-widest gap-1">Enter Arena <ChevronRight className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-card/10">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground italic text-sm">No battle arenas currently deployed.</p>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
