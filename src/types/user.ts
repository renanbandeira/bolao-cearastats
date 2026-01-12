import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  isAdmin: boolean;
  totalPoints: number;
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
}

export interface UserRanking extends User {
  rank: number;
}
