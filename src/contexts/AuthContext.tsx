import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.isAdmin || false;

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user - check if they're the first user
        const configRef = doc(db, 'systemConfig', 'config');

        const isFirstUser = await runTransaction(db, async (transaction) => {
          const configDoc = await transaction.get(configRef);

          if (!configDoc.exists() || !configDoc.data()?.firstUserRegistered) {
            // This is the first user!
            transaction.set(
              configRef,
              {
                firstUserRegistered: true,
                lastUpdated: serverTimestamp(),
              },
              { merge: true }
            );
            return true;
          }
          return false;
        });

        // Create user document
        const newUser: Omit<User, 'createdAt' | 'lastUpdated'> & {
          createdAt: ReturnType<typeof serverTimestamp>;
          lastUpdated: ReturnType<typeof serverTimestamp>;
        } = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          username: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          isAdmin: isFirstUser,
          totalPoints: 0,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        };

        await setDoc(userDocRef, newUser);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update username
  const updateUsername = async (username: string) => {
    if (!currentUser) throw new Error('No user signed in');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        username,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as User);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    signInWithGoogle,
    signOut,
    updateUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
