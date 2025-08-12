
'use server';

import { collection, getDocs, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase-admin'; // Use the server-side admin instance
import type { League } from './data';

// Helper function to convert a Firestore document to our data types
function fromFirestore<T>(doc: QueryDocumentSnapshot<DocumentData, DocumentData>): T {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as T;
}

export async function getLeagues(): Promise<League[]> {
  // If db is not a valid Firestore instance (i.e., credentials not set), return empty array
  if (!db || typeof db.collection !== 'function') {
    return [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, 'leagues'));
    return querySnapshot.docs.map(doc => fromFirestore<League>(doc));
  } catch (error) {
    console.error("Error fetching leagues from Firestore:", error);
    // In case of an error during fetch (e.g., permissions), return an empty array
    // to prevent the app from crashing.
    return [];
  }
}
