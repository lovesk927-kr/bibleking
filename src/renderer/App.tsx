import React, { useState } from 'react';
import { CharacterSelect } from './pages/CharacterSelect';
import { CharacterCreate } from './pages/CharacterCreate';
import { MainScreen } from './pages/MainScreen';
import { VillageSelect } from './pages/VillageSelect';
import { VillageUnlock } from './pages/VillageUnlock';
import { MonsterEncounter } from './pages/MonsterEncounter';
import { ReciteQuiz } from './pages/ReciteQuiz';
import { ReciteResult } from './pages/ReciteResult';
import { BattleScreen } from './pages/BattleScreen';
import { Inventory } from './pages/Inventory';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPanel } from './pages/AdminPanel';
import { RewardBox } from './pages/RewardBox';
import { CharacterDetail } from './pages/CharacterDetail';
import { TrainingMode } from './pages/TrainingMode';
import { NetworkModeSelect } from './pages/NetworkModeSelect';
import { HostLobby } from './pages/HostLobby';
import { ClientConnect } from './pages/ClientConnect';
import { ClientLobby } from './pages/ClientLobby';
import { PvpBattle } from './pages/PvpBattle';
import { LocalApiProvider, HostApiProvider, ClientApiProvider, useApi } from './api-context';
import { VILLAGES, type Village } from './constants';
import { NetworkClient } from './network-client';
import type {
  Character,
  Monster,
  ReciteResult as ReciteResultType,
  BattleResult as BattleResultType,
  Item,
} from './types';

type GamePage =
  | 'main'
  | 'villageSelect'
  | 'villageUnlock'
  | 'monsterEncounter'
  | 'recite'
  | 'reciteResult'
  | 'battle'
  | 'inventory'
  | 'rewardBox'
  | 'characterDetail'
  | 'training';

// 공통 게임 플레이 컴포넌트 (로컬/호스트/클라이언트 공용)
function GamePlay({ character: initialCharacter, onBack, isNetworkMode }: {
  character: Character;
  onBack: () => void;
  isNetworkMode: boolean;
}) {
  const [page, setPage] = useState<GamePage>('main');
  const [character, setCharacter] = useState<Character>(initialCharacter);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [reciteResult, setReciteResult] = useState<ReciteResultType | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResultType | null>(null);
  const [rewards, setRewards] = useState<Item[]>([]);
  const [battleCount, setBattleCount] = useState(0);
  const [selectedVillageId, setSelectedVillageId] = useState(() => {
    const maxVillage = VILLAGES.filter(v => v.levelReq <= initialCharacter.level);
    return maxVillage.length > 0 ? maxVillage[maxVillage.length - 1].id : 1;
  });
  const [unlockedVillage, setUnlockedVillage] = useState<Village | null>(null);
  const [preBattleLevel, setPreBattleLevel] = useState(0);

  const { api } = useApi();
  const navigate = (p: GamePage) => setPage(p);

  const checkVillageUnlock = (oldLevel: number, newLevel: number) => {
    // 새로 해금된 마을 중 가장 높은 마을 찾기
    const newlyUnlocked = VILLAGES.filter(v => v.levelReq > oldLevel && v.levelReq <= newLevel);
    if (newlyUnlocked.length > 0) {
      const highest = newlyUnlocked[newlyUnlocked.length - 1];
      setUnlockedVillage(highest);
      setSelectedVillageId(highest.id);
      navigate('villageUnlock');
      return true;
    }
    return false;
  };

  const handleVillageUnlockClose = () => {
    setUnlockedVillage(null);
    navigate('main');
  };

  const handleSelectVillage = (villageId: number) => { setSelectedVillageId(villageId); navigate('monsterEncounter'); };
  const handleStartRecite = (monster: Monster) => { setPreBattleLevel(character.level); setCurrentMonster(monster); setBattleCount(c => c + 1); navigate('recite'); };
  const handleReciteComplete = (result: ReciteResultType) => { setReciteResult(result); navigate('reciteResult'); };

  const handleResultClose = async () => {
    if (!currentMonster || !reciteResult) return;
    const scorePercent = reciteResult.totalQuestions > 0 ? Math.round((reciteResult.score / reciteResult.totalQuestions) * 100) : 0;
    const result = await api.fight({ characterId: character.id, monsterId: currentMonster.id, monster: currentMonster, scorePercent, noDrop: !!(reciteResult as any).usedPerfectScore });
    setBattleResult(result);
    navigate('battle');
  };

  const handleBattleClose = async () => {
    if (battleResult?.victory && battleResult.battleExp > 0) {
      const updated = await api.getCharacter(character.id);
      if (updated) setCharacter(updated);
    }
    const levelUpRewards = (reciteResult?.rewards || []).map((r: any) => ({ ...r, isLevelUp: true }));
    const battleDrops = battleResult?.victory ? (battleResult?.battleRewards || []) : [];
    const allRewards = [...levelUpRewards, ...battleDrops];
    if (allRewards.length > 0) {
      setRewards(allRewards);
      navigate('rewardBox');
    } else {
      const updated = await api.getCharacter(character.id);
      if (updated) {
        setCharacter(updated);
        if (!checkVillageUnlock(preBattleLevel, updated.level)) {
          navigate('main');
        }
      } else {
        navigate('main');
      }
    }
  };

  const handleRewardClose = async () => {
    const updated = await api.getCharacter(character.id);
    if (updated) {
      setCharacter(updated);
      if (!checkVillageUnlock(preBattleLevel, updated.level)) {
        navigate('main');
      }
    } else {
      navigate('main');
    }
  };

  return (
    <>
      {page === 'main' && (
        <MainScreen character={character} onRecite={() => navigate('monsterEncounter')} onTraining={() => navigate('training')} onInventory={() => navigate('inventory')} onDetail={() => navigate('characterDetail')} onBack={onBack} isNetworkMode={isNetworkMode} />
      )}
      {page === 'villageUnlock' && unlockedVillage && <VillageUnlock village={unlockedVillage} onClose={handleVillageUnlockClose} />}
      {page === 'villageSelect' && <VillageSelect character={character} onSelect={handleSelectVillage} onBack={() => navigate('monsterEncounter')} />}
      {page === 'monsterEncounter' && <MonsterEncounter character={character} villageId={selectedVillageId} onStartRecite={handleStartRecite} onChangeVillage={() => navigate('villageSelect')} onBack={() => navigate('main')} />}
      {page === 'recite' && <ReciteQuiz key={`recite-${battleCount}`} character={character} villageId={selectedVillageId} onComplete={handleReciteComplete} onBack={() => navigate('monsterEncounter')} />}
      {page === 'reciteResult' && reciteResult && <ReciteResult result={reciteResult} villageId={selectedVillageId} onClose={handleResultClose} onBack={() => navigate('monsterEncounter')} />}
      {page === 'battle' && battleResult && <BattleScreen battleResult={battleResult} onClose={handleBattleClose} />}
      {page === 'rewardBox' && <RewardBox rewards={rewards} onClose={handleRewardClose} />}
      {page === 'training' && <TrainingMode character={character} onBack={() => navigate('main')} />}
      {page === 'characterDetail' && <CharacterDetail character={character} onBack={() => navigate('main')} onCharacterUpdate={setCharacter} />}
      {page === 'inventory' && <Inventory character={character} onBack={() => navigate('main')} />}
    </>
  );
}

export default function App() {
  const [networkMode, setNetworkMode] = useState<'local' | 'host' | 'client'>('local');
  const [networkClient, setNetworkClient] = useState<NetworkClient | null>(null);
  const [clientCharacter, setClientCharacter] = useState<Character | null>(null);
  const [hostCharacter, setHostCharacter] = useState<Character | null>(null);

  const resetToLocal = () => {
    if (networkClient) networkClient.disconnect();
    setNetworkMode('local');
    setNetworkClient(null);
    setClientCharacter(null);
    setHostCharacter(null);
  };

  // 클라이언트 모드 - 캐릭터 미선택 시 로컬 DB에서 선택
  if (networkMode === 'client' && networkClient && !clientCharacter) {
    return (
      <LocalApiProvider>
        <div className="app">
          <CharacterSelect
            onSelect={(c) => setClientCharacter(c)}
            onCreate={() => {}}
            onAdmin={() => {}}
            onNetwork={() => {}}
            isNetworkMode={true}
            isHost={false}
          />
        </div>
      </LocalApiProvider>
    );
  }

  // 클라이언트 모드 - 캐릭터 선택 완료 후
  if (networkMode === 'client' && networkClient && clientCharacter) {
    return (
      <ClientApiProvider client={networkClient}>
        <ClientApp
          client={networkClient}
          character={clientCharacter}
          onCharacterSelected={setClientCharacter}
          onDisconnect={resetToLocal}
        />
      </ClientApiProvider>
    );
  }

  // 호스트 모드
  if (networkMode === 'host') {
    return (
      <HostApiProvider>
        <HostApp
          character={hostCharacter}
          onCharacterSelected={setHostCharacter}
          onBack={resetToLocal}
        />
      </HostApiProvider>
    );
  }

  // 로컬 모드
  return (
    <LocalApiProvider>
      <LocalApp
        onHostMode={() => setNetworkMode('host')}
        onClientConnected={(client) => {
          setNetworkMode('client');
          setNetworkClient(client);
        }}
      />
    </LocalApiProvider>
  );
}

// ===== 로컬 모드 =====
function LocalApp({ onHostMode, onClientConnected }: {
  onHostMode: () => void;
  onClientConnected: (client: NetworkClient) => void;
}) {
  type LocalPage = 'characterSelect' | 'characterCreate' | 'game' | 'adminLogin' | 'admin' | 'networkSelect' | 'clientConnect';
  const [page, setPage] = useState<LocalPage>('characterSelect');
  const [character, setCharacter] = useState<Character | null>(null);

  const handleSelectCharacter = (c: Character) => {
    setCharacter(c);
    setPage('game');
  };

  return (
    <div className="app">
      {page === 'characterSelect' && (
        <CharacterSelect
          onSelect={handleSelectCharacter}
          onCreate={() => setPage('characterCreate')}
          onAdmin={() => setPage('adminLogin')}
          onNetwork={() => setPage('networkSelect')}
          isNetworkMode={false}
          isHost={false}
        />
      )}
      {page === 'characterCreate' && <CharacterCreate onComplete={handleSelectCharacter} onBack={() => setPage('characterSelect')} />}
      {page === 'game' && character && (
        <GamePlay character={character} onBack={() => setPage('characterSelect')} isNetworkMode={false} />
      )}
      {page === 'adminLogin' && <AdminLogin onSuccess={() => setPage('admin')} onBack={() => setPage('characterSelect')} />}
      {page === 'admin' && <AdminPanel onBack={() => setPage('characterSelect')} />}
      {page === 'networkSelect' && (
        <NetworkModeSelect
          onHost={onHostMode}
          onJoin={() => setPage('clientConnect')}
          onBack={() => setPage('characterSelect')}
        />
      )}
      {page === 'clientConnect' && (
        <ClientConnect
          onConnected={onClientConnected}
          onBack={() => setPage('networkSelect')}
        />
      )}
    </div>
  );
}

// ===== 호스트 모드 =====
function HostApp({ character, onCharacterSelected, onBack }: {
  character: Character | null;
  onCharacterSelected: (c: Character) => void;
  onBack: () => void;
}) {
  type HostPage = 'characterSelect' | 'lobby' | 'game' | 'pvp';
  const [page, setPage] = useState<HostPage>('characterSelect');
  const [gameCharacter, setGameCharacter] = useState<Character | null>(character);

  const handleSelectCharacter = (c: Character) => {
    onCharacterSelected(c);
    setGameCharacter(c);
    setPage('lobby');
  };

  const handleStartGame = (c: Character, mode: string) => {
    setGameCharacter(c);
    if (mode === 'pvp') {
      setPage('pvp');
    } else {
      setPage('game');
    }
  };

  const handleCloseLobby = async () => {
    await window.api.networkStopServer();
    onBack();
  };

  return (
    <div className="app">
      {page === 'characterSelect' && (
        <CharacterSelect
          onSelect={handleSelectCharacter}
          onCreate={() => {}}
          onAdmin={() => {}}
          onNetwork={() => {}}
          isNetworkMode={true}
          isHost={true}
        />
      )}
      {page === 'lobby' && gameCharacter && (
        <HostLobby
          character={gameCharacter}
          onStartGame={handleStartGame}
          onBack={handleCloseLobby}
        />
      )}
      {page === 'pvp' && gameCharacter && (
        <PvpBattle character={gameCharacter} isHost={true} onEnd={() => setPage('lobby')} />
      )}
      {page === 'game' && gameCharacter && (
        <GamePlay character={gameCharacter} onBack={handleCloseLobby} isNetworkMode={true} />
      )}
    </div>
  );
}

// ===== 클라이언트 모드 =====
function ClientApp({ client, character, onCharacterSelected, onDisconnect }: {
  client: NetworkClient;
  character: Character | null;
  onCharacterSelected: (c: Character) => void;
  onDisconnect: () => void;
}) {
  type ClientPage = 'lobby' | 'game' | 'pvp';
  const [page, setPage] = useState<ClientPage>('lobby');
  const [gameCharacter, setGameCharacter] = useState<Character | null>(character);

  const handleGameStart = (c: Character, mode: string) => {
    setGameCharacter(c);
    if (mode === 'pvp') {
      setPage('pvp');
    } else {
      setPage('game');
    }
  };

  return (
    <div className="app">
      {page === 'lobby' && gameCharacter && (
        <ClientLobby
          client={client}
          character={gameCharacter}
          onGameStart={handleGameStart}
          onBack={onDisconnect}
        />
      )}
      {page === 'pvp' && gameCharacter && (
        <PvpBattle character={gameCharacter} isHost={false} client={client} onEnd={() => setPage('lobby')} />
      )}
      {page === 'game' && gameCharacter && (
        <>
          <div className="network-status-bar">
            <span className="network-status-dot connected"></span>
            <span>네트워크 모드</span>
          </div>
          <GamePlay character={gameCharacter} onBack={onDisconnect} isNetworkMode={true} />
        </>
      )}
    </div>
  );
}

