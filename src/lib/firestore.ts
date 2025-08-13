

'use server';

import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { db } from './firebase-admin'; // Use the server-side admin instance
import type { League, Team } from './data';

// Helper function to convert a Firestore document to our data types
function fromFirestore<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as T;
}

export async function getLeagues(): Promise<League[]> {
  try {
    const querySnapshot = await db.collection('leagues').get();
    return querySnapshot.docs.map(doc => fromFirestore<League>(doc));
  } catch (error) {
    console.error("Error fetching leagues from Firestore:", error);
    return [];
  }
}

export async function getTeams(): Promise<Team[]> {
  try {
    const querySnapshot = await db.collection('teams').get();
    return querySnapshot.docs.map(doc => fromFirestore<Team>(doc));
  } catch (error) {
    console.error("Error fetching teams from Firestore:", error);
    return [];
  }
}

export async function saveLeagueAndTeams(league: League, teams: Team[]): Promise<void> {
  const batch = db.batch();

  // Save the league document
  const leagueRef = db.collection('leagues').doc(league.id);
  const { id: leagueId, ...leagueData } = league;
  batch.set(leagueRef, leagueData, { merge: true });

  const validTeams = teams.filter(team => team && team.name);
  
  validTeams.forEach(team => {
    const { id: teamId, ...teamData } = team;
    
    // This is the most important fix: explicitly delete the complex nested object
    // that the Admin SDK cannot serialize on the server.
    delete (teamData as any).weekly_score_breakdown;

    if (teamId && teamId.startsWith('new_team_')) {
        const newTeamRef = db.collection('teams').doc();
        batch.set(newTeamRef, teamData);
    } else if (teamId) {
        const teamRef = db.collection('teams').doc(teamId);
        batch.set(teamRef, teamData, { merge: true });
    }
  });

  try {
    await batch.commit();
  } catch (error: any) {
    console.error("Error committing batch save for league and teams. The raw error is:", error);
    throw new Error(`Failed to save data to Firestore: ${error.message}`);
  }
}
