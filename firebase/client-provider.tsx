
'use client';

import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const initialized = initializeFirebase();
      setServices(initialized);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }

    const handleError = (error: any) => {
      if (error instanceof FirestorePermissionError) {
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: `You don't have permission to ${error.context.operation} at ${error.context.path}`,
        });
      }
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // Render a basic loading state while services are initializing to prevent crashes
  if (!services) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-code animate-pulse">SYSTEM INITIALIZING...</div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      app={services.app}
      firestore={services.firestore}
      auth={services.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
