

export interface Season {
  id: string;
  franchise: string;
  seasonNumber: number;
  title: string;
  theme?: string;
  network?: string;
  premiereDate: string;
  endDate: string;
  year: number;
  status: 'in_progress' | 'completed' | 'upcoming';
  currentWeek: number;
  totalWeeks?: number;
  notes?: string;
}

export interface Contestant {
  id: string;
  seasonId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  age: number;
  occupation: string;
  hometown: string;
  status: 'active' | 'evicted' | 'jury';
  enteredDay: number;
  photoUrl?: string;
  isReturnee?: boolean;
  specialPower?: string;
  evictedDay?: number;
  finish?: string;
  note?: string;
}

export interface Competition {
    id: string;
    seasonId: string;
    week: number;
    type: 'HOH' | 'VETO' | 'BLOCK_BUSTER' | 'EVICTION' | 'NOMINATIONS' | 'SPECIAL_EVENT';
    name?: string;
    winnerId?: string;
    airDate: string;
    notes?: string;
    used?: boolean;
    usedOnId?: string;
    replacementNomId?: string;
    finalNoms?: string[];
    evictedId?: string;
    vote?: string;
    day?: number;
    nominees?: string[];
    grantedSafety?: boolean;
    specialEventCode?: string;
}

export interface LeagueScoringBreakdownCategory {
    icon: string;
    color: string;
    displayName: string;
    ruleCodes: string[];
}

export interface League {
    id: string;
    name: string;
    abbreviatedName: string;
    show: string;
    seasonId: string;
    visibility: 'private' | 'public' | 'link';
    maxTeams: number;
    waivers: 'FAAB' | 'Standard';
    createdAt: string;
    adminUserIds?: string[];
    contestantTerm: {
        singular: string;
        plural: string;
    };
    settings: {
        allowMidSeasonDraft: boolean;
        scoringRuleSetId: string;
        transactionLockDuringEpisodes: boolean;
        scoringBreakdownCategories: LeagueScoringBreakdownCategory[];
        juryStartWeek?: number;
        seasonStartDate?: string;
        seasonEndDate?: string;
        draftRounds?: number;
    };
}

export interface WeeklyScoreBreakdown {
    week4: { contestantId: string; points: number }[];
}

export interface Team {
    id: string;
    leagueId: string;
    name: string;
    ownerUserIds: string[];
    contestantIds: string[];
    faab: number;
    createdAt: string;
    total_score: number;
    weekly_score: number;
    draftOrder: number;
    weekly_score_breakdown: WeeklyScoreBreakdown;
}

export type UserRole = 'site_admin' | 'league_admin' | 'player';
export type UserStatus = 'active' | 'pending';

export interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    createdAt: string;
    role: UserRole;
    status: UserStatus;
    managedLeagueIds?: string[];
}


export interface ScoringRule {
    code: string;
    label: string;
    points: number;
}

export interface ScoringRuleSet {
    id: string;
    name: string;
    seasonId: string;
    rules: ScoringRule[];
    createdAt: string;
}

export interface Pick {
    id: string;
    leagueId: string;
    teamId: string;
    contestantId: string;
    round: number;
    pick: number;
    createdAt: string;
}
