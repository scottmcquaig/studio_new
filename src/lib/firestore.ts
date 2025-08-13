
'use server';

import { collection, getDocs, doc, writeBatch, type DocumentData, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
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

  // Update the league document
  const leagueRef = doc(db, 'leagues', league.id);
  const { id: leagueId, ...leagueData } = league;
  batch.set(leagueRef, leagueData, { merge: true });

  // Filter out any placeholder teams that don't have a name.
  const validTeams = teams.filter(team => team && team.name);

  // Update or create each valid team document
  validTeams.forEach(team => {
    // Exclude the ID from the data being written to Firestore
    const { id: teamId, ...teamData } = team;

    // Firestore SDK doesn't allow undefined values. We need to clean the object.
    const dataToSave = Object.entries(teamData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        // @ts-ignore
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // If the team is new (has a temporary ID), create a new document reference with a unique ID.
    if (teamId && teamId.startsWith('new_team_')) {
        const teamRef = doc(collection(db, 'teams')); // Creates a new ref with a new ID
        batch.set(teamRef, dataToSave); // Use set for new documents
    } else if (teamId) { // All other valid teams are existing ones to be updated.
        const teamRef = doc(db, 'teams', teamId); // Gets a ref to the existing document
        batch.set(teamRef, dataToSave, { merge: true }); // Use set with merge for existing documents
    }
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error committing batch save for league and teams:", error);
    throw new Error("Failed to save data to Firestore.");
  }
}
