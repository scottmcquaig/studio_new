
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, collection, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
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

// One-time function to seed initial data if the database is empty
const seedInitialData = async () => {
    const db = getFirestore(app);
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    // Only seed if there are no users at all
    if (snapshot.empty) {
        console.log("No users found. Seeding initial admin user...");
        const adminUser = {
            id: 'user_admin', // This is a placeholder ID before auth linking
            displayName: "YAC Admin",
            email: "admin@yac.com",
            photoURL: "",
            createdAt: new Date().toISOString(),
            role: 'site_admin',
            status: 'pending' // Status is pending until they sign up
        };
        // Use a specific, predictable document ID for the initial admin user
        await setDoc(doc(db, "users", "user_admin_placeholder"), adminUser);
        console.log("Admin user seeded.");
    }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run the seeder function once on app startup
    seedInitialData();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAppUser({ ...docSnap.data(), id: docSnap.id } as AppUser);
            } else {
                // This case handles when a user has an auth record but no firestore doc yet.
                // It can happen during the sign-up process before the doc is created.
                setAppUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    currentUser,
    appUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
