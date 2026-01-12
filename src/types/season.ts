import type { Timestamp } from 'firebase/firestore';

export type SeasonStatus = 'active' | 'ended';

export interface FinalRanking {
  userId: string;
  username: string;
  totalPoints: number;
  rank: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  status: SeasonStatus;
  createdBy: string;
  createdAt: Timestamp;
  finalRankings?: FinalRanking[];
}

export interface SeasonInput {
  name: string;
  startDate: Date;
}
