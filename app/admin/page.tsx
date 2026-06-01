
"use client";

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [entryFeed, setEntryFeed] = useState('0');
  const [startBalance, setStartBalance] = useState('10000');
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    const tournamentData = {
      title,
      prizePool: parseInt(prizePool),
      entryFeed: parseInt(entryFeed),
      startBalance: parseInt(startBalance),
      isLive: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      activeTraders: 0,
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'tournaments'), tournamentData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'tournaments',
          operation: 'create',
          requestResourceData: tournamentData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({ title: 'Success', description: 'Tournament deployment initiated.' });
    setTitle('');
    setPrizePool('');
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-lg mx-auto pb-20">
      <h1 className="text-3xl font-headline font-bold mb-8">Admin Nexus</h1>
      
      <Card className="bg-card/50 border-primary/20">
        <CardHeader>
          <CardTitle>Launch New Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div className="space-y-2">
              <Label>Tournament Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. BTC Volatility War" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prize Pool ($)</Label>
                <Input type="number" value={prizePool} onChange={e => setPrizePool(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Entry Feed ($)</Label>
                <Input type="number" value={entryFeed} onChange={e => setEntryFeed(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Starting Capital ($)</Label>
              <Input type="number" value={startBalance} onChange={e => setStartBalance(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-bold">Deploy to Arena</Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4">
        <h3 className="font-bold">Active Systems</h3>
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
          <span>Market Engine Status</span>
          <span className="text-secondary font-code">OPERATIONAL</span>
        </div>
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
          <span>AI Insight Engine</span>
          <span className="text-secondary font-code">OPERATIONAL</span>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
