
export const BB_RULES = [
  { id: 'HOH_WIN', name: 'Head of Household Win', points: 10 },
  { id: 'POV_WIN', name: 'Power of Veto Win', points: 8 },
  { id: 'POWER_WIN', name: 'Other Power/Comp Win', points: 5 },
  { id: 'SURVIVE', name: 'Survives a Week', points: 3 },
  { id: 'NOMINATED', name: 'Nominated for Eviction', points: -2 },
  { id: 'EVICTED', name: 'Evicted from the House', points: -5 },
  { id: 'FINAL3', name: 'Makes Final 3', points: 15 },
  { id: 'RUNNER_UP', name: 'Runner-Up', points: 20 },
  { id: 'WINNER', name: 'Winner', points: 30 },
  { id: 'AFP', name: 'America\'s Favorite Player', points: 10 },
];

export const BB_RULES_DEFAULT = [
  { code: 'HOH_WIN', label: 'Head of Household Win', points: 10 },
  { code: 'VETO_WIN', label: 'Power of Veto Win', points: 8 },
  { code: 'VETO_USED', label: 'Veto Used on a Player', points: 3 },
  { code: 'NOMINATED', label: 'Nominated for Eviction', points: -2 },
  { code: 'FINAL_NOM', label: 'Final Nominee for the Week', points: -3 },
  { code: 'EVICT_PRE', label: 'Evicted (Pre-Jury)', points: -5 },
  { code: 'EVICT_POST', label: 'Evicted (Jury)', points: -7 },
  { code: 'BLOCK_BUSTER_SAFE', label: 'Safe from Block Buster', points: 5 },
  { code: 'JURY', label: 'Makes the Jury', points: 10 },
  { code: 'FINAL3', label: 'Makes Final 3', points: 15 },
  { code: 'RUNNER_UP', label: 'Runner-Up', points: 25 },
  { code: 'WINNER', label: 'Winner', points: 40 },
  { code: 'AFP', label: 'America\'s Favorite Player', points: 10 },
];

export const SURVIVOR_RULES = [
  { id: 'IMMUNITY_WIN', name: 'Immunity Challenge Win (Individual)', points: 10 },
  { id: 'REWARD_WIN', name: 'Reward Challenge Win (Individual)', points: 5 },
  { id: 'IDOL_FOUND', name: 'Finds Hidden Immunity Idol', points: 8 },
  { id: 'IDOL_PLAYED', name: 'Plays Idol Correctly', points: 6 },
  { id: 'ADVANTAGE_FOUND', name: 'Finds an Advantage', points: 4 },
  { id: 'FIRE_MAKING_WIN', name: 'Wins Fire-Making Challenge', points: 7 },
  { id: 'SAFE_AT_TRIBAL', name: 'Safe at Tribal Council', points: 2 },
  { id: 'VOTED_OUT', name: 'Voted Out', points: -5 },
  { id: 'JURY', name: 'Makes the Jury', points: 10 },
  { id: 'FINAL_TRIBAL', name: 'Makes Final Tribal Council', points: 15 },
  { id: 'SOLE_SURVIVOR', name: 'Sole Survivor (Winner)', points: 30 },
  { id: 'FAN_FAVORITE', name: 'Sia Award / Fan Favorite', points: 10 },
];

    