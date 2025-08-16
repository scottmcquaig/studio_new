

// All data is for a fictional Big Brother 27 season for mocking purposes.

import { BB_RULES, SURVIVOR_RULES } from "@/lib/constants";

export interface Season {
  id: string;
  franchise: string;
  seasonNumber: number;
  title: string;
  theme: string;
  network: string;
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


export const MOCK_SEASONS: Season[] = [
    {
      "id": "bb27",
      "franchise": "Big Brother US",
      "seasonNumber": 27,
      "title": "Big Brother 27",
      "theme": "Summer of Mystery / Hotel Murder Mystery",
      "network": "CBS",
      "year": 2025,
      "premiereDate": "2025-07-08",
      "endDate": "2025-09-15",
      "status": "in_progress",
      "currentWeek": 5,
      "totalWeeks": 12,
      "notes": "Live state through Aug 12, 2025."
    }
  ];

export const MOCK_CONTESTANTS: Contestant[] = [
    {"id":"keanu_soto","seasonId":"bb27","firstName":"Keanu","lastName":"Soto","age":33,"occupation":"Dungeon master","hometown":"McKinney, TX","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"jimmy_heagerty","seasonId":"bb27","firstName":"Jimmy","lastName":"Heagerty","age":25,"occupation":"Strategy consultant","hometown":"Washington, DC","status":"evicted","evictedDay":31,"finish":"16th", "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"lauren_domingue","seasonId":"bb27","firstName":"Lauren","lastName":"Domingue","age":22,"occupation":"Bridal stylist","hometown":"Lafayette, LA","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"zach_cornell","seasonId":"bb27","firstName":"Zach","lastName":"Cornell","age":27,"occupation":"Marketing manager","hometown":"Cartersville, GA","status":"active","enteredDay":1,"specialPower":"$10k immunity pre-jury", "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"morgan_pope","seasonId":"bb27","firstName":"Morgan","lastName":"Pope","age":33,"occupation":"Gamer","hometown":"Los Angeles, CA","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"rylie_jeffries","seasonId":"bb27","firstName":"Rylie","lastName":"Jeffries","age":27,"occupation":"Professional bull rider","hometown":"Luther, OK","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"kelley_jorgensen","seasonId":"bb27","firstName":"Kelley","lastName":"Jorgensen","age":29,"occupation":"Web designer","hometown":"Burbank, SD","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"ashley_hollis","seasonId":"bb27","firstName":"Ashley","lastName":"Hollis","age":25,"occupation":"Attorney","hometown":"New York, NY","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"vince_panaro","seasonId":"bb27","firstName":"Vince","lastName":"Panaro","age":34,"occupation":"Unemployed","hometown":"West Hills, CA","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"zae_frederich","seasonId":"bb27","firstName":"Isaiah","lastName":"Frederich","nickname":"Zae","age":23,"occupation":"Salesperson","hometown":"Phoenix, AZ","status":"evicted","evictedDay":10,"finish":"19th", "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"katherine_woodman","seasonId":"bb27","firstName":"Katherine","lastName":"Woodman","age":23,"occupation":"Fine dining server","hometown":"Columbia, SC","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"adrian_rocha","seasonId":"bb27","firstName":"Adrian","lastName":"Rocha","age":23,"occupation":"Carpenter","hometown":"San Antonio, TX","status":"evicted","evictedDay":24,"finish":"17th", "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"rachel_reilly","seasonId":"bb27","firstName":"Rachel","lastName":"Reilly","age":40,"occupation":"TV personality","hometown":"Hoover, AL","status":"active","enteredDay":1,"isReturnee":true, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"will_williams","seasonId":"bb27","firstName":"Cliffton","lastName":"Williams","nickname":"Will","age":50,"occupation":"College sports podcaster","hometown":"Charlotte, NC","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"amy_bingham","seasonId":"bb27","firstName":"Amy","lastName":"Bingham","age":43,"occupation":"Insurance agent","hometown":"Stockton, CA","status":"evicted","evictedDay":17,"finish":"18th","note":"Entered as Mastermind's accomplice", "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"mickey_lee","seasonId":"bb27","firstName":"Mickey","lastName":"Lee","age":35,"occupation":"Event curator","hometown":"Atlanta, GA","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
    {"id":"ava_pearl","seasonId":"bb27","firstName":"Ava","lastName":"Pearl","age":24,"occupation":"Aura painter","hometown":"New York, NY","status":"active","enteredDay":1, "photoUrl": "https://placehold.co/100x100.png"},
];


export const MOCK_LEAGUES: League[] = [
    {
      "id":"bb27",
      "name":"Big Brother 27",
      "abbreviatedName": "BB27",
      "show": "Big Brother",
      "seasonId":"bb27",
      "visibility":"private",
      "maxTeams":4,
      "waivers":"FAAB",
      "createdAt":"2025-08-01T12:00:00Z",
      "adminUserIds": ["user_admin"],
      "contestantTerm": {
        "singular": "Houseguest",
        "plural": "Houseguests"
      },
      "settings":{
        "allowMidSeasonDraft":true,
        "scoringRuleSetId":"bb27_ruleset",
        "transactionLockDuringEpisodes":true,
        "draftRounds": 4,
        "scoringBreakdownCategories": [
            { "icon": "Crown", "color": "text-purple-500", "displayName": "HOH Wins", "ruleCodes": ["HOH_WIN"] },
            { "icon": "Shield", "color": "text-amber-500", "displayName": "Veto Wins", "ruleCodes": ["VETO_WIN"] },
            { "icon": "ShieldPlus", "color": "text-blue-500", "displayName": "Powers", "ruleCodes": ["SPECIAL_POWER", "BLOCK_BUSTER_SAFE"] },
            { "icon": "Users", "color": "text-red-500", "displayName": "Noms", "ruleCodes": ["NOMINATED", "FINAL_NOM"] },
            { "icon": "UserX", "color": "text-gray-500", "displayName": "Evicted", "ruleCodes": ["EVICTED"] },
            { "icon": "TrendingUp", "color": "text-green-500", "displayName": "Misc", "ruleCodes": ["VETO_USED", "SURVIVES_EVICTION"] }
        ]
      }
    }
];

export const MOCK_TEAMS: Team[] = [
    {"id":"team_1","leagueId":"bb27","name":"Team 1","ownerUserIds":[],"contestantIds":["keanu_soto", "ashley_hollis", "vince_panaro", "mickey_lee"],"faab":100,"createdAt":"2025-08-01T12:05:00Z", total_score: 182, weekly_score: 18, draftOrder: 1, weekly_score_breakdown: { week4: [{contestantId: 'mickey_lee', points: 10}, {contestantId: 'keanu_soto', points: 8}]}},
    {"id":"team_2","leagueId":"bb27","name":"Team 2","ownerUserIds":[],"contestantIds":["jimmy_heagerty", "kelley_jorgensen", "zae_frederich", "amy_bingham"],"faab":100,"createdAt":"2025-08-01T12:06:00Z", total_score: 195, weekly_score: -8, draftOrder: 2, weekly_score_breakdown: { week4: [{contestantId: 'jimmy_heagerty', points: -8}]}},
    {"id":"team_3","leagueId":"bb27","name":"Team 3","ownerUserIds":[],"contestantIds":["lauren_domingue", "rylie_jeffries", "katherine_woodman", "will_williams"],"faab":100,"createdAt":"2025-08-01T12:07:00Z", total_score: 175, weekly_score: 4, draftOrder: 3, weekly_score_breakdown: { week4: [{contestantId: 'rylie_jeffries', points: 4}]}},
    {"id":"team_4","leagueId":"bb27","name":"Team 4","ownerUserIds":[],"contestantIds":["zach_cornell", "morgan_pope", "adrian_rocha", "rachel_reilly"],"faab":100,"createdAt":"2025-08-01T12:08:00Z", total_score: 164, weekly_score: 0, draftOrder: 4, weekly_score_breakdown: { week4: []}}
];

export const MOCK_USERS: User[] = [
    {"id":"user_admin","displayName":"YAC Admin","email":"admin@yac.com","photoURL":"","createdAt":"2025-07-31T12:00:00Z", "role": "site_admin", "status": "active"},
    {"id":"user_scott","displayName":"Scott","email":"scott@example.com","photoURL":"","createdAt":"2025-08-01T12:00:00Z", "role": "player", "status": "pending"},
    {"id":"user_molly","displayName":"Molly","email":"molly@example.com","photoURL":"","createdAt":"2025-08-01T12:01:10Z", "role": "player", "status": "pending"},
    {"id":"user_hank","displayName":"Hank","email":"hank@example.com","photoURL":"","createdAt":"2025-08-01T12:00:10Z", "role": "player", "status": "pending"},
    {"id":"user_alicia","displayName":"Alicia","email":"alicia@example.com","photoURL":"","createdAt":"2025-08-01T12:00:20Z", "role": "player", "status": "pending"},
    {"id":"user_stone","displayName":"Stone","email":"stone@example.com","photoURL":"","createdAt":"2025-08-01T12:00:30Z", "role": "league_admin", "managedLeagueIds": ["yac_bb27_public"], "status": "active"},
    {"id":"user_liz","displayName":"Liz","email":"liz@example.com","photoURL":"","createdAt":"2025-08-01T12:00:40Z", "role": "player", "status": "pending"},
    {"id":"user_jess","displayName":"Jess","email":"jess@example.com","photoURL":"","createdAt":"2025-08-01T12:00:50Z", "role": "player", "status": "pending"},
    {"id":"user_will","displayName":"Will","email":"will@example.com","photoURL":"","createdAt":"2025-08-01T12:01:00Z", "role": "player", "status": "pending"}
];

export const MOCK_SCORING_RULES: ScoringRuleSet[] = [
    {
      "id":"bb27_ruleset",
      "name":"Standard BB Rules v1",
      "seasonId":"bb27",
      "rules":[
        {"code":"HOH_WIN","label":"Wins Head of Household","points":10},
        {"code":"VETO_WIN","label":"Wins Power of Veto","points":8},
        {"code":"VETO_USED","label":"Uses Veto (any target)","points":3},
        {"code":"NOMINATED","label":"Is nominated at any point","points":-3},
        {"code":"FINAL_NOM","label":"Sits on eviction night","points":-2},
        {"code":"EVICTED", "label": "Is evicted from the house", "points": -10},
        {"code":"SURVIVES_EVICTION","label":"Survives an eviction vote","points":5},
        {"code":"BLOCK_BUSTER_SAFE","label":"Wins Block Buster safety","points":4},
        {"code":"HAVE_NOT","label":"Becomes a Have-Not","points":-1},
        {"code":"PENALTY_RULE","label":"Rule violation penalty","points":-5},
        {"code":"SPECIAL_POWER","label":"Activates a special twist power","points":5}
      ],
      "createdAt":"2025-08-01T12:00:00Z"
    }
];

export const MOCK_PICKS: Pick[] = [
  {"id":"pick_1","leagueId":"yac_bb27_public","teamId":"team_hank_alicia","contestantId":"keanu_soto","round":1,"pick":1,"createdAt":"2025-08-01T12:10:00Z"},
  {"id":"pick_2","leagueId":"yac_bb27_public","teamId":"team_stone_liz","contestantId":"jimmy_heagerty","round":1,"pick":2,"createdAt":"2025-08-01T12:11:00Z"},
  {"id":"pick_3","leagueId":"yac_bb27_public","teamId":"team_jess_will","contestantId":"lauren_domingue","round":1,"pick":3,"createdAt":"2025-08-01T12:12:00Z"},
  {"id":"pick_4","leagueId":"yac_bb27_public","teamId":"team_molly_scott","contestantId":"zach_cornell","round":1,"pick":4,"createdAt":"2025-08-01T12:13:00Z"},
  {"id":"pick_5","leagueId":"yac_bb27_public","teamId":"team_molly_scott","contestantId":"morgan_pope","round":2,"pick":5,"createdAt":"2025-08-01T12:14:00Z"},
  {"id":"pick_6","leagueId":"yac_bb27_public","teamId":"team_jess_will","contestantId":"rylie_jeffries","round":2,"pick":6,"createdAt":"2025-08-01T12:15:00Z"},
  {"id":"pick_7","leagueId":"yac_bb27_public","teamId":"team_stone_liz","contestantId":"kelley_jorgensen","round":2,"pick":7,"createdAt":"2025-08-01T12:16:00Z"},
  {"id":"pick_8","leagueId":"yac_bb27_public","teamId":"team_hank_alicia","contestantId":"ashley_hollis","round":2,"pick":8,"createdAt":"2025-08-01T12:17:00Z"},
  {"id":"pick_9","leagueId":"yac_bb27_public","teamId":"team_hank_alicia","contestantId":"vince_panaro","round":3,"pick":9,"createdAt":"2025-08-01T12:18:00Z"},
  {"id":"pick_10","leagueId":"yac_bb27_public","teamId":"team_stone_liz","contestantId":"zae_frederich","round":3,"pick":10,"createdAt":"2025-08-01T12:19:00Z"},
  {"id":"pick_11","leagueId":"yac_bb27_public","teamId":"team_jess_will","contestantId":"katherine_woodman","round":3,"pick":11,"createdAt":"2025-08-01T12:20:00Z"},
  {"id":"pick_12","leagueId":"yac_bb27_public","teamId":"team_molly_scott","contestantId":"adrian_rocha","round":3,"pick":12,"createdAt":"2025-08-01T12:21:00Z"},
  {"id":"pick_13","leagueId":"yac_bb27_public","teamId":"team_molly_scott","contestantId":"rachel_reilly","round":4,"pick":13,"createdAt":"2025-08-01T12:22:00Z"},
  {"id":"pick_14","leagueId":"yac_bb27_public","teamId":"team_jess_will","contestantId":"will_williams","round":4,"pick":14,"createdAt":"2025-08-01T12:23:00Z"},
  {"id":"pick_15","leagueId":"yac_bb27_public","teamId":"team_stone_liz","contestantId":"amy_bingham","round":4,"pick":15,"createdAt":"2025-08-01T12:24:00Z"},
  {"id":"pick_16","leagueId":"yac_bb27_public","teamId":"team_hank_alicia","contestantId":"mickey_lee","round":4,"pick":16,"createdAt":"2025-08-01T12:25:00Z"}
];

    
