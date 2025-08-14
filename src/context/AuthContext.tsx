
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { auth, app } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/data';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  appUser: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAppUser({ ...docSnap.data(), id: docSnap.id } as AppUser);
            } else {
                // User exists in Auth, but not in Firestore yet.
                // The cloud function might be running. We'll wait.
                setAppUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            setAppUser(null);
            setLoading(false);
        });
        return unsubscribeSnapshot; // This will be cleaned up by the outer return function
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const value = {
    currentUser,
    appUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
