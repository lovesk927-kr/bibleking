export interface Character {
  id: number;
  name: string;
  character_type: number;
  level: number;
  exp: number;
  max_exp: number;
  description: string;
  recite_mode: number;
  created_at: string;
}

export interface CharacterStats {
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  baseEvasion: number;
  bonusAttack: number;
  bonusDefense: number;
  bonusHp: number;
  bonusEvasion: number;
  totalAttack: number;
  totalDefense: number;
  totalHp: number;
  totalEvasion: number;
}

export interface Verse {
  id: number;
  book: string;
  chapter: number;
  verse_number: number;
  content: string;
  blank_template: string;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  stat_type: string;
  stat_bonus: number;
  rarity: string;
  level_req: number;
  is_equipped: number;
  enhance_level: number;
  ci_id: number;
}

export interface Monster {
  id: number;
  name: string;
  emoji: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  exp_reward: number;
}

export interface ReciteResult {
  results: {
    verse_number: number;
    correct: boolean;
    correctAnswer: string;
    userAnswer: string;
  }[];
  score: number;
  totalQuestions: number;
  earnedExp: number;
  leveledUp: boolean;
  newLevel?: number;
  newExp?: number;
  maxExp?: number;
  rewards?: Item[];
}

export interface BattleResult {
  victory: boolean;
  log: string[];
  battleExp: number;
  battleRewards: Item[];
  monsterName: string;
  monsterEmoji: string;
}

export interface NetworkPlayerInfo {
  id: string;
  characterId: number;
  characterName: string;
  characterType: number;
  level: number;
  isHost: boolean;
  easyMode?: boolean;
  team?: 'blue' | 'red';
}

declare global {
  interface Window {
    api: {
      adminLogin: (password: string) => Promise<boolean>;
      adminGetVerses: () => Promise<Verse[]>;
      adminSaveVerses: (data: { book: string; chapter: string; verses: { verse_number: number; content: string }[] }) => Promise<boolean>;
      adminGetSettings: () => Promise<{ book: string; chapter: string; startVerse: number; verseCount: number }>;
      adminSaveSettings: (settings: { book: string; chapter: string; startVerse: number; verseCount: number }) => Promise<boolean>;
      adminGetBlankTemplates: () => Promise<{ verse_number: number; blank_template: string }[]>;
      adminSaveBlankTemplates: (templates: { verse_number: number; blank_template: string }[]) => Promise<boolean>;
      getCharacters: () => Promise<Character[]>;
      createCharacter: (data: { name: string; type: number; reciteMode: number }) => Promise<Character>;
      getCharacter: (id: number) => Promise<Character>;
      getCharacterStats: (id: number) => Promise<CharacterStats>;
      updateReciteMode: (data: { characterId: number; reciteMode: number }) => Promise<boolean>;
      deleteCharacter: (id: number) => Promise<boolean>;
      getQuiz: () => Promise<Verse[]>;
      submitRecite: (data: { characterId: number; answers: { verse_number: number; answer: string }[] }) => Promise<ReciteResult>;
      getRandomMonster: (data: { characterLevel: number; villageId: number }) => Promise<Monster>;
      fight: (data: { characterId: number; monsterId: number; monster: Monster; scorePercent: number }) => Promise<BattleResult>;
      getItems: (characterId: number) => Promise<Item[]>;
      equipItem: (data: { characterId: number; ciId: number; itemType: string }) => Promise<boolean>;
      unequipItem: (data: { ciId: number; characterId: number }) => Promise<boolean>;
      discardItem: (data: { ciId: number; characterId: number }) => Promise<boolean>;
      synthesizeItem: (data: { characterId: number; ciIds: number[] }) => Promise<{ success: boolean; newItem?: Item; message?: string }>;
      enhanceItem: (data: { characterId: number; targetCiId: number; materialCiId: number }) => Promise<{ success: boolean; message?: string }>;
      transferItem: (data: { ciId: number; fromCharacterId: number; toCharacterId: number }) => Promise<{ success: boolean; message?: string }>;
      // 소모품
      getConsumables: (characterId: number) => Promise<{ type: string; quantity: number }[]>;
      useConsumable: (data: { characterId: number; type: string }) => Promise<{ success: boolean; message?: string }>;
      addConsumable: (data: { characterId: number; type: string; quantity: number }) => Promise<{ success: boolean }>;
      // 소모품 전송
      consumableTransfer: (data: { fromCharacterId: number; toCharacterId: number; type: string; quantity: number }) => Promise<{ success: boolean; message?: string }>;
      // 네트워크
      networkStartServer: (port: number) => Promise<{ success: boolean; ip?: string; port?: number; error?: string }>;
      networkStopServer: () => Promise<boolean>;
      networkGetServerInfo: () => Promise<{ running: boolean; ip: string }>;
      networkSetHostPlayer: (data: { characterId: number; characterName: string; characterType: number; level: number }) => Promise<boolean>;
      networkGetPlayers: () => Promise<any[]>;
      networkSetRoomMode: (mode: string) => Promise<boolean>;
      networkStartGame: () => Promise<boolean>;
      networkGetRoomInfo: () => Promise<{ hostName: string; hostCharacterType: number; hostLevel: number; mode: string; playerCount: number }>;
      networkSetPlayerTeam: (data: { playerId: string; team: string }) => Promise<boolean>;
      // PvP (호스트용)
      networkPvpReady: (data: { characterName: string; characterType: number; stats: any }) => Promise<boolean>;
      networkPvpAttack: () => Promise<any>;
      networkPvpEnd: () => Promise<boolean>;
      onPvpEvent: (callback: (event: any, data: any) => void) => void;
      removePvpListener: () => void;
      onGiftNotification: (callback: (event: any, data: { senderName: string; itemName: string; isConsumable: boolean }) => void) => void;
      removeGiftNotificationListener: () => void;
      // 파일 내보내기/가져오기
      exportVerses: () => Promise<{ success: boolean; path?: string; error?: string }>;
      importVerses: () => Promise<{ success: boolean; error?: string }>;
      exportCharacter: (characterId: number) => Promise<{ success: boolean; path?: string; error?: string }>;
      importCharacter: () => Promise<{ success: boolean; characterId?: number; error?: string }>;
      // 업데이트
      onUpdateStatus: (callback: (event: any, data: any) => void) => void;
      removeUpdateListener: () => void;
    };
  }
}
