export type Language = 'ar' | 'fr' | 'en';

export type LocationId =
  | 'mellassine'
  | 'ettadhamen'
  | 'aindraham'
  | 'tataouine'
  | 'bizerte'
  | 'amsterdam'
  | 'tokyo'
  | 'rio';

export type MatchFormat = '3v3' | '4v4' | '5v5';

export type PlayerRole = 'striker' | 'playmaker' | 'defender';

export type GameMode = 'quick' | 'story' | 'arcade' | 'squads';

export type ArcadeMiniGame = 'targets' | 'king' | 'wallvolley';

export type ScreenState = 'title' | 'hub' | 'avatar' | 'playing' | 'paused' | 'postmatch';

export type HubTab = 'quick' | 'story' | 'arcade' | 'squads';

export type HairStyle = 'fade' | 'afro' | 'braids' | 'buzz' | 'cap';
export type TopStyle = 'hoodie' | 'jersey' | 'jacket';

export interface AvatarConfig {
  name: string;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  topStyle: TopStyle;
  topColor: string;
  accentColor: string;
  shortsColor: string;
  sneakerColor: string;
  hasTattoo: boolean;
  role: PlayerRole;
}

export interface SkillTreeState {
  striker: [number, number, number]; // [Finisher, PowerShot, Agility] 0-3
  playmaker: [number, number, number]; // [Vision, KillerPass, NutmegMaestro] 0-3
  defender: [number, number, number]; // [Interception, BrickTackle, WallSpecialist] 0-3
}

export interface CrewMember {
  id: string;
  name: string;
  role: PlayerRole;
  ovr: number;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  topStyle: TopStyle;
}

export interface SquadConfig {
  crewName: string;
  crestShape: 'shield' | 'diamond' | 'hexagon';
  primaryColor: string;
  secondaryColor: string;
  homeLocation: LocationId;
  wins: number;
  points: number;
  roster: CrewMember[];
}

export interface MatchConfig {
  mode: GameMode;
  location: LocationId;
  format: MatchFormat;
  wallBounce: boolean;
  noGoalkeeper: boolean;
  durationSec: number;
  arcadeGame?: ArcadeMiniGame;
  storyChapterId?: number;
  opponentName: string;
  opponentColor: string;
}

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  goals: number;
  nutmegs: number;
  wallPasses: number;
  skillsLanded: number;
  tackles: number;
  arcadeScore: number;
  repEarned: number;
  won: boolean;
}

export interface CalloutEvent {
  id: number;
  key: 'goal' | 'conceded' | 'nutmeg' | 'wallpass' | 'skill' | 'save' | 'target' | 'king';
  playerName?: string;
}

export interface MatchSnapshot {
  homeScore: number;
  awayScore: number;
  timeRemaining: number;
  stamina: number;
  shotCharge: number;
  styleCombo: number;
  arcadeScore: number;
  hasBall: boolean;
  isControllingOnBall: boolean;
  callout: CalloutEvent | null;
  activePlayerName: string;
}

export interface SaveProgress {
  rep: number;
  skillPoints: number;
  unlockedStoryChapter: number;
  completedChapters: number[];
  avatar: AvatarConfig;
  skills: SkillTreeState;
  squad: SquadConfig;
  bestArcade: Record<ArcadeMiniGame, number>;
}
