

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

export async function getTeams(leagueId?: string): Promise<Team[]> {
  try {
    let query = db.collection('teams');
    if (leagueId) {
        query = query.where('leagueId', '==', leagueId) as FirebaseFirestore.CollectionReference<DocumentData>;
    }
    const querySnapshot = await query.get();
    return querySnapshot.docs.map(doc => fromFirestore<Team>(doc));
  } catch (error) {
    console.error("Error fetching teams from Firestore:", error);
    return [];
  }
}

export async function saveLeagueAndTeams(league: League, teamNames: string[]): Promise<void> {
  const batch = db.batch();

  // 1. Save the league document
  const leagueRef = db.collection('leagues').doc(league.id);
  
  const { id: leagueId, contestantTerm, settings, ...restOfLeagueData } = league;
  const leagueData = {
      ...restOfLeagueData,
      contestantTermSingular: contestantTerm.singular,
      contestantTermPlural: contestantTerm.plural,
      ...settings,
  };
  batch.set(leagueRef, leagueData, { merge: true });

  // 2. Fetch existing teams to compare against
  const existingTeams = await getTeams(league.id);
  const existingTeamNames = existingTeams.map(t => t.name);

  // 3. Update existing teams and identify new teams
  const teamsToUpdate = teamNames.map((name, index) => ({ name, originalIndex: index }));
  
  teamsToUpdate.forEach(({ name }) => {
      const existingTeam = existingTeams.find(t => t.name === name);
      if (existingTeam) {
          // If name is the same, we could update other properties here if needed.
          // For now, we just ensure it's not treated as new or deleted.
      } else {
          // This is a new team, create a new document for it
          const newTeamRef = db.collection('teams').doc();
          const newTeamData: Omit<Team, 'id' | 'weekly_score_breakdown'> = {
              name,
              leagueId: league.id,
              ownerUserIds: [],
              contestantIds: [],
              faab: 100,
              createdAt: new Date().toISOString(),
              total_score: 0,
              weekly_score: 0,
          };
          batch.set(newTeamRef, newTeamData);
      }
  });

  // 4. Identify and delete teams that were removed
  const teamsToDelete = existingTeams.filter(team => !teamNames.includes(team.name));
  teamsToDelete.forEach(team => {
      const teamRef = db.collection('teams').doc(team.id);
      batch.delete(teamRef);
  });
  
  try {
    await batch.commit();
  } catch (error: any) {
    console.error("Error committing batch save for league and teams. The raw error is:", error);
    throw new Error(`Failed to save data to Firestore: ${error.message}`);
  }
}
