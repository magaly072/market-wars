"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Zap, Trophy } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [auth, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="p-3 bg-primary/10 rounded-2xl trading-glow-primary">
            <TrendingUp className="w-12 h-12 text-primary" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 tracking-tight">
          MARKET <span className="text-primary">WARS</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 font-body max-w-lg mx-auto">
          The ultimate competitive trading arena. Master the markets, climb the leaderboard, and become a champion.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border text-left">
            <Zap className="text-secondary w-6 h-6" />
            <div>
              <p className="font-bold">Real-time Trading</p>
              <p className="text-sm text-muted-foreground">Up to 50x leverage simulation.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border text-left">
            <Trophy className="text-primary w-6 h-6" />
            <div>
              <p className="font-bold">Live Tournaments</p>
              <p className="text-sm text-muted-foreground">Compete for virtual prizes.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-lg px-12 h-14 font-bold rounded-xl"
            onClick={() => router.push('/login')}
          >
            Enter Arena
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-12 h-14 font-bold rounded-xl"
            onClick={() => router.push('/signup')}
          >
            Create Account
          </Button>
        </div>
      </div>

      <footer className="mt-20 text-muted-foreground text-sm font-code">
        v1.0.0-BETA // SYSTEM_STABLE
      </footer>
    </div>
  );
}
