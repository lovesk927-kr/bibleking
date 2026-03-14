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
