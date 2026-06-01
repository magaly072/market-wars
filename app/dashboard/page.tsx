
"use client";

import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Award, ChevronRight, Zap, Trophy, Users, TrendingUp, Target, BarChart, Star, Coins, Shield, Crown, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useMarket } from '@/hooks/use-market';
import { getLevelInfo } from '@/app/arena/[id]/page';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function getLeagueInfo(balance: number = 10000) {
  const LEAGUES = [
    { name: 'Rookie', threshold: 10000, icon: Shield, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
    { name: 'Amateur', threshold: 25000, icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { name: 'Professional', threshold: 50000, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Elite', threshold: 100000, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { name: 'Master', threshold: 250000, icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { name: 'Market Legend', threshold: 1000000, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  ];

  let currentLeague = LEAGUES[0];
  let nextLeague = LEAGUES[1];

  for (let i = 0; i < LEAGUES.length; i++) {
    if (balance >= LEAGUES[i].threshold) {
      currentLeague = LEAGUES[i];
      nextLeague = LEAGUES[i + 1] || null;
    }
  }

  const progress = nextLeague 
    ? ((balance - currentLeague.threshold) / (nextLeague.threshold - currentLeague.threshold)) * 100 
    : 100;

  return { currentLeague, nextLeague, progress: Math.min(Math.max(progress, 0), 100) };
}

interface Mission {
  id: string;
  title: string;
  target: number;
  reward: number;
  type: 'coins' | 'badge';
  rewardValue: string | number;
}

const MISSIONS: Mission[] = [
  { id: 'trades_3', title: 'Complete 3 trades', target: 3, reward: 100, type: 'coins', rewardValue: 100 },
  { id: 'wins_2', title: 'Win 2 trades', target: 2, reward: 150, type: 'coins', rewardValue: 150 },
  { id: 'xp_100', title: 'Earn 100 XP', target: 100, reward: 200, type: 'coins', rewardValue: 200 },
  { id: 'btc_5', title: 'Trade BTC 5 times', target: 5, reward: 0, type: 'badge', rewardValue: 'BTC Legend' },
];

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { prices } = useMarket();
  const { toast } = useToast();
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (userData && firestore && user?.uid) {
      const today = new Date().toISOString().split('T')[0];
      if (userData.lastLoginReward !== today) {
        updateDoc(doc(firestore, 'users', user.uid), {
          coins: increment(50),
          lastLoginReward: today
        });
        toast({ title: "Daily Reward: +50 Coins" });
      }
    }
  }, [userData, firestore, user?.uid, toast]);

  const progression = getLevelInfo(userData?.xp || 0);
  const career = getLeagueInfo(userData?.balance || 10000);

  if (userLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-20 p-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">{userData?.username || 'Commander'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn("text-[9px] uppercase font-bold border-none", progression.color)}>
              {progression.rank} LVL {progression.level}
            </Badge>
            {userData?.isPremium && <Badge className="bg-yellow-500/20 text-yellow-500 text-[8px] border-none">PREMIUM</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20">
            <Coins className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-code font-bold text-secondary">{userData?.coins || 0}</span>
          </div>
        </div>
      </header>

      {/* Hero Progression */}
      <section className="mb-8 space-y-4">
        <Card className={cn("overflow-hidden border-2 shadow-2xl", career.currentLeague.border, career.currentLeague.bg)}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Career Status</p>
              <h3 className={cn("text-2xl font-headline font-bold uppercase tracking-tight", career.currentLeague.color)}>
                {career.currentLeague.name}
              </h3>
              <p className="text-xl font-code font-bold text-white">${(userData?.balance || 0).toLocaleString()}</p>
            </div>
            <career.currentLeague.icon className={cn("w-10 h-10", career.currentLeague.color)} />
          </CardContent>
          {career.nextLeague && (
            <div className="px-5 pb-5 space-y-2">
              <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                <span>Next: {career.nextLeague.name}</span>
                <span>Goal: ${career.nextLeague.threshold.toLocaleString()}</span>
              </div>
              <Progress value={career.progress} className="h-1 bg-white/5" />
            </div>
          )}
        </Card>
      </section>

      {/* Action Hub */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button className="h-24 rounded-2xl bg-primary flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/20" onClick={() => router.push('/tournaments')}>
          <Zap className="w-6 h-6" />
          <span className="text-xs font-bold uppercase">Enter Arena</span>
        </Button>
        <Button variant="outline" className="h-24 rounded-2xl border-white/5 flex flex-col items-center justify-center gap-2" onClick={() => router.push('/challenges')}>
          <Target className="w-6 h-6 text-secondary" />
          <span className="text-xs font-bold uppercase">Challenges</span>
        </Button>
      </div>

      {/* Daily Objectives */}
      <section className="mb-8">
        <h3 className="font-headline font-bold text-sm flex items-center gap-2 uppercase tracking-[0.15em] mb-4 opacity-60">
          <Award className="w-4 h-4 text-primary" /> Daily Objectives
        </h3>
        <div className="space-y-3">
          {MISSIONS.slice(0, 3).map(m => {
            const userMission = userData?.dailyMissions?.[m.id] || { progress: 0, claimed: false };
            return (
              <Card key={m.id} className="bg-card/40 border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase">{m.title}</span>
                  <span className="text-[10px] font-code text-primary">{userMission.progress}/{m.target}</span>
                </div>
                <Progress value={(userMission.progress / m.target) * 100} className="h-1 bg-white/5" />
              </Card>
            );
          })}
        </div>
      </section>

      <Navigation />
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="p-6 space-y-6"><Skeleton className="h-12 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-24 w-full" /></div>;
}
