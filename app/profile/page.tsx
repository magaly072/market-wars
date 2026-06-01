
"use client";

import { useMemo, useState } from 'react';
import { useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, query, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Award, Shield, Trophy, Zap, BrainCircuit, Activity, BarChart3, Crown, Star, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLevelInfo } from '@/app/arena/[id]/page';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'matrix' | 'coaching'>('matrix');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !auth?.currentUser) return null;
    return doc(firestore, 'users', auth.currentUser.uid);
  }, [firestore, auth?.currentUser?.uid]);
  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  const tradesQuery = useMemoFirebase(() => {
    if (!firestore || !auth?.currentUser) return null;
    return query(
      collection(firestore, 'trades'), 
      where('userId', '==', auth.currentUser.uid),
      where('status', '==', 'Closed'),
      orderBy('closedAt', 'desc'),
      limit(50)
    );
  }, [firestore, auth?.currentUser?.uid]);
  const { data: closedTrades } = useCollection(tradesQuery);

  const handleGoPremium = () => {
    if (!firestore || !auth?.currentUser || !userData) return;
    if (userData.coins < 5000) {
      toast({ title: "Insufficient Coins", description: "Premium membership costs 5,000 Coins." });
      return;
    }
    updateDoc(userDocRef!, { 
      isPremium: true,
      coins: userData.coins - 5000
    });
    toast({ title: "Welcome to Elite Status", description: "You are now a Premium member." });
  };

  const progression = getLevelInfo(userData?.xp || 0);

  if (userLoading || !userData) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="relative h-48 bg-gradient-to-b from-primary/10 to-transparent flex flex-col items-center justify-center">
        <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary/20">
          <AvatarImage src={userData.profilePhoto} />
          <AvatarFallback>{userData.username?.substring(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="mt-3 text-center">
          <h1 className="text-xl font-headline font-bold flex items-center justify-center gap-2">
            {userData.username} {userData.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
          </h1>
          <Badge variant="outline" className={cn("text-[9px] uppercase border-none mt-1", progression.color)}>
            {progression.rank} LVL {progression.level}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive" onClick={() => signOut(auth)}><LogOut className="w-4 h-4" /></Button>
      </div>

      <div className="px-6 space-y-6 mt-4">
        {!userData.isPremium && (
          <Card className="bg-yellow-500/10 border-yellow-500/20 p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-yellow-500 flex items-center gap-2"><Star className="w-4 h-4" /> Go Premium</h3>
              <p className="text-[10px] opacity-70">1.5x XP & Coins, Exclusive Skins</p>
            </div>
            <Button size="sm" onClick={handleGoPremium} className="bg-yellow-500 hover:bg-yellow-600 text-background font-bold h-8">5,000 COINS</Button>
          </Card>
        )}

        <div className="flex bg-card/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('matrix')} className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg", activeTab === 'matrix' && "bg-primary text-primary-foreground")}>Stats</button>
          <button onClick={() => setActiveTab('coaching')} className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg", activeTab === 'coaching' && "bg-primary text-primary-foreground")}>Coaching</button>
        </div>

        {activeTab === 'matrix' ? (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in">
            <Card className="bg-card/40 border-white/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total XP</p>
              <p className="text-xl font-code font-bold">{userData.xp || 0}</p>
            </Card>
            <Card className="bg-card/40 border-white/5 p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Win Rate</p>
              <p className="text-xl font-code font-bold">{userData.winRate || 0}%</p>
            </Card>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            {closedTrades?.filter((t: any) => !!t.coaching).slice(0, 5).map((t: any) => (
              <Card key={t.id} className="bg-card/40 border-white/5 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase">{t.asset} {t.direction}</span>
                  <span className={cn("text-[10px] font-bold", t.pnl >= 0 ? "text-secondary" : "text-destructive")}>
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic leading-tight">"{t.coaching.feedback}"</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
