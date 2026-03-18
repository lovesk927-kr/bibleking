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

export interface BossBattleState {
  bossVillageId: number;
  bossName: string;
  bossEmoji: string;
  bossTitle: string;
  bossHp: number;
  bossMaxHp: number;
  bossAttack: number;
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;
  playerDefense: number;
  playerEvasion: number;
  round: number;
  phase: 'intro' | 'playing' | 'victory' | 'defeat';
  log: string[];
  currentQuestion: BlankQuestion | null;
  timeLimit: number;
}

export interface BlankQuestion {
  verseNumber: number;
  verseContent: string;
  words: string[];
  blankIndices: number[];
  answers: string[];
  mode?: 'fullBlank' | 'blank';
}

export interface BossBattleResult {
  victory: boolean;
  villageId: number;
  bossName: string;
  bossEmoji: string;
  reward: Item | null;
  lightFragment: number; // 현재 빛의 조각 수
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

// ===== 로그라이크 타입 =====

export interface RoguelikeRunState {
  room: number;
  villageId: number;
  villageKillCount: number;
  playerHp: number;
  playerMaxHp: number;
  playerAttack: number;
  playerDefense: number;
  gold: number;
  combo: number;
  maxCombo: number;
  monstersKilled: number;
  hitsTaken: number;
  maxGoldHeld: number;
  elitesKilled: number;
  activeBuffs: { id: string; name: string; description: string }[];
  roomType: 'battle' | 'elite' | 'shop' | 'event' | 'buff_select' | 'path_select' | 'run_end' | 'boss_battle';
  monster: RoguelikeMonster | null;
  usedRevive: boolean;
  bonusStars: number;
}

export interface RoguelikeMonster {
  name: string;
  emoji: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isElite: boolean;
  exp_reward: number;
}

export interface RoguelikeQuestion {
  verseTexts: string[];
  verseRef: string;
  words: string[];
  blankIndices: number[];
  blankGroups: number[][];
  answers: string[];
  timeLimit: number;
  blankCount: number;
}

export interface RoguelikeTurnResult {
  playerHp: number;
  playerMaxHp: number;
  playerAttack?: number;
  playerDefense?: number;
  monsterHp: number;
  monsterMaxHp: number;
  damage: number;
  isPlayerAttack: boolean;
  combo: number;
  comboMultiplier: number;
  log: string;
  monsterDefeated: boolean;
  playerDead: boolean;
  goldEarned: number;
  expEarned: number;
  itemDrop: Item | null;
  leveledUp: boolean;
  newLevel?: number;
}

export interface RoguelikeShopInfo {
  items: { id: string; name: string; description: string; cost: number; discountedCost: number }[];
  gold: number;
}

export interface RoguelikeEventInfo {
  id: string;
  name: string;
  description: string;
  choices: { label: string; cost?: string }[];
}

export interface RoguelikeRunEnd {
  roomReached: number;
  starsEarned: number;
  totalStars: number;
  monstersKilled: number;
  maxCombo: number;
  newAchievements: { id: string; name: string; reward: number }[];
  itemsKept: number;
}

export interface RoguelikePermanentState {
  stars: number;
  upgrades: { type: string; level: number; name: string; maxLevel: number; cost: number; description: string }[];
  achievements: { id: string; name: string; description: string; unlocked: boolean; reward: number }[];
  bestRoom: number;
  totalMonstersKilled: number;
  bestCombo: number;
  totalRuns: number;
  unlockedStartBuffs: { id: string; name: string; description: string }[];
  startBuffSlots: number;
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
      getQuizRange: (data: { startVerse: number; endVerse: number }) => Promise<Verse[]>;
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
      // 보스
      getBossClears: (characterId: number) => Promise<number[]>;
      checkBossReady: (villageId: number) => Promise<{ ready: boolean; message?: string }>;
      getBossQuestion: (data: { villageId: number; reciteMode: number }) => Promise<BlankQuestion>;
      bossAttack: (data: { characterId: number; villageId: number; correct: boolean }) => Promise<{
        bossHp: number; playerHp: number; damage: number; dodged: boolean; log: string;
      }>;
      startBossBattle: (data: { characterId: number; villageId: number }) => Promise<BossBattleState>;
      completeBoss: (data: { characterId: number; villageId: number }) => Promise<BossBattleResult>;
      getPrologueSeen: (characterId: number) => Promise<boolean>;
      setPrologueSeen: (characterId: number) => Promise<boolean>;
      getCutsceneSeen: (data: { characterId: number; villageId: number; type: string }) => Promise<boolean>;
      setCutsceneSeen: (data: { characterId: number; villageId: number; type: string }) => Promise<boolean>;
      // 로그라이크
      roguelikeGetState: (characterId: number) => Promise<RoguelikePermanentState>;
      roguelikeStartRun: (data: { characterId: number; startBuffs: string[]; villageId: number }) => Promise<RoguelikeRunState>;
      roguelikeChoosePath: (data: { characterId: number; choice: 'left' | 'right' }) => Promise<RoguelikeRunState>;
      roguelikeGetQuestion: (data: { characterId: number; reciteMode: number }) => Promise<RoguelikeQuestion>;
      roguelikeSubmitAnswer: (data: { characterId: number; answer: string }) => Promise<{ correct: boolean; filledIndices: number[]; remainingBlanks: number }>;
      roguelikeCompleteTurn: (data: { characterId: number; allCorrect: boolean }) => Promise<RoguelikeTurnResult>;
      roguelikeShopInfo: (characterId: number) => Promise<RoguelikeShopInfo>;
      roguelikeShopBuy: (data: { characterId: number; shopItemId: string }) => Promise<{ success: boolean; message: string; gold: number; playerHp: number; playerMaxHp: number; playerAttack: number; playerDefense: number }>;
      roguelikeEventInfo: (characterId: number) => Promise<RoguelikeEventInfo>;
      roguelikeEventChoice: (data: { characterId: number; choiceIndex: number }) => Promise<{ result: string; runState: RoguelikeRunState; statChanges?: { label: string; before: number; after: number }[] }>;
      roguelikeSelectBuff: (data: { characterId: number; buffId: string }) => Promise<RoguelikeRunState>;
      roguelikeGetBuffChoices: (characterId: number) => Promise<{ id: string; name: string; description: string }[]>;
      roguelikeEliteChoice: (data: { characterId: number; fight: boolean }) => Promise<RoguelikeRunState>;
      roguelikeEndRun: (characterId: number) => Promise<RoguelikeRunEnd>;
      roguelikeUpgrade: (data: { characterId: number; upgradeType: string }) => Promise<{ success: boolean; message: string; state: RoguelikePermanentState }>;
      roguelikeBossComplete: (data: { characterId: number; villageId: number; victory: boolean }) => Promise<{ runState: RoguelikeRunState; bossVictory: boolean; reward: Item | null; finalVictory?: boolean }>;
      roguelikeDebugBoss: (characterId: number) => Promise<RoguelikeRunState | null>;
      roguelikeDebugEvent: (characterId: number) => Promise<RoguelikeRunState | null>;
      // 업데이트
      onUpdateStatus: (callback: (event: any, data: any) => void) => void;
      removeUpdateListener: () => void;
    };
  }
}
