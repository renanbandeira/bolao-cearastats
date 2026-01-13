import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User, UserRanking } from '../types';

/**
 * Get all users ordered by total points
 */
export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as User[];
}

/**
 * Get user ranking
 */
export async function getUserRanking(limit?: number): Promise<UserRanking[]> {
  const q = query(
    collection(db, 'users'),
    orderBy('totalPoints', 'desc'),
    orderBy('username', 'asc')
  );
  const snapshot = await getDocs(q);

  let users = snapshot.docs.map((doc) => doc.data()) as User[];

  // Apply limit if provided
  if (limit) {
    users = users.slice(0, limit);
  }

  // Add rank to each user
  return users.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));
}

/**
 * Update user's admin status
 */
export async function toggleAdminStatus(
  userId: string,
  isAdmin: boolean
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    isAdmin,
    lastUpdated: serverTimestamp(),
  });
}

/**
 * Update user's username (can be called by user or admin)
 */
export async function updateUserUsername(
  userId: string,
  username: string
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    username,
    lastUpdated: serverTimestamp(),
  });
}

/**
 * Update user's total points (admin only)
 */
export async function updateUserPoints(
  userId: string,
  totalPoints: number
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    totalPoints,
    lastUpdated: serverTimestamp(),
  });
}
