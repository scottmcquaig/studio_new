

'use server';

import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { db } from './firebase-admin'; // Use the server-side admin instance
import type { League, Team } from './data';

// Helper function to convert a Firestore document to our data types
function fromFirestore<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data();

    // Reconstruct the nested objects when reading from Firestore
    if (data.contestantTermSingular || data.scoringRuleSetId) { // Check if it's a league object
        data.contestantTerm = {
            singular: data.contestantTermSingular,
            plural: data.contestantTermPlural,
        };
        data.settings = {
            allowMidSeasonDraft: data.allowMidSeasonDraft,
            scoringRuleSetId: data.scoringRuleSetId,
            transactionLockDuringEpisodes: data.transactionLockDuringEpisodes,
        };

        // Clean up the flat properties
        delete data.contestantTermSingular;
        delete data.contestantTermPlural;
        delete data.allowMidSeasonDraft;
        delete data.scoringRuleSetId;
        delete data.transactionLockDuringEpisodes;
    }

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
  
  // Destructure and flatten the league object to remove ALL nested objects before saving.
  const { id: leagueId, contestantTerm, settings, ...restOfLeagueData } = league;
  const leagueData = {
      ...restOfLeagueData,
      contestantTermSingular: contestantTerm.singular,
      contestantTermPlural: contestantTerm.plural,
      ...settings, // Flatten the settings object
  };

  batch.set(leagueRef, leagueData, { merge: true });

  const validTeams = teams.filter(team => team && team.name);
  
  validTeams.forEach(team => {
    // Create a copy to avoid mutating the original object, and remove complex fields
    const { id: teamId, weekly_score_breakdown, ...teamData } = team;

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
