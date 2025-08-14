"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getFirestore, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
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

// This function runs once to ensure the admin user record exists in the database.
const seedAdminUser = async () => {
  const db = getFirestore(app);
  const adminEmail = "admin@yac.com";
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where("email", "==", adminEmail), limit(1));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("Admin user not found, seeding database...");
    // We use a placeholder ID; this user won't be able to log in
    // until someone signs up with the matching email.
    const adminDocRef = doc(usersRef, 'placeholder_admin');
    try {
      await setDoc(adminDocRef, {
        displayName: "YAC Admin",
        email: adminEmail,
        role: "site_admin",
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      console.log("Admin user seeded successfully.");
    } catch (error) {
      console.error("Error seeding admin user:", error);
    }
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run the seeder once on app startup
    seedAdminUser();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        const db = getFirestore(app);
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAppUser({ ...docSnap.data(), id: docSnap.id } as AppUser);
            } else {
                // If the doc doesn't exist yet, it might be due to a slight delay
                // in the signup function creating it. We will treat as loading.
                setAppUser(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            setAppUser(null);
            setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setAppUser(null);
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    currentUser,
    appUser,
    loading: loading || (!!currentUser && !appUser), // Remain in loading state if we have a firebase user but no app user yet
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
