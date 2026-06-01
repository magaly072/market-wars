
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Shield, Zap, AlertTriangle, CheckCircle2, Loader2, ChevronRight, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CHALLENGE_TYPES = [
  {
    id: 'Starter',
    title: 'Starter Challenge',
    initialBalance: 10000,
    profitTarget: 800, // +8%
    maxDrawdown: 500, // -5%
    xpReward: 1000,
    coinReward: 500,
    icon: Shield,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  },
  {
    id: 'Pro',
    title: 'Pro Challenge',
    initialBalance: 25000,
    profitTarget: 2500, // +10%
    maxDrawdown: 1250, // -5%
    xpReward: 5000,
    coinReward: 2000,
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'Elite',
    title: 'Elite Challenge',
    initialBalance: 100000,
    profitTarget: 12000, // +12%
    maxDrawdown: 4000, // -4%
    xpReward: 25000,
    coinReward: 10000,
    icon: Trophy,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  }
];

export default function ChallengesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const activeChallengeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'challenges'),
      where('userId', '==', user.uid),
      where('status', '==', 'Active'),
      limit(1)
    );
  }, [firestore, user?.uid]);

  const { data: activeChallenges, loading: challengesLoading } = useCollection(activeChallengeQuery);
  const activeChallenge = activeChallenges?.[0];

  const handleStartChallenge = async (type: typeof CHALLENGE_TYPES[0]) => {
    if (!firestore || !user?.uid) return;

    if (activeChallenge) {
      toast({
        variant: 'destructive',
        title: 'Challenge Active',
        description: 'You can only have one active challenge at a time.'
      });
      return;
    }

    const challengeData = {
      userId: user.uid,
      type: type.id,
      status: 'Active',
      initialBalance: type.initialBalance,
      currentBalance: type.initialBalance,
      highestBalance: type.initialBalance,
      profitTarget: type.profitTarget,
      maxDrawdown: type.maxDrawdown,
      xpReward: type.xpReward,
      coinReward: type.coinReward,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(firestore, 'challenges'), challengeData);
      toast({
        title: 'Challenge Initiated',
        description: `Your ${type.title} has begun. Good luck.`,
        className: 'bg-secondary text-secondary-foreground font-bold'
      });
      router.push('/tournaments'); // Send to arena selection
    } catch (e) {
      console.error(e);
    }
  };

  if (challengesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 p-6 max-w-lg mx-auto overflow-x-hidden">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">Prop Firm</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70">
          Evaluation Protocol
        </p>
      </header>

      {activeChallenge && (
        <section className="mb-10">
          <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2 uppercase tracking-[0.15em] opacity-80">
            <Target className="w-4 h-4 text-primary" /> Active Evaluation
          </h3>
          <Card className="bg-primary/5 border-primary/20 trading-glow-primary overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg mb-0.5">{activeChallenge.type} Challenge</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">STATUS: <span className="text-primary">IN PROGRESS</span></p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Equity</span>
                  <span>${activeChallenge.currentBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Target</span>
                  <span className="text-secondary">+${activeChallenge.profitTarget.toLocaleString()}</span>
                </div>
                {/* Simplified progress bar for profit */}
                <Progress 
                  value={Math.max(0, Math.min(100, ((activeChallenge.currentBalance - activeChallenge.initialBalance) / activeChallenge.profitTarget) * 100))} 
                  className="h-1.5 bg-white/5" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1">Max Loss</p>
                  <p className="text-sm font-code font-bold text-destructive">-${activeChallenge.maxDrawdown.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-[8px] text-muted-foreground uppercase font-bold mb-1">Current Loss</p>
                  <p className="text-sm font-code font-bold">
                    -${Math.max(0, (activeChallenge.highestBalance - activeChallenge.currentBalance)).toLocaleString()}
                  </p>
                </div>
              </div>

              <Button onClick={() => router.push('/tournaments')} className="w-full h-12 font-bold uppercase tracking-widest gap-2">
                Continue Trading <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <h3 className="text-sm font-headline font-bold mb-4 flex items-center gap-2 uppercase tracking-[0.15em] opacity-80">
        <History className="w-4 h-4 text-primary" /> Available Evaluations
      </h3>
      <div className="space-y-4">
        {CHALLENGE_TYPES.map((type) => (
          <Card key={type.id} className="bg-card/40 border-white/5 overflow-hidden transition-all hover:bg-card/60">
            <CardContent className="p-0">
              <div className="p-5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl", type.bg)}>
                    <type.icon className={cn("w-6 h-6", type.color)} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{type.title}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Capital: ${type.initialBalance.toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[8px] border-none bg-white/5">LEVEL {type.id === 'Starter' ? '1+' : type.id === 'Pro' ? '10+' : '20+'}</Badge>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4 bg-white/[0.01]">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Profit Target</p>
                  <p className="text-sm font-code font-bold text-secondary">+${type.profitTarget.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Max Drawdown</p>
                  <p className="text-sm font-code font-bold text-destructive">-${type.maxDrawdown.toLocaleString()}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <Button 
                  onClick={() => handleStartChallenge(type)} 
                  disabled={!!activeChallenge}
                  className="w-full font-bold uppercase tracking-widest h-11"
                >
                  Acquire License
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Navigation />
    </div>
  );
}
