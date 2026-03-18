import React, { createContext, useContext } from 'react';
import { NetworkClient } from './network-client';

// window.api와 동일한 인터페이스
type ApiInterface = typeof window.api;

interface ApiContextType {
  api: ApiInterface;
  isNetworkMode: boolean;
  isHost: boolean;
}

const ApiContext = createContext<ApiContextType>({
  api: null as any,
  isNetworkMode: false,
  isHost: false,
});

export function useApi() {
  return useContext(ApiContext);
}

// 로컬 모드: window.api 그대로 사용
export function LocalApiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApiContext.Provider value={{ api: window.api, isNetworkMode: false, isHost: false }}>
      {children}
    </ApiContext.Provider>
  );
}

// 호스트 모드: window.api 그대로 사용하지만 네트워크 모드 표시
export function HostApiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApiContext.Provider value={{ api: window.api, isNetworkMode: true, isHost: true }}>
      {children}
    </ApiContext.Provider>
  );
}

// 클라이언트 모드: NetworkClient를 통해 호스트에 RPC 호출
export function ClientApiProvider({ client, children }: { client: NetworkClient; children: React.ReactNode }) {
  const networkApi: ApiInterface = {
    // 관리자
    adminLogin: (password) => client.send('admin:login', password),
    adminGetVerses: () => client.send('admin:getVerses'),
    adminSaveVerses: (data) => client.send('admin:saveVerses', data),
    adminGetSettings: () => client.send('admin:getSettings'),
    adminSaveSettings: (settings) => client.send('admin:saveSettings', settings),
    adminGetBlankTemplates: () => client.send('admin:getBlankTemplates'),
    adminSaveBlankTemplates: (templates) => client.send('admin:saveBlankTemplates', templates),

    // 캐릭터
    getCharacters: () => client.send('character:getAll'),
    createCharacter: (data) => client.send('character:create', data),
    getCharacter: (id) => client.send('character:get', id),
    getCharacterStats: (id) => client.send('character:getStats', id),
    updateReciteMode: (data) => client.send('character:updateReciteMode', data),
    deleteCharacter: (id) => client.send('character:delete', id),

    // 암송
    getQuiz: () => client.send('recite:getQuiz'),
    getQuizRange: (data) => client.send('recite:getQuizRange', data),
    submitRecite: (data) => client.send('recite:submit', data),

    // 몬스터/전투
    getRandomMonster: (data) => client.send('monster:random', data),
    fight: (data) => client.send('battle:fight', data),

    // 아이템
    getItems: (characterId) => client.send('inventory:getItems', characterId),
    equipItem: (data) => client.send('inventory:equipItem', data),
    unequipItem: (data) => client.send('inventory:unequipItem', data),
    discardItem: (data) => client.send('inventory:discardItem', data),
    synthesizeItem: (data) => client.send('inventory:synthesize', data),
    enhanceItem: (data) => client.send('inventory:enhance', data),
    transferItem: (data) => client.send('inventory:transfer', data),

    // 소모품
    getConsumables: (characterId) => client.send('consumable:getAll', characterId),
    useConsumable: (data) => client.send('consumable:use', data),
    addConsumable: (data) => client.send('consumable:add', data),
    consumableTransfer: (data) => client.send('consumable:transfer', data),

    // 네트워크 선물 (클라이언트에서는 RPC로 처리하므로 더미)
    giftReceiveItem: (data) => client.send('gift:receiveItem', data),
    networkGiftItem: () => Promise.resolve({ success: false }),
    networkGiftConsumable: () => Promise.resolve({ success: false }),

    networkSetPlayerTeam: () => Promise.resolve(false),

    // 네트워크 (클라이언트에서는 사용 안함 - 더미)
    networkStartServer: () => Promise.resolve({ success: false, error: 'Client mode' }),
    networkStopServer: () => Promise.resolve(false),
    networkGetServerInfo: () => Promise.resolve({ running: false, ip: '' }),
    networkSetHostPlayer: () => Promise.resolve(false),
    networkGetPlayers: () => Promise.resolve([]),
    networkSetRoomMode: () => Promise.resolve(false),
    networkStartGame: () => Promise.resolve(false),
    networkGetRoomInfo: () => Promise.resolve({ hostName: '', hostCharacterType: 0, hostLevel: 0, mode: 'pvp', playerCount: 0 }),

    // PvP (클라이언트에서는 사용 안함 - 더미)
    networkPvpReady: () => Promise.resolve(false),
    networkPvpAttack: () => Promise.resolve(null),
    networkPvpEnd: () => Promise.resolve(false),
    onPvpEvent: () => {},
    removePvpListener: () => {},
    onGiftNotification: () => {},
    removeGiftNotificationListener: () => {},

    // 보스
    getBossClears: (characterId) => client.send('boss:getClears', characterId),
    checkBossReady: (villageId) => client.send('boss:checkReady', villageId),
    getBossQuestion: (data) => client.send('boss:getQuestion', data),
    bossAttack: (data) => client.send('boss:attack', data),
    startBossBattle: (data) => client.send('boss:startBattle', data),
    completeBoss: (data) => client.send('boss:complete', data),

    // 컷신
    getPrologueSeen: (characterId) => client.send('cutscene:getPrologueSeen', characterId),
    setPrologueSeen: (characterId) => client.send('cutscene:setPrologueSeen', characterId),
    getCutsceneSeen: (data) => client.send('cutscene:getSeen', data),
    setCutsceneSeen: (data) => client.send('cutscene:setSeen', data),

    // 업데이트 (클라이언트에서는 사용 안함)
    onUpdateStatus: () => {},
    removeUpdateListener: () => {},

    // PvP 전적
    getPvpRecord: (name) => client.send('pvp:getRecord', name),

    // PvP 절 범위
    networkSetPvpVerseRange: () => Promise.resolve(false),
    networkGetPvpVerseRange: () => Promise.resolve({ startVerse: 1, endVerse: 32 }),
    networkSetPvpEasyMode: () => Promise.resolve(false),

    // 로그라이크 (로컬 전용 - 클라이언트에서는 더미)
    roguelikeGetState: () => Promise.resolve(null as any),
    roguelikeStartRun: () => Promise.resolve(null as any),
    roguelikeChoosePath: () => Promise.resolve(null as any),
    roguelikeGetQuestion: () => Promise.resolve(null as any),
    roguelikeSubmitAnswer: () => Promise.resolve({ correct: false, filledIndex: -1, remainingBlanks: 0 }),
    roguelikeCompleteTurn: () => Promise.resolve(null as any),
    roguelikeShopInfo: () => Promise.resolve(null as any),
    roguelikeShopBuy: () => Promise.resolve({ success: false, message: '', gold: 0, playerHp: 0, playerMaxHp: 0, playerAttack: 0, playerDefense: 0 }),
    roguelikeEventInfo: () => Promise.resolve(null as any),
    roguelikeEventChoice: () => Promise.resolve(null as any),
    roguelikeSelectBuff: () => Promise.resolve(null as any),
    roguelikeGetBuffChoices: () => Promise.resolve([]),
    roguelikeEliteChoice: () => Promise.resolve(null as any),
    roguelikeEndRun: () => Promise.resolve(null as any),
    roguelikeUpgrade: () => Promise.resolve({ success: false, message: '', state: null as any }),
    roguelikeBossComplete: () => Promise.resolve(null as any),

    // 디버그
    debugSetLevel: () => Promise.resolve(false),

    // DB 초기화
    adminClearDb: () => Promise.resolve(false),

    // 구절 번호
    getVerseNumbers: () => client.send('recite:getVerseNumbers'),

    // 파일 내보내기/가져오기 (클라이언트에서는 사용 안함 - 더미)
    exportVerses: () => Promise.resolve({ success: false, error: 'Client mode' }),
    importVerses: () => Promise.resolve({ success: false, error: 'Client mode' }),
    exportCharacter: () => Promise.resolve({ success: false, error: 'Client mode' }),
    importCharacter: () => Promise.resolve({ success: false, error: 'Client mode' }),
  };

  return (
    <ApiContext.Provider value={{ api: networkApi, isNetworkMode: true, isHost: false }}>
      {children}
    </ApiContext.Provider>
  );
}
