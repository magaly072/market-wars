
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ShoppingBag, Palette, User, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SHOP_ITEMS = [
  { id: 'titanium_skin', name: 'Titanium Skin', description: 'Metalic finish for your profile avatar.', price: 500, category: 'Skin', icon: User },
  { id: 'neon_border', name: 'Neon Border', description: 'Glow effect for your profile preview.', price: 1000, category: 'Border', icon: Palette },
  { id: 'deep_sea_theme', name: 'Deep Sea Theme', description: 'Oceanic colors for your arena dashboard.', price: 2500, category: 'Theme', icon: ShieldCheck },
  { id: 'firework_victory', name: 'Firework Victory', description: 'Celebratory effect upon mission success.', price: 5000, category: 'Effect', icon: Sparkles },
  { id: 'gold_commander', name: 'Gold Commander', description: 'Limited edition gold-plated avatar.', price: 10000, category: 'Skin', icon: User },
];

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc(userDocRef);

  const handlePurchase = async (item: typeof SHOP_ITEMS[0]) => {
    if (!firestore || !user?.uid || !userData) return;

    if ((userData.coins || 0) < item.price) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Funds',
        description: 'You need more Coins to acquire this item.',
      });
      return;
    }

    if (userData.inventory?.includes(item.id)) {
      toast({
        title: 'Already Owned',
        description: 'This tactical asset is already in your inventory.',
      });
      return;
    }

    const newCoins = userData.coins - item.price;
    updateDoc(doc(firestore, 'users', user.uid), {
      coins: newCoins,
      inventory: arrayUnion(item.id)
    });

    toast({
      title: 'Purchase Successful',
      description: `${item.name} has been added to your inventory.`,
      className: 'bg-secondary text-secondary-foreground font-bold'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 p-6 max-w-lg mx-auto overflow-x-hidden">
      <header className="mb-8 pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold uppercase tracking-tight">Tactical Shop</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70">
            Customize Your Operations
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20 trading-glow-accent">
            <Coins className="w-4 h-4 text-secondary" />
            <span className="text-sm font-code font-bold text-secondary">{userData?.coins || 0}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {SHOP_ITEMS.map((item) => {
          const isOwned = userData?.inventory?.includes(item.id);
          const Icon = item.icon;
          return (
            <Card key={item.id} className={`bg-card/40 border-white/5 overflow-hidden transition-all ${isOwned ? 'opacity-70' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isOwned ? 'bg-muted/50' : 'bg-primary/10 border border-primary/20'}`}>
                  <Icon className={`w-6 h-6 ${isOwned ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-sm tracking-tight">{item.name}</h4>
                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-none bg-white/5 uppercase opacity-60">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{item.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isOwned ? (
                    <div className="flex items-center gap-1 text-secondary text-[10px] font-bold uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Owned
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(item)}
                      className="h-9 px-4 font-bold rounded-lg text-xs gap-1.5"
                    >
                      <Coins className="w-3.5 h-3.5" /> {item.price}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 border border-dashed border-white/10 rounded-2xl bg-card/10 text-center">
        <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-20" />
        <p className="text-muted-foreground italic text-[11px] uppercase font-bold tracking-widest">More assets coming soon to the quartermaster.</p>
      </div>

      <Navigation />
    </div>
  );
}
