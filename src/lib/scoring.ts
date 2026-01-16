import type { Score, PointsBreakdown } from '../types';

export type ResultType = 'win' | 'draw' | 'loss';

export function getResult(ceara: number, opponent: number): ResultType {
  if (ceara > opponent) return 'win';
  if (ceara === opponent) return 'draw';
  return 'loss';
}

export interface BetData {
  predictedScore: Score;
  predictedPlayer?: string;
}

export interface MatchResult {
  actualScore: Score;
  actualScorers?: string[];
  actualAssists?: string[];
}

export interface ScoringResult {
  points: number;
  breakdown: PointsBreakdown;
}

/**
 * Calculate points for a single bet based on match results and uniqueness
 *
 * @param bet - The user's bet
 * @param result - The actual match results
 * @param scoreCounts - Map of score predictions to count of users who made them
 * @param playerCounts - Map of player predictions to count of users who made them
 * @returns Scoring result with total points and breakdown
 */
export function calculatePoints(
  bet: BetData,
  result: MatchResult,
  scoreCounts: Map<string, number>,
  playerCounts: Map<string, number>
): ScoringResult {
  const breakdown: PointsBreakdown = {};
  let points = 0;

  // 1. Check score prediction
  const exactScore =
    bet.predictedScore.ceara === result.actualScore.ceara &&
    bet.predictedScore.opponent === result.actualScore.opponent;

  const predictedResult = getResult(bet.predictedScore.ceara, bet.predictedScore.opponent);
  const actualResult = getResult(result.actualScore.ceara, result.actualScore.opponent);
  const matchedResult = predictedResult === actualResult;

  if (exactScore) {
    const scoreKey = `${result.actualScore.ceara}-${result.actualScore.opponent}`;
    const isOnlyOne = scoreCounts.get(scoreKey) === 1;

    if (isOnlyOne) {
      breakdown.exactScoreAlone = 4;
      points += 4;
    } else {
      breakdown.exactScore = 2;
      points += 2;
    }
  } else if (matchedResult) {
    breakdown.winOrDraw = 1;
    points += 1;
  }

  // 2. Check player prediction (case insensitive)
  if (bet.predictedPlayer && (result.actualScorers || result.actualAssists)) {
    const predictedPlayerLower = bet.predictedPlayer.toLowerCase().trim();

    const playerScored = result.actualScorers?.some(
      scorer => sanitizePlayerName(scorer) === predictedPlayerLower
    );
    const playerAssisted = result.actualAssists?.some(
      assist => sanitizePlayerName(assist) === predictedPlayerLower
    );
    const isOnlyOne = playerCounts.get(predictedPlayerLower) === 1;

    if (playerScored) {
      if (isOnlyOne) {
        breakdown.matchedScorerAlone = 4;
        points += 4;
      } else {
        breakdown.matchedScorer = 2;
        points += 2;
      }
    }

    if (playerAssisted) {
      if (isOnlyOne) {
        breakdown.matchedAssistAlone = 2;
        points += 2;
      } else {
        breakdown.matchedAssist = 1;
        points += 1;
      }
    }
  }

  return { points, breakdown };
}

/**
 * Create a count map from array of predictions
 *
 * @param predictions - Array of predictions
 * @param keyFn - Function to generate key from prediction
 * @returns Map of keys to counts
 */
export function createCountMap<T>(
  predictions: T[],
  keyFn: (item: T) => string | undefined
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const prediction of predictions) {
    const key = keyFn(prediction);
    if (key) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Generate score key for counting
 */
export function getScoreKey(score: Score): string {
  return `${score.ceara}-${score.opponent}`;
}

/**
 * 
 * @param playerName - The player name to sanitize
 * @returns The sanitized player name (it will replace the player name with the most common name for that player. Ex: "Vinicius Goes" > "Vina")
 */
export function sanitizePlayerName(playerName: string): string {
  const playerNameDictionary = {
    "vinicius goes": "Vina",
    "vinícius góes": "Vina",
    "vinicius góes": "Vina",
    "vinicius": "Vina",
    "vinícius": "Vina",
    "ph": "Pedro Henrique",
    "vinicius zanocelo": "Zanocello",
    "vinicius zanocello": "Zanocello",
    "vinícius zanocelo": "Zanocello",
    "vinícius zanocello": "Zanocello",
    "zanocelo": "Zanocello",
  }
  return Object.keys(playerNameDictionary).includes(playerName.toLocaleLowerCase().trim()) ? playerNameDictionary[playerName.toLocaleLowerCase().trim() as keyof typeof playerNameDictionary] as string : playerName;
}