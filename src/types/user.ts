import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  isAdmin: boolean;
  totalPoints: number;
  scorerMatches: number; // Counter for correctly predicted scorers/assists
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
  seasonMedals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface UserRanking extends User {
  rank: number;
}
