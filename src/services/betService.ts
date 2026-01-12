import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { isMatchOpen } from './matchService';
import type { Bet, BetInput } from '../types';

/**
 * Place a bet on a match
 */
export async function placeBet(input: BetInput): Promise<string> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // Validate that match is open for betting
  const matchOpen = await isMatchOpen(input.matchId);
  if (!matchOpen) {
    throw new Error('This match is no longer accepting bets');
  }

  // Validate score (Ceará must win or draw)
  if (input.predictedScore.ceara < input.predictedScore.opponent) {
    throw new Error('You can only bet on Ceará winning or drawing');
  }

  // Check if user already has a bet for this match
  const existingBet = await getUserBetForMatch(auth.currentUser.uid, input.matchId);
  if (existingBet) {
    throw new Error('You already have a bet for this match');
  }

  const betData = {
    userId: auth.currentUser.uid,
    matchId: input.matchId,
    predictedScore: input.predictedScore,
    predictedPlayer: input.predictedPlayer || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'bets'), betData);

  // Update match totalBets count
  try {
    const matchRef = doc(db, 'matches', input.matchId);
    const batch = writeBatch(db);
    batch.update(matchRef, {
      totalBets: increment(1),
    });
    await batch.commit();
    console.log('Match totalBets incremented successfully for match:', input.matchId);
  } catch (error) {
    console.error('Error updating match totalBets:', error);
    // Don't throw - bet was already created successfully
    // This is a denormalization counter, not critical
  }

  return docRef.id;
}

/**
 * Update an existing bet (only before match starts)
 */
export async function updateBet(
  betId: string,
  input: BetInput
): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // Validate that match is open for betting
  const matchOpen = await isMatchOpen(input.matchId);
  if (!matchOpen) {
    throw new Error('This match is no longer accepting bets');
  }

  // Validate score (Ceará must win or draw)
  if (input.predictedScore.ceara < input.predictedScore.opponent) {
    throw new Error('You can only bet on Ceará winning or drawing');
  }

  // Get the existing bet to verify ownership
  const existingBet = await getUserBetForMatch(auth.currentUser.uid, input.matchId);
  if (!existingBet) {
    throw new Error('No existing bet found for this match');
  }

  if (existingBet.id !== betId) {
    throw new Error('Bet ID mismatch');
  }

  // Update the bet
  const betRef = doc(db, 'bets', betId);
  await updateDoc(betRef, {
    predictedScore: input.predictedScore,
    predictedPlayer: input.predictedPlayer || null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get a user's bet for a specific match
 */
export async function getUserBetForMatch(
  userId: string,
  matchId: string
): Promise<Bet | null> {
  const q = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    where('matchId', '==', matchId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Bet;
}

/**
 * Get all bets for a user
 */
export async function getUserBets(userId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bet[];
}

/**
 * Get all bets for a match
 */
export async function getMatchBets(matchId: string): Promise<Bet[]> {
  const q = query(
    collection(db, 'bets'),
    where('matchId', '==', matchId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bet[];
}

/**
 * Update any user's bet (admin only)
 * Admins can update bets for open matches regardless of ownership
 */
export async function adminUpdateBet(
  betId: string,
  updates: {
    predictedScore: { ceara: number; opponent: number };
    predictedPlayer?: string | null;
  }
): Promise<void> {
  if (!auth.currentUser) throw new Error('User must be authenticated');

  // Validate score (Ceará must win or draw)
  if (updates.predictedScore.ceara < updates.predictedScore.opponent) {
    throw new Error('You can only bet on Ceará winning or drawing');
  }

  // Update the bet
  const betRef = doc(db, 'bets', betId);
  await updateDoc(betRef, {
    predictedScore: updates.predictedScore,
    predictedPlayer: updates.predictedPlayer || null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get match bet statistics
 */
export async function getMatchBetStatistics(matchId: string): Promise<{
  totalBets: number;
  mostBetScore: { ceara: number; opponent: number; count: number } | null;
  topPredictedPlayers: Array<{ player: string; count: number }>;
}> {
  const bets = await getMatchBets(matchId);

  if (bets.length === 0) {
    return {
      totalBets: 0,
      mostBetScore: null,
      topPredictedPlayers: [],
    };
  }

  // Count score predictions
  const scoreCounts = new Map<string, number>();
  const playerCounts = new Map<string, number>();

  for (const bet of bets) {
    const scoreKey = `${bet.predictedScore.ceara}-${bet.predictedScore.opponent}`;
    scoreCounts.set(scoreKey, (scoreCounts.get(scoreKey) || 0) + 1);

    if (bet.predictedPlayer) {
      playerCounts.set(
        bet.predictedPlayer,
        (playerCounts.get(bet.predictedPlayer) || 0) + 1
      );
    }
  }

  // Find most bet score
  let mostBetScore: { ceara: number; opponent: number; count: number } | null = null;
  let maxCount = 0;

  for (const [scoreKey, count] of scoreCounts.entries()) {
    if (count > maxCount) {
      const [ceara, opponent] = scoreKey.split('-').map(Number);
      mostBetScore = { ceara, opponent, count };
      maxCount = count;
    }
  }

  // Get top predicted players
  const topPredictedPlayers = Array.from(playerCounts.entries())
    .map(([player, count]) => ({ player, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalBets: bets.length,
    mostBetScore,
    topPredictedPlayers,
  };
}
