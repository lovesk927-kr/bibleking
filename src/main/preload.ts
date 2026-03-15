import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // 관리자
  adminLogin: (password: string) => ipcRenderer.invoke('admin:login', password),
  adminGetVerses: () => ipcRenderer.invoke('admin:getVerses'),
  adminSaveVerses: (data: { book: string; chapter: string; verses: { verse_number: number; content: string }[] }) => ipcRenderer.invoke('admin:saveVerses', data),
  adminGetSettings: () => ipcRenderer.invoke('admin:getSettings'),
  adminSaveSettings: (settings: { book: string; chapter: string; startVerse: number; verseCount: number }) => ipcRenderer.invoke('admin:saveSettings', settings),
  adminGetBlankTemplates: () => ipcRenderer.invoke('admin:getBlankTemplates'),
  adminSaveBlankTemplates: (templates: { verse_number: number; blank_template: string }[]) => ipcRenderer.invoke('admin:saveBlankTemplates', templates),

  // 캐릭터
  getCharacters: () => ipcRenderer.invoke('character:getAll'),
  createCharacter: (data: { name: string; type: number; reciteMode: number }) => ipcRenderer.invoke('character:create', data),
  getCharacter: (id: number) => ipcRenderer.invoke('character:get', id),
  getCharacterStats: (id: number) => ipcRenderer.invoke('character:getStats', id),
  updateReciteMode: (data: { characterId: number; reciteMode: number }) => ipcRenderer.invoke('character:updateReciteMode', data),
  deleteCharacter: (id: number) => ipcRenderer.invoke('character:delete', id),

  // 암송
  getQuiz: () => ipcRenderer.invoke('recite:getQuiz'),
  submitRecite: (data: { characterId: number; answers: { verse_number: number; answer: string }[] }) => ipcRenderer.invoke('recite:submit', data),

  getVerseNumbers: () => ipcRenderer.invoke('recite:getVerseNumbers'),

  // 몬스터/전투
  getRandomMonster: (data: { characterLevel: number; villageId: number }) => ipcRenderer.invoke('monster:random', data),
  fight: (data: { characterId: number; monsterId: number; monster: any; scorePercent: number }) => ipcRenderer.invoke('battle:fight', data),

  // 아이템
  getItems: (characterId: number) => ipcRenderer.invoke('inventory:getItems', characterId),
  equipItem: (data: { characterId: number; ciId: number; itemType: string }) => ipcRenderer.invoke('inventory:equipItem', data),
  unequipItem: (data: { ciId: number; characterId: number }) => ipcRenderer.invoke('inventory:unequipItem', data),
  discardItem: (data: { ciId: number; characterId: number }) => ipcRenderer.invoke('inventory:discardItem', data),
  synthesizeItem: (data: { characterId: number; ciIds: number[] }) => ipcRenderer.invoke('inventory:synthesize', data),
  enhanceItem: (data: { characterId: number; targetCiId: number; materialCiId: number }) => ipcRenderer.invoke('inventory:enhance', data),
  transferItem: (data: { ciId: number; fromCharacterId: number; toCharacterId: number }) => ipcRenderer.invoke('inventory:transfer', data),

  // 네트워크
  networkStartServer: (port: number) => ipcRenderer.invoke('network:startServer', port),
  networkStopServer: () => ipcRenderer.invoke('network:stopServer'),
  networkGetServerInfo: () => ipcRenderer.invoke('network:getServerInfo'),
  networkSetHostPlayer: (data: { characterId: number; characterName: string; characterType: number; level: number }) => ipcRenderer.invoke('network:setHostPlayer', data),
  networkGetPlayers: () => ipcRenderer.invoke('network:getPlayers'),

  networkSetRoomMode: (mode: string) => ipcRenderer.invoke('network:setRoomMode', mode),
  networkSetPvpVerseRange: (range: { startVerse: number; endVerse: number }) => ipcRenderer.invoke('network:setPvpVerseRange', range),
  networkGetPvpVerseRange: () => ipcRenderer.invoke('network:getPvpVerseRange'),
  networkSetPvpEasyMode: (data: { playerId: string; easy: boolean }) => ipcRenderer.invoke('network:setPvpEasyMode', data),
  networkSetPlayerTeam: (data: { playerId: string; team: string }) => ipcRenderer.invoke('network:setPlayerTeam', data),
  networkStartGame: () => ipcRenderer.invoke('network:startGame'),
  networkGetRoomInfo: () => ipcRenderer.invoke('network:getRoomInfo'),

  // PvP (호스트용)
  networkPvpReady: (data: { characterName: string; characterType: number; stats: any }) => ipcRenderer.invoke('network:pvpReady', data),
  networkPvpAttack: () => ipcRenderer.invoke('network:pvpAttack'),
  networkPvpEnd: () => ipcRenderer.invoke('network:pvpEnd'),
  onPvpEvent: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('pvp:event', callback);
  },
  removePvpListener: () => {
    ipcRenderer.removeAllListeners('pvp:event');
  },
  onGiftNotification: (callback: (event: any, data: { senderName: string; itemName: string; isConsumable: boolean }) => void) => {
    ipcRenderer.on('gift:notification', callback);
  },
  removeGiftNotificationListener: () => {
    ipcRenderer.removeAllListeners('gift:notification');
  },

  // 업데이트
  onUpdateStatus: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('update:status', callback);
  },
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update:status');
  },

  // 소모품
  getConsumables: (characterId: number) => ipcRenderer.invoke('consumable:getAll', characterId),
  useConsumable: (data: { characterId: number; type: string }) => ipcRenderer.invoke('consumable:use', data),
  addConsumable: (data: { characterId: number; type: string; quantity: number }) => ipcRenderer.invoke('consumable:add', data),

  // 소모품 전송
  consumableTransfer: (data: { fromCharacterId: number; toCharacterId: number; type: string; quantity: number }) => ipcRenderer.invoke('consumable:transfer', data),

  // 네트워크 선물
  giftReceiveItem: (data: { characterId: number; item: any }) => ipcRenderer.invoke('gift:receiveItem', data),
  networkGiftItem: (data: { targetPlayerId: string; characterId: number; item: any }) => ipcRenderer.invoke('network:giftItem', data),
  networkGiftConsumable: (data: { targetPlayerId: string; characterId: number; type: string; quantity: number }) => ipcRenderer.invoke('network:giftConsumable', data),

  // DB 초기화
  adminClearDb: () => ipcRenderer.invoke('admin:clearDb'),

  // PvP 전적
  getPvpRecord: (characterName: string) => ipcRenderer.invoke('pvp:getRecord', characterName),

  // 디버그
  debugSetLevel: (data: { characterId: number; level: number; expPercent: number }) => ipcRenderer.invoke('debug:setLevel', data),

  // 파일 내보내기/가져오기
  exportVerses: () => ipcRenderer.invoke('file:exportVerses'),
  importVerses: () => ipcRenderer.invoke('file:importVerses'),
  exportCharacter: (characterId: number) => ipcRenderer.invoke('file:exportCharacter', characterId),
  importCharacter: () => ipcRenderer.invoke('file:importCharacter'),
});
