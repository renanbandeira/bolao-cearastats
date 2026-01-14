import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getMatchBets } from './betService';
import { setMatchResults as setMatchResultsFirestore, getMatch } from './matchService';
import { calculatePoints, createCountMap, getScoreKey } from '../lib/scoring';
import type { MatchResults } from '../types';

/**
 * Set match results and calculate points for all bets
 * Handles both initial result setting and updates to existing results
 */
export async function setMatchResultsAndCalculatePoints(
  matchId: string,
  results: MatchResults
): Promise<void> {
  // 1. Set match results in Firestore
  await setMatchResultsFirestore(matchId, results);

  // 2. Get all bets for this match
  const bets = await getMatchBets(matchId);

  if (bets.length === 0) {
    return; // No bets to calculate
  }

  // 3. Count score and player predictions for uniqueness bonuses
  const scoreCounts = createCountMap(bets, (bet) =>
    getScoreKey(bet.predictedScore)
  );

  const playerCounts = createCountMap(
    bets,
    (bet) => bet.predictedPlayer ? bet.predictedPlayer.toLowerCase().trim() : undefined
  );

  // 4. Calculate points for each bet and prepare batch update
  const batch = writeBatch(db);
  const userPointsDiff = new Map<string, number>();
  const userScorerMatchDiff = new Map<string, number>(); // Track scorer match changes

  for (const bet of bets) {
    const oldPoints = bet.pointsEarned || 0;

    const result = calculatePoints(
      {
        predictedScore: bet.predictedScore,
        predictedPlayer: bet.predictedPlayer,
      },
      {
        actualScore: results.actualScore,
        actualScorers: results.actualScorers,
        actualAssists: results.actualAssists,
      },
      scoreCounts,
      playerCounts
    );

    const newPoints = result.points;
    const pointsDiff = newPoints - oldPoints;

    // Check if user matched a scorer or assist
    const hadScorerMatch = bet.breakdown && (
      bet.breakdown.matchedScorer || bet.breakdown.matchedScorerAlone
    );
    const hasScorerMatch = result.breakdown && (
      result.breakdown.matchedScorer || result.breakdown.matchedScorerAlone
    );

    // Calculate scorer match difference
    let scorerMatchDiff = 0;
    if (!hadScorerMatch && hasScorerMatch) {
      scorerMatchDiff = 1; // New scorer match
    } else if (hadScorerMatch && !hasScorerMatch) {
      scorerMatchDiff = -1; // Lost scorer match (result updated)
    }

    // Update bet document with calculated points
    const betRef = doc(db, 'bets', bet.id);
    batch.update(betRef, {
      pointsEarned: newPoints,
      breakdown: result.breakdown,
      calculatedAt: serverTimestamp(),
    });

    // Track the point difference for each user
    const currentDiff = userPointsDiff.get(bet.userId) || 0;
    userPointsDiff.set(bet.userId, currentDiff + pointsDiff);

    // Track scorer match difference for each user
    if (scorerMatchDiff !== 0) {
      const currentScorerDiff = userScorerMatchDiff.get(bet.userId) || 0;
      userScorerMatchDiff.set(bet.userId, currentScorerDiff + scorerMatchDiff);
    }
  }

  // 5. Update user total points and scorer matches with the difference
  const allUserIds = new Set([...userPointsDiff.keys(), ...userScorerMatchDiff.keys()]);
  for (const userId of allUserIds) {
    const pointsDiff = userPointsDiff.get(userId) || 0;
    const scorerDiff = userScorerMatchDiff.get(userId) || 0;

    const updateData: any = {
      lastUpdated: serverTimestamp(),
    };

    if (pointsDiff !== 0) {
      updateData.totalPoints = increment(pointsDiff);
    }
    if (scorerDiff !== 0) {
      updateData.scorerMatches = increment(scorerDiff);
    }

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, updateData);
  }

  // 6. Commit all updates
  await batch.commit();
}

/**
 * Recalculate points for a match that already has results
 * Used when match details are updated after scoring
 */
export async function recalculateMatchPoints(matchId: string): Promise<void> {
  // 1. Get match with current results
  const match = await getMatch(matchId);
  if (!match || !match.actualScore) {
    throw new Error('Match not found or has no results');
  }

  // 2. Get all bets for this match
  const bets = await getMatchBets(matchId);

  if (bets.length === 0) {
    return; // No bets to recalculate
  }

  // 3. Count score and player predictions for uniqueness bonuses
  const scoreCounts = createCountMap(bets, (bet) =>
    getScoreKey(bet.predictedScore)
  );

  const playerCounts = createCountMap(
    bets,
    (bet) => bet.predictedPlayer ? bet.predictedPlayer.toLowerCase().trim() : undefined
  );

  // 4. Calculate new points and track the difference for each user
  const batch = writeBatch(db);
  const userPointsDiff = new Map<string, number>();
  const userScorerMatchDiff = new Map<string, number>(); // Track scorer match changes

  for (const bet of bets) {
    const oldPoints = bet.pointsEarned || 0;

    const result = calculatePoints(
      {
        predictedScore: bet.predictedScore,
        predictedPlayer: bet.predictedPlayer,
      },
      {
        actualScore: match.actualScore,
        actualScorers: match.actualScorers,
        actualAssists: match.actualAssists,
      },
      scoreCounts,
      playerCounts
    );

    const newPoints = result.points;
    const pointsDiff = newPoints - oldPoints;

    // Check if user matched a scorer or assist
    const hadScorerMatch = bet.breakdown && (
      bet.breakdown.matchedScorer || bet.breakdown.matchedScorerAlone
    );
    const hasScorerMatch = result.breakdown && (
      result.breakdown.matchedScorer || result.breakdown.matchedScorerAlone
    );

    // Calculate scorer match difference
    let scorerMatchDiff = 0;
    if (!hadScorerMatch && hasScorerMatch) {
      scorerMatchDiff = 1; // New scorer match
    } else if (hadScorerMatch && !hasScorerMatch) {
      scorerMatchDiff = -1; // Lost scorer match (result updated)
    }

    // Update bet document with recalculated points
    const betRef = doc(db, 'bets', bet.id);
    batch.update(betRef, {
      pointsEarned: newPoints,
      breakdown: result.breakdown,
      calculatedAt: serverTimestamp(),
    });

    // Track the point difference for each user
    const currentDiff = userPointsDiff.get(bet.userId) || 0;
    userPointsDiff.set(bet.userId, currentDiff + pointsDiff);

    // Track scorer match difference for each user
    if (scorerMatchDiff !== 0) {
      const currentScorerDiff = userScorerMatchDiff.get(bet.userId) || 0;
      userScorerMatchDiff.set(bet.userId, currentScorerDiff + scorerMatchDiff);
    }
  }

  // 5. Update user total points and scorer matches with the difference
  const allUserIds = new Set([...userPointsDiff.keys(), ...userScorerMatchDiff.keys()]);
  for (const userId of allUserIds) {
    const pointsDiff = userPointsDiff.get(userId) || 0;
    const scorerDiff = userScorerMatchDiff.get(userId) || 0;

    const updateData: any = {
      lastUpdated: serverTimestamp(),
    };

    if (pointsDiff !== 0) {
      updateData.totalPoints = increment(pointsDiff);
    }
    if (scorerDiff !== 0) {
      updateData.scorerMatches = increment(scorerDiff);
    }

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, updateData);
  }

  // 6. Commit all updates
  await batch.commit();
}
