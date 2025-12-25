'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, DocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { User } from '@/types/hearthlink';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to handle creating or updating the user in Firestore
const updateUserInFirestore = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  let userSnap: DocumentSnapshot;

  try {
    userSnap = await getDoc(userRef);
  } catch (serverError: any) {
    // This is the first read, so we must handle permission errors
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'get',
    }));
    // Rethrow to be caught by the onAuthStateChanged handler
    throw serverError;
  }

  if (userSnap.exists()) {
    // Note: We are not updating the document on every login to save writes.
    // You could add logic here to update `lastLogin` timestamp if needed.
    return { id: userSnap.id, ...userSnap.data() } as User;
  } else {
    // Create new user document in Firestore
    const newUser: Omit<User, 'id'> = {
      name: firebaseUser.displayName || 'Anonymous',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      color: `hsl(${firebaseUser.uid.charCodeAt(0) % 360}, 70%, 60%)`,
      rooms: [],
    };

    const userData = {
        ...newUser,
        createdAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, userData);
      return { id: firebaseUser.uid, ...newUser };
    } catch (serverError: any) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userData,
       }));
       throw serverError;
    }
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await updateUserInFirestore(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Errors are now emitted by the functions themselves.
        // We just need to ensure the UI reflects a failed login state.
        console.error("Authentication process failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Error signing in with Google", error);
      // Potentially show a toast to the user
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Clear user state immediately
      router.push('/login');
    } catch (error) {
        console.error("Error signing out:", error);
    }
  };

  const value = { user, loading, signInWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
