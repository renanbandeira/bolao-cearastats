import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Match } from '../types';

type FilterType = 'all' | 'upcoming' | 'past' | 'open' | 'finished';

export function useMatches(filter: FilterType = 'all') {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'matches'));

    const now = Timestamp.now();

    switch (filter) {
      case 'upcoming':
        q = query(
          collection(db, 'matches'),
          where('matchDate', '>', now),
          orderBy('matchDate', 'asc')
        );
        break;
      case 'past':
        q = query(
          collection(db, 'matches'),
          where('matchDate', '<', now),
          orderBy('matchDate', 'desc')
        );
        break;
      case 'open':
        q = query(
          collection(db, 'matches'),
          where('status', '==', 'open'),
          orderBy('matchDate', 'asc')
        );
        break;
      case 'finished':
        q = query(
          collection(db, 'matches'),
          where('status', '==', 'finished'),
          orderBy('matchDate', 'desc')
        );
        break;
      default:
        q = query(collection(db, 'matches'), orderBy('matchDate', 'desc'));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => {
          const data = {
            id: doc.id,
            ...doc.data(),
          };
          console.log('useMatches - Mapped match:', data);
          return data;
        }) as Match[];
        console.log('useMatches - Total matches:', matchesData.length);
        setMatches(matchesData);
        setLoading(false);
      },
      (err) => {
        console.error('useMatches - Error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filter]);

  return { matches, loading, error };
}
