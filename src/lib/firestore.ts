
'use server';

import { collection, getDocs, doc, writeBatch, type DocumentData, type QueryDocumentSnapshot, addDoc } from 'firebase-admin/firestore';
import { db } from './firebase-admin'; // Use the server-side admin instance
import type { League, Team } from './data';

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

export async function getTeams(): Promise<Team[]> {
  // If db is not a valid Firestore instance (i.e., credentials not set), return empty array
  if (!db || typeof db.collection !== 'function') {
    return [];
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    return querySnapshot.docs.map(doc => fromFirestore<Team>(doc));
  } catch (error) {
    console.error("Error fetching teams from Firestore:", error);
    // In case of an error during fetch (e.g., permissions), return an empty array
    // to prevent the app from crashing.
    return [];
  }
}

export async function saveLeagueAndTeams(league: League, teams: Team[]): Promise<void> {
  if (!db || typeof db.collection !== 'function') {
    throw new Error("Firestore is not initialized. Cannot save settings.");
  }

  const batch = writeBatch(db);

  const leagueRef = doc(db, 'leagues', league.id);
  const { id: leagueId, ...leagueData } = league;
  batch.set(leagueRef, leagueData, { merge: true });

  const validTeams = teams.filter(team => team && team.name);
  
  validTeams.forEach(team => {
    const { id: teamId, ...teamData } = team;
    const dataToSave: DocumentData = { ...teamData };
    delete dataToSave.weekly_score_breakdown;

    if (teamId && teamId.startsWith('new_team_')) {
        const teamRef = doc(collection(db, 'teams'));
        batch.set(teamRef, dataToSave);
    } else if (teamId) {
        const teamRef = doc(db, 'teams', teamId);
        batch.set(teamRef, dataToSave, { merge: true });
    }
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error committing batch save for league and teams:", error);
    throw new Error("Failed to save data to Firestore.");
  }
}

export async function testWrite(): Promise<void> {
    if (!db || typeof db.collection !== 'function') {
        throw new Error("Firestore is not initialized. Cannot perform test write.");
    }
    try {
        const docRef = await addDoc(collection(db, "test_logs"), {
            test: "success",
            timestamp: new Date(),
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Firestore test write failed.");
    }
}
