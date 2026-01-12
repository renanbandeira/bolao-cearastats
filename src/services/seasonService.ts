import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { deleteMatch, getMatchesBySeason } from './matchService';
import type { Season, SeasonInput, FinalRanking } from '../types';

/**
 * Create a new season
 */
export async function createSeason(input: SeasonInput): Promise<string> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // Check if there's already an active season
  const activeSeason = await getActiveSeason();

  if (activeSeason) {
    throw new Error(`There is already an active season: ${activeSeason.name} (ID: ${activeSeason.id}). End or delete it before creating a new one.`);
  }

  const seasonData = {
    name: input.name,
    startDate: Timestamp.fromDate(input.startDate),
    status: 'active' as const,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'seasons'), seasonData);
  return docRef.id;
}

/**
 * Get the active season
 */
export async function getActiveSeason(): Promise<Season | null> {
  const q = query(
    collection(db, 'seasons'),
    where('status', '==', 'active'),
    orderBy('startDate', 'desc')
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Season;
}

/**
 * Get all seasons
 */
export async function getAllSeasons(): Promise<Season[]> {
  const q = query(collection(db, 'seasons'), orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);

  const seasons = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Season[];

  return seasons;
}

/**
 * End a season with final rankings and reset all user totalPoints to 0
 */
export async function endSeason(
  seasonId: string,
  finalRankings: FinalRanking[]
): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // 1. Update season status and store final rankings
  const seasonRef = doc(db, 'seasons', seasonId);
  await updateDoc(seasonRef, {
    status: 'ended',
    endDate: serverTimestamp(),
    finalRankings,
  });

  // 2. Reset all user totalPoints to 0 for the new season
  const usersSnapshot = await getDocs(collection(db, 'users'));

  if (!usersSnapshot.empty) {
    // Process in batches (Firestore batch limit is 500 operations)
    const batchSize = 500;
    const users = usersSnapshot.docs;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = users.slice(i, i + batchSize);

      for (const userDoc of batchUsers) {
        const userRef = doc(db, 'users', userDoc.id);
        batch.update(userRef, {
          totalPoints: 0,
          lastUpdated: serverTimestamp(),
        });
      }

      try {
        await batch.commit();
      } catch (error) {
        console.error('Error resetting user points in batch:', error);
        throw new Error('Failed to reset user points: ' + (error as Error).message);
      }
    }
  }
}

/**
 * Delete a season and all associated matches and bets (admin only)
 * This will cascade delete all matches in the season, which will delete all bets
 * and recalculate user points
 */
export async function deleteSeason(seasonId: string): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // 1. Get all matches for this season
  const matches = await getMatchesBySeason(seasonId);

  // 2. Delete each match (which will cascade delete bets and recalculate points)
  for (const match of matches) {
    await deleteMatch(match.id);
  }

  // 3. Delete the season
  await deleteDoc(doc(db, 'seasons', seasonId));
}
