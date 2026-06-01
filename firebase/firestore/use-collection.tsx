'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        setData(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T)));
        setLoading(false);
        setError(null);
      },
      async (serverError: FirestoreError) => {
        if (serverError.code === 'permission-denied') {
          const path = (query as any)?._query?.path?.toArray()?.join('/') || 'collection';
          
          const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
          } satisfies SecurityRuleContext);
          
          setError(permissionError);
          errorEmitter.emit('permission-error', permissionError);
        } else if (serverError.code === 'failed-precondition') {
          // Log as warning to prevent the Next.js dev error overlay from disrupting the user
          console.warn('[Firestore Index Required]:', serverError.message);
          setError(serverError);
        } else {
          // Standard errors logged as warnings to avoid crashing the dev environment
          console.warn('[Firestore Query Error]:', serverError.code, serverError.message);
          setError(serverError);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [query]);

  return { data, loading, error };
}
