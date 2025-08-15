
import type { Firestore } from 'firebase/firestore';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { 
    MOCK_LEAGUES, 
    MOCK_TEAMS, 
    MOCK_CONTESTANTS, 
    MOCK_COMPETITIONS, 
    MOCK_SCORING_RULES, 
    MOCK_PICKS 
} from '@/lib/data';

export async function seedDatabase(db: Firestore) {
    const batch = writeBatch(db);

    // Seed Leagues
    MOCK_LEAGUES.forEach(league => {
        const docRef = doc(db, 'leagues', league.id);
        batch.set(docRef, league);
    });

    // Seed Teams
    MOCK_TEAMS.forEach(team => {
        const docRef = doc(db, 'teams', team.id);
        batch.set(docRef, team);
    });

    // Seed Contestants
    MOCK_CONTESTANTS.forEach(contestant => {
        const docRef = doc(db, 'contestants', contestant.id);
        batch.set(docRef, contestant);
    });
    
    // Seed Competitions
    MOCK_COMPETITIONS.forEach(competition => {
        const docRef = doc(db, 'competitions', competition.id);
        batch.set(docRef, competition);
    });
    
    // Seed Scoring Rules
    MOCK_SCORING_RULES.forEach(ruleSet => {
        const docRef = doc(db, 'scoring_rules', ruleSet.id);
        batch.set(docRef, ruleSet);
    });
    
    // Seed Picks
    MOCK_PICKS.forEach(pick => {
        const docRef = doc(db, 'picks', pick.id);
        batch.set(docRef, pick);
    });


    await batch.commit();
}

    