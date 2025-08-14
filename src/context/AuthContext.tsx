
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, getFirestore, collection, getDocs } from 'firebase/firestore';
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

// One-time function to seed initial data if the database is completely empty
const seedInitialData = async () => {
    const db = getFirestore(app);
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    // Only seed if the entire users collection is empty
    if (usersSnap.empty) {
        console.log("Users collection is empty. Seeding initial admin user...");
        const adminUserRef = doc(db, "users", "user_admin_placeholder");
        const adminUser: AppUser = {
            id: 'user_admin_placeholder',
            displayName: "YAC Admin",
            email: "admin@yac.com",
            photoURL: "",
            createdAt: new Date().toISOString(),
            role: 'site_admin',
            status: 'pending' // Status is pending until they sign up
        };
        await setDoc(adminUserRef, adminUser);
        console.log("Admin user placeholder seeded.");
    }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Run the seeder function once on app startup
    const initialize = async () => {
      await seedInitialData();

      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          const db = getFirestore(app);
          const userDocRef = doc(db, 'users', user.uid);
          const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  setAppUser({ ...docSnap.data(), id: docSnap.id } as AppUser);
              } else {
                  // This case can happen if the Firestore doc isn't created yet.
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
      return unsubscribeAuth;
    };

    const unsubscribePromise = initialize();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
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
