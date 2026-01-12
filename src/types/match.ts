import type { Timestamp } from 'firebase/firestore';

export type MatchStatus = 'open' | 'locked' | 'finished';

export interface Score {
  ceara: number;
  opponent: number;
}

export interface Match {
  id: string;
  opponent: string;
  matchDate: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  status: MatchStatus;
  seasonId?: string; // Optional for backwards compatibility

  // Results (set by admin after match)
  actualScore?: Score;
  actualScorers?: string[];
  actualAssists?: string[];
  resultsSetAt?: Timestamp;
  resultsSetBy?: string;

  // Statistics (denormalized)
  totalBets: number;
  mostBetScore?: Score & { count: number };
  scorerBets?: Record<string, number>;
  assistBets?: Record<string, number>;
}

export interface MatchInput {
  opponent: string;
  matchDate: Date;
}

export interface MatchResults {
  actualScore: Score;
  actualScorers: string[];
  actualAssists: string[];
}
