import { LocationId, MatchFormat, PlayerRole, SaveProgress, SkillTreeState } from '../types/game';

export interface StoryChapterMeta {
  id: number;
  location: LocationId;
  format: MatchFormat;
  wallBounce: boolean;
  noGoalkeeper: boolean;
  opponentColor: string;
  durationSec: number;
}

export const STORY_CHAPTERS: StoryChapterMeta[] = [
  {
    id: 0,
    location: 'mellassine',
    format: '3v3',
    wallBounce: true,
    noGoalkeeper: true,
    opponentColor: '#ef4444',
    durationSec: 75,
  },
  {
    id: 1,
    location: 'ettadhamen',
    format: '3v3',
    wallBounce: true,
    noGoalkeeper: false,
    opponentColor: '#3b82f6',
    durationSec: 85,
  },
  {
    id: 2,
    location: 'tataouine',
    format: '4v4',
    wallBounce: true,
    noGoalkeeper: false,
    opponentColor: '#10b981',
    durationSec: 90,
  },
  {
    id: 3,
    location: 'tokyo',
    format: '4v4',
    wallBounce: true,
    noGoalkeeper: false,
    opponentColor: '#06b6d4',
    durationSec: 90,
  },
  {
    id: 4,
    location: 'rio',
    format: '5v5',
    wallBounce: true,
    noGoalkeeper: false,
    opponentColor: '#eab308',
    durationSec: 105,
  },
];

export const DEFAULT_SAVE: SaveProgress = {
  rep: 120,
  skillPoints: 3,
  unlockedStoryChapter: 0,
  completedChapters: [],
  avatar: {
    name: 'YASSINE',
    skinTone: '#c68b59',
    hairStyle: 'fade',
    hairColor: '#18181b',
    topStyle: 'hoodie',
    topColor: '#f59e0b',
    accentColor: '#18181b',
    shortsColor: '#18181b',
    sneakerColor: '#f8fafc',
    hasTattoo: true,
    role: 'striker',
  },
  skills: {
    striker: [1, 0, 0],
    playmaker: [0, 0, 0],
    defender: [0, 0, 0],
  },
  squad: {
    crewName: 'CARTHAGE KINGS',
    crestShape: 'shield',
    primaryColor: '#f59e0b',
    secondaryColor: '#dc2626',
    homeLocation: 'mellassine',
    wins: 4,
    points: 1240,
    roster: [
      {
        id: 'm1',
        name: 'MEHDI',
        role: 'playmaker',
        ovr: 84,
        skinTone: '#b0764a',
        hairStyle: 'braids',
        hairColor: '#1c1917',
        topStyle: 'jersey',
      },
      {
        id: 'm2',
        name: 'RAYEN',
        role: 'defender',
        ovr: 82,
        skinTone: '#d9a477',
        hairStyle: 'buzz',
        hairColor: '#27272a',
        topStyle: 'jacket',
      },
      {
        id: 'm3',
        name: 'AMIRA',
        role: 'striker',
        ovr: 86,
        skinTone: '#c68b59',
        hairStyle: 'afro',
        hairColor: '#18181b',
        topStyle: 'hoodie',
      },
      {
        id: 'm4',
        name: 'KARIM',
        role: 'defender',
        ovr: 80,
        skinTone: '#8d5524',
        hairStyle: 'cap',
        hairColor: '#18181b',
        topStyle: 'jersey',
      },
    ],
  },
  bestArcade: {
    targets: 0,
    king: 0,
    wallvolley: 0,
  },
};

export interface GlobalCrewEntry {
  name: string;
  city: string;
  wins: number;
  points: number;
  color: string;
}

export const GLOBAL_CREWS: GlobalCrewEntry[] = [
  { name: 'SHIBUYA SPARKS', city: 'Tokyo', wins: 19, points: 2480, color: '#06b6d4' },
  { name: 'REIS DA FAVELA', city: 'Rio', wins: 16, points: 2190, color: '#eab308' },
  { name: 'MELLASSINE LIONS', city: 'Tunis', wins: 14, points: 1940, color: '#ef4444' },
  { name: 'CANAL ROOF CREW', city: 'Amsterdam', wins: 11, points: 1610, color: '#f43f5e' },
  { name: 'ETTADHAMEN FALCONS', city: 'Tunis', wins: 9, points: 1380, color: '#3b82f6' },
  { name: 'BIZERTE WAVES', city: 'Bizerte', wins: 6, points: 1020, color: '#38bdf8' },
];

const STORAGE_KEY = 'volta_street_football_save_v1';

export function loadSaveProgress(): SaveProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SaveProgress>;
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      avatar: { ...DEFAULT_SAVE.avatar, ...(parsed.avatar || {}) },
      skills: { ...DEFAULT_SAVE.skills, ...(parsed.skills || {}) },
      squad: {
        ...DEFAULT_SAVE.squad,
        ...(parsed.squad || {}),
        roster: parsed.squad?.roster || DEFAULT_SAVE.squad.roster,
      },
      bestArcade: { ...DEFAULT_SAVE.bestArcade, ...(parsed.bestArcade || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistSaveProgress(save: SaveProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // ignore storage quota failures
  }
}

export interface ComputedAttributes {
  speedMult: number;
  shotPowerMult: number;
  passSpeedMult: number;
  tackleReachMult: number;
  skillWindowMult: number;
}

export function computePlayerAttributes(role: PlayerRole, skills: SkillTreeState): ComputedAttributes {
  const s = skills.striker;
  const p = skills.playmaker;
  const d = skills.defender;

  const roleSpeedBonus = role === 'striker' ? 0.05 : role === 'playmaker' ? 0.03 : 0;
  const roleShotBonus = role === 'striker' ? 0.08 : 0;
  const rolePassBonus = role === 'playmaker' ? 0.08 : 0;
  const roleTackleBonus = role === 'defender' ? 0.12 : 0;

  return {
    speedMult: 1 + roleSpeedBonus + s[2] * 0.04 + p[0] * 0.02,
    shotPowerMult: 1 + roleShotBonus + s[0] * 0.05 + s[1] * 0.07,
    passSpeedMult: 1 + rolePassBonus + p[1] * 0.07 + d[2] * 0.03,
    tackleReachMult: 1 + roleTackleBonus + d[0] * 0.06 + d[1] * 0.08,
    skillWindowMult: 1 + (role === 'playmaker' ? 0.15 : 0) + p[2] * 0.12 + s[2] * 0.05,
  };
}
