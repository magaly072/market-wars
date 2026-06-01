
"use client";

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: username });
      
      // Initialize user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        profilePhoto: `https://picsum.photos/seed/${user.uid}/200/200`,
        balance: 10000,
        totalProfit: 0,
        winRate: 0,
        rank: 'Novice',
        trades: 0,
        xp: 0,
        badges: ['New Recruit'],
        createdAt: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md border-secondary/20 bg-card/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-secondary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline">New Recruit</CardTitle>
          <CardDescription>Join the elite ranks of Market Wars</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Commander Name</Label>
              <Input 
                id="username" 
                placeholder="MarketMage" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Code (Password)</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <Button type="submit" className="w-full font-bold h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Begin Training'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="text-secondary hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
