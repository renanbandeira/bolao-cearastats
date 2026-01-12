import type { Timestamp } from 'firebase/firestore';
import type { Score } from './match';

export interface PointsBreakdown {
  exactScore?: number;
  exactScoreAlone?: number;
  winOrDraw?: number;
  matchedScorer?: number;
  matchedScorerAlone?: number;
  matchedAssist?: number;
  matchedAssistAlone?: number;
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  predictedScore: Score;
  predictedPlayer?: string;

  // Calculated after match finishes
  pointsEarned?: number;
  breakdown?: PointsBreakdown;
  calculatedAt?: Timestamp;
}

export interface BetInput {
  matchId: string;
  predictedScore: Score;
  predictedPlayer?: string;
}
