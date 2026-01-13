import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User, UserRanking } from '../types';

/**
 * Get all users ordered by total points
 */
export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  return (snapshot.docs.map((doc) => doc.data()) as User[]).sort((a, b) => a.isAdmin ? -1 : b.isAdmin ? 1 : a.displayName.localeCompare(b.displayName));
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

/**
 * Update user's season medals (admin only)
 */
export async function updateUserMedals(
  userId: string,
  medals: { gold: number; silver: number; bronze: number }
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    seasonMedals: medals,
    lastUpdated: serverTimestamp(),
  });
}

/**
 * Delete a user and all related data (admin only)
 * WARNING: This is a permanent deletion that cannot be undone
 * - Deletes the user document
 * - Deletes all bets made by this user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // 1. Get all bets by this user
    const betsQuery = query(
      collection(db, 'bets'),
      where('userId', '==', userId)
    );
    const betsSnapshot = await getDocs(betsQuery);

    // 2. Delete all bets one by one (to avoid batch permission issues)
    if (!betsSnapshot.empty) {
      const deletePromises = betsSnapshot.docs.map((betDoc) =>
        deleteDoc(betDoc.ref)
      );

      await Promise.all(deletePromises);
    }

    // 3. Delete the user document
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Falha ao deletar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
