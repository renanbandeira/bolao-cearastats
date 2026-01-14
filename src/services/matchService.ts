import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { getActiveSeason } from './seasonService';
import type { Match, MatchInput, MatchResults, MatchStatus } from '../types';

/**
 * Create a new match pool
 * Automatically associates the match with the active season
 */
export async function createMatch(input: MatchInput): Promise<string> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // Get the active season
  const activeSeason = await getActiveSeason();
  if (!activeSeason) {
    throw new Error('Não há uma temporada ativa. Crie uma temporada antes de criar um jogo.');
  }

  const matchData = {
    opponent: input.opponent,
    matchDate: Timestamp.fromDate(input.matchDate),
    status: 'open' as MatchStatus,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
    totalBets: 0,
    seasonId: activeSeason.id,
  };

  const docRef = await addDoc(collection(db, 'matches'), matchData);
  return docRef.id;
}

/**
 * Get a single match by ID
 */
export async function getMatch(matchId: string): Promise<Match | null> {
  const docRef = doc(db, 'matches', matchId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const matchData = {
    id: docSnap.id,
    ...docSnap.data(),
  } as Match;

  return matchData;
}

/**
 * Get all matches
 */
export async function getAllMatches(): Promise<Match[]> {
  const q = query(collection(db, 'matches'), orderBy('matchDate', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Match[];
}

/**
 * Get upcoming matches (open or locked, future date)
 */
export async function getUpcomingMatches(): Promise<Match[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'matches'),
    where('matchDate', '>', now),
    orderBy('matchDate', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Match[];
}

/**
 * Get past matches
 */
export async function getPastMatches(): Promise<Match[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'matches'),
    where('matchDate', '<', now),
    orderBy('matchDate', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Match[];
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  status: MatchStatus
): Promise<void> {
  const docRef = doc(db, 'matches', matchId);
  await updateDoc(docRef, { status });
}

/**
 * Set match results (admin only)
 */
export async function setMatchResults(
  matchId: string,
  results: MatchResults
): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  const docRef = doc(db, 'matches', matchId);
  await updateDoc(docRef, {
    actualScore: results.actualScore,
    actualScorers: results.actualScorers,
    actualAssists: results.actualAssists,
    status: 'finished',
    resultsSetAt: serverTimestamp(),
    resultsSetBy: auth.currentUser.uid,
  });
}

/**
 * Check if a match is open for betting
 */
export async function isMatchOpen(matchId: string): Promise<boolean> {
  const match = await getMatch(matchId);
  if (!match) return false;

  const now = new Date();
  const matchDate = match.matchDate.toDate();

  return match.status === 'open' && matchDate > now;
}

/**
 * Update match details (admin only)
 * If match is finished with results, recalculate all bet points
 */
export async function updateMatch(
  matchId: string,
  updates: {
    opponent?: string;
    matchDate?: Date;
    status?: MatchStatus;
  }
): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  const docRef = doc(db, 'matches', matchId);
  const updateData: any = {};

  if (updates.opponent !== undefined) {
    updateData.opponent = updates.opponent;
  }
  if (updates.matchDate !== undefined) {
    updateData.matchDate = Timestamp.fromDate(updates.matchDate);
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Delete a match and all associated bets (admin only)
 * Recalculates user points by subtracting points earned from this match
 */
export async function deleteMatch(matchId: string): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // 1. Get all bets for this match
  const betsQuery = query(collection(db, 'bets'), where('matchId', '==', matchId));
  const betsSnapshot = await getDocs(betsQuery);

  if (betsSnapshot.empty) {
    // No bets, just delete the match
    await deleteDoc(doc(db, 'matches', matchId));
    return;
  }

  // 2. Calculate points and scorer matches to subtract for each user
  const userPointsToSubtract = new Map<string, number>();
  const userScorerMatchesToSubtract = new Map<string, number>();

  for (const betDoc of betsSnapshot.docs) {
    const bet = betDoc.data();
    // Only subtract points if the bet has been scored (pointsEarned is defined)
    if (bet.pointsEarned !== undefined && bet.pointsEarned !== null && bet.pointsEarned > 0) {
      const currentSubtraction = userPointsToSubtract.get(bet.userId) || 0;
      userPointsToSubtract.set(bet.userId, currentSubtraction + bet.pointsEarned);
    }

    // Check if this bet had a scorer match
    if (bet.breakdown) {
      const hadScorerMatch = bet.breakdown.matchedScorer || bet.breakdown.matchedScorerAlone;
      if (hadScorerMatch) {
        const currentScorerSubtraction = userScorerMatchesToSubtract.get(bet.userId) || 0;
        userScorerMatchesToSubtract.set(bet.userId, currentScorerSubtraction + 1);
      }
    }
  }

  // 3. Delete all bets and update user points in a batch
  const batch = writeBatch(db);

  // Delete bets
  for (const betDoc of betsSnapshot.docs) {
    batch.delete(doc(db, 'bets', betDoc.id));
  }

  // Update user points and scorer matches
  const allUserIds = new Set([...userPointsToSubtract.keys(), ...userScorerMatchesToSubtract.keys()]);
  for (const userId of allUserIds) {
    const pointsToSubtract = userPointsToSubtract.get(userId) || 0;
    const scorerMatchesToSubtract = userScorerMatchesToSubtract.get(userId) || 0;

    const updateData: any = {
      lastUpdated: serverTimestamp(),
    };

    if (pointsToSubtract > 0) {
      updateData.totalPoints = increment(-pointsToSubtract);
    }
    if (scorerMatchesToSubtract > 0) {
      updateData.scorerMatches = increment(-scorerMatchesToSubtract);
    }

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, updateData);
  }

  // Delete the match
  batch.delete(doc(db, 'matches', matchId));

  // 4. Commit all changes
  await batch.commit();
}

/**
 * Get all matches for a specific season
 */
export async function getMatchesBySeason(seasonId: string): Promise<Match[]> {
  const q = query(
    collection(db, 'matches'),
    where('seasonId', '==', seasonId),
    orderBy('matchDate', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Match[];
}
