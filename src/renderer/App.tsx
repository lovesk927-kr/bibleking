import React, { useState, useEffect } from 'react';
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
import { TrainingMode2 } from './pages/TrainingMode2';
import { NetworkModeSelect } from './pages/NetworkModeSelect';
import { HostLobby } from './pages/HostLobby';
import { ClientConnect } from './pages/ClientConnect';
import { ClientLobby } from './pages/ClientLobby';
import { PvpBattle } from './pages/PvpBattle';
import { BossBattle } from './pages/BossBattle';
import { Cutscene } from './pages/Cutscene';
import { LocalApiProvider, HostApiProvider, ClientApiProvider, useApi } from './api-context';
import { VILLAGES, PROLOGUE_SCENES, VILLAGE_CUTSCENES, VILLAGE_ENTER_SCENES, ENDING_SCENES, getBossForVillage, type Village } from './constants';
import { NetworkClient } from './network-client';
import type {
  Character,
  Monster,
  ReciteResult as ReciteResultType,
  BattleResult as BattleResultType,
  BossBattleResult,
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
  | 'training'
  | 'training2'
  | 'bossBattle'
  | 'cutscene';

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
  const [rewardLevelUp, setRewardLevelUp] = useState<{ from: number; to: number } | null>(null);
  const [battleCount, setBattleCount] = useState(0);
  const [selectedVillageId, setSelectedVillageId] = useState(1);

  // 보스 클리어 기반으로 최대 해금 마을 설정
  useEffect(() => {
    api.getBossClears(initialCharacter.id).then((clears: number[]) => {
      let maxId = 1;
      for (const v of VILLAGES) {
        if (v.levelReq > initialCharacter.level) break;
        if (v.id === 1 || clears.includes(v.id - 1)) maxId = v.id;
        else break;
      }
      setSelectedVillageId(maxId);
    });
  }, [initialCharacter.id]);
  const [unlockedVillage, setUnlockedVillage] = useState<Village | null>(null);
  const [preBattleLevel, setPreBattleLevel] = useState(0);
  const [cutsceneData, setCutsceneData] = useState<{ scenes: any[]; title?: string; onComplete: () => void } | null>(null);
  const [bossVillageId, setBossVillageId] = useState(0);
  const [pendingBossUnlock, setPendingBossUnlock] = useState<Village | null>(null);
  const [pendingBossCutscene, setPendingBossCutscene] = useState<{ scenes: any[]; title: string } | null>(null);

  const { api } = useApi();
  const navigate = (p: GamePage) => setPage(p);

  const handleVillageUnlockClose = async () => {
    const village = unlockedVillage;
    setUnlockedVillage(null);

    // 해금된 마을의 진입 컷신 보여주기
    if (village) {
      const enterCutscene = VILLAGE_ENTER_SCENES.find(c => c.villageId === village.id);
      const enterSeen = await api.getCutsceneSeen({ characterId: character.id, villageId: village.id, type: 'village_enter' });
      if (enterCutscene && !enterSeen) {
        setCutsceneData({
          scenes: enterCutscene.scenes,
          title: `${village.name}`,
          onComplete: async () => {
            await api.setCutsceneSeen({ characterId: character.id, villageId: village.id, type: 'village_enter' });
            navigate('main');
          },
        });
        navigate('cutscene');
        return;
      }
    }
    navigate('main');
  };

  // 암송 버튼 클릭 시: 보스전 조건 확인
  const handleReciteClick = async () => {
    const bossClears = await api.getBossClears(character.id);

    // 보스 미클리어 마을 중 다음 마을 레벨을 충족한 곳 찾기 (가장 낮은 마을부터)
    for (const village of VILLAGES) {
      const boss = getBossForVillage(village.id);
      if (!boss) continue;
      if (bossClears.includes(village.id)) continue; // 이미 클리어

      // 다음 마을 레벨 요구치를 충족하면 보스전 진입
      const nextVillage = VILLAGES.find(v => v.id === village.id + 1);
      const reachedNextLevel = nextVillage ? character.level >= nextVillage.levelReq : character.level >= village.levelReq;
      if (!reachedNextLevel) break; // 레벨 부족이면 이후 마을도 불가

      // 보스전 컷신 확인
      const enterCutscene = VILLAGE_CUTSCENES.find(c => c.villageId === village.id && c.type === 'enter');
      const enterSeen = await api.getCutsceneSeen({ characterId: character.id, villageId: village.id, type: 'boss_enter' });

      if (enterCutscene && !enterSeen) {
        setCutsceneData({
          scenes: enterCutscene.scenes,
          title: `${village.name} - 보스 등장`,
          onComplete: async () => {
            await api.setCutsceneSeen({ characterId: character.id, villageId: village.id, type: 'boss_enter' });
            setBossVillageId(village.id);
            navigate('bossBattle');
          },
        });
        navigate('cutscene');
      } else {
        setBossVillageId(village.id);
        navigate('bossBattle');
      }
      return;
    }

    navigate('monsterEncounter');
  };

  const handleBossComplete = async (result: BossBattleResult) => {
    console.log('[BossComplete] result:', JSON.stringify(result));
    setBossVillageId(0);
    const updated = await api.getCharacter(character.id);
    if (updated) setCharacter(updated);

    if (!result.victory) { navigate('main'); return; }

    // 보스 클리어 후 대기 항목 계산
    const nextVillage = VILLAGES.find(v => v.id === result.villageId + 1);
    const unlockTarget = (nextVillage && updated && updated.level >= nextVillage.levelReq) ? nextVillage : null;
    const clearCutscene = VILLAGE_CUTSCENES.find(c => c.villageId === result.villageId && c.type === 'clear');

    // 흐름: 보상 → 컷신 → 마을 해금
    if (result.reward) {
      // 보상 후에 처리할 컷신/마을해금 저장
      if (clearCutscene) setPendingBossCutscene({ scenes: clearCutscene.scenes, title: '보스 처치!' });
      if (unlockTarget) setPendingBossUnlock(unlockTarget);
      setRewards([result.reward]);
      navigate('rewardBox');
    } else if (clearCutscene) {
      // 보상 없이 컷신 → 마을 해금
      setCutsceneData({
        scenes: clearCutscene.scenes,
        title: '보스 처치!',
        onComplete: () => {
          if (unlockTarget) {
            setUnlockedVillage(unlockTarget);
            setSelectedVillageId(unlockTarget.id);
            navigate('villageUnlock');
          } else {
            navigate('main');
          }
        },
      });
      navigate('cutscene');
    } else if (unlockTarget) {
      // 보상/컷신 없이 바로 마을 해금
      setUnlockedVillage(unlockTarget);
      setSelectedVillageId(unlockTarget.id);
      navigate('villageUnlock');
    } else {
      navigate('main');
    }
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
      const currentLevel = character.level;
      const updated = await api.getCharacter(character.id);
      const newLevel = updated?.level || currentLevel;
      setRewardLevelUp(newLevel > preBattleLevel ? { from: preBattleLevel, to: newLevel } : null);
      setRewards(allRewards);
      navigate('rewardBox');
    } else {
      setRewardLevelUp(null);
      const updated = await api.getCharacter(character.id);
      if (updated) setCharacter(updated);
      navigate('main');
    }
  };

  const handleRewardClose = async () => {
    const updated = await api.getCharacter(character.id);
    if (updated) setCharacter(updated);

    // 보스전: 보상 → 컷신 → 마을 해금 순서
    if (pendingBossCutscene) {
      const cutscene = pendingBossCutscene;
      setPendingBossCutscene(null);
      setCutsceneData({
        scenes: cutscene.scenes,
        title: cutscene.title,
        onComplete: () => {
          if (pendingBossUnlock) {
            const village = pendingBossUnlock;
            setPendingBossUnlock(null);
            setUnlockedVillage(village);
            setSelectedVillageId(village.id);
            navigate('villageUnlock');
          } else {
            navigate('main');
          }
        },
      });
      navigate('cutscene');
      return;
    }

    if (pendingBossUnlock) {
      const village = pendingBossUnlock;
      setPendingBossUnlock(null);
      setUnlockedVillage(village);
      setSelectedVillageId(village.id);
      navigate('villageUnlock');
      return;
    }

    navigate('main');
  };

  // 디버그 패널 (Ctrl+Shift+D)
  const [showDebug, setShowDebug] = useState(false);
  const [debugLevel, setDebugLevel] = useState(String(character.level));
  const [debugExp, setDebugExp] = useState('99');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
        setDebugLevel(String(character.level));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character.level]);

  const handleDebugApply = async () => {
    const level = parseInt(debugLevel);
    const expPercent = parseInt(debugExp);
    if (isNaN(level) || level < 1 || isNaN(expPercent) || expPercent < 0 || expPercent > 100) return;
    await window.api.debugSetLevel({ characterId: character.id, level, expPercent });
    const updated = await api.getCharacter(character.id);
    if (updated) setCharacter(updated);
    setShowDebug(false);
  };

  const handleDebugResetBoss = async () => {
    await window.api.debugResetBoss(character.id);
    const updated = await api.getCharacter(character.id);
    if (updated) setCharacter(updated);
    setShowDebug(false);
  };

  const handleDebugAddConsumable = async (type: string, qty: number) => {
    await window.api.addConsumable({ characterId: character.id, type, quantity: qty });
    setShowDebug(false);
  };

  return (
    <>
      {showDebug && (
        <div className="debug-panel">
          <div className="debug-panel-inner">
            <h3>디버그 패널</h3>
            <p>캐릭터: {character.name} (Lv.{character.level})</p>
            <div className="debug-row">
              <label>레벨: <input type="number" value={debugLevel} onChange={e => setDebugLevel(e.target.value)} min="1" max="999" /></label>
              <label>경험치(%): <input type="number" value={debugExp} onChange={e => setDebugExp(e.target.value)} min="0" max="100" /></label>
            </div>
            <div className="debug-buttons">
              <button className="btn btn-primary" onClick={handleDebugApply}>적용</button>
              <button className="btn btn-secondary" onClick={handleDebugResetBoss}>보스 기록 초기화</button>
            </div>
            <div className="debug-buttons" style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => handleDebugAddConsumable('perfect_score', 10)}>📜 100점권 +10</button>
              <button className="btn btn-secondary" onClick={() => handleDebugAddConsumable('hint', 10)}>💡 힌트권 +10</button>
              <button className="btn btn-secondary" onClick={() => setShowDebug(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
      {page === 'main' && (
        <MainScreen character={character} onRecite={handleReciteClick} onTraining={() => navigate('training')} onTraining2={() => navigate('training2')} onInventory={() => navigate('inventory')} onDetail={() => navigate('characterDetail')} onBack={onBack} isNetworkMode={isNetworkMode} />
      )}
      {page === 'villageUnlock' && unlockedVillage && <VillageUnlock village={unlockedVillage} onClose={handleVillageUnlockClose} />}
      {page === 'villageSelect' && <VillageSelect character={character} onSelect={handleSelectVillage} onBack={() => navigate('monsterEncounter')} />}
      {page === 'monsterEncounter' && <MonsterEncounter character={character} villageId={selectedVillageId} onStartRecite={handleStartRecite} onChangeVillage={() => navigate('villageSelect')} onBack={() => navigate('main')} />}
      {page === 'recite' && <ReciteQuiz key={`recite-${battleCount}`} character={character} villageId={selectedVillageId} onComplete={handleReciteComplete} onBack={() => navigate('monsterEncounter')} />}
      {page === 'reciteResult' && reciteResult && <ReciteResult result={reciteResult} villageId={selectedVillageId} onClose={handleResultClose} onBack={() => navigate('monsterEncounter')} />}
      {page === 'battle' && battleResult && <BattleScreen battleResult={battleResult} onClose={handleBattleClose} />}
      {page === 'rewardBox' && <RewardBox rewards={rewards} onClose={handleRewardClose} levelUp={rewardLevelUp || undefined} />}
      {page === 'training' && <TrainingMode character={character} onBack={() => navigate('main')} />}
      {page === 'training2' && <TrainingMode2 character={character} onBack={() => navigate('main')} />}
      {page === 'characterDetail' && <CharacterDetail character={character} onBack={() => navigate('main')} onCharacterUpdate={setCharacter} />}
      {page === 'inventory' && <Inventory character={character} onBack={() => navigate('main')} />}
      {page === 'bossBattle' && (
        <BossBattle character={character} villageId={bossVillageId} onComplete={handleBossComplete} onBack={() => { setBossVillageId(0); navigate('main'); }} />
      )}
      {page === 'cutscene' && cutsceneData && (
        <Cutscene
          scenes={cutsceneData.scenes}
          characterName={character.name}
          characterType={character.character_type}
          onComplete={cutsceneData.onComplete}
          title={cutsceneData.title}
        />
      )}
    </>
  );
}

function UpdateOverlay() {
  const [updateStatus, setUpdateStatus] = useState<{ type: string; version?: string; percent?: number } | null>(null);

  useEffect(() => {
    if (window.api?.onUpdateStatus) {
      window.api.onUpdateStatus((_event: any, data: any) => {
        setUpdateStatus(data);
      });
      return () => {
        window.api.removeUpdateListener?.();
      };
    }
  }, []);

  if (!updateStatus || updateStatus.type === 'downloaded') return null;

  return (
    <div className="update-overlay">
      <div className="update-overlay-box">
        {updateStatus.type === 'available' && (
          <>
            <div className="update-overlay-icon">⬇️</div>
            <div className="update-overlay-text">새 버전(v{updateStatus.version})을 다운로드 중입니다...</div>
            <div className="update-overlay-sub">잠시만 기다려주세요</div>
          </>
        )}
        {updateStatus.type === 'progress' && (
          <>
            <div className="update-overlay-icon">⬇️</div>
            <div className="update-overlay-text">업데이트 다운로드 중... {updateStatus.percent}%</div>
            <div className="update-progress-bar">
              <div className="update-progress-fill" style={{ width: `${updateStatus.percent}%` }}></div>
            </div>
            <div className="update-overlay-sub">잠시만 기다려주세요</div>
          </>
        )}
      </div>
    </div>
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
      <UpdateOverlay />
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
  type LocalPage = 'characterSelect' | 'characterCreate' | 'game' | 'adminLogin' | 'admin' | 'networkSelect' | 'clientConnect' | 'prologue';
  const [page, setPage] = useState<LocalPage>('characterSelect');
  const [character, setCharacter] = useState<Character | null>(null);

  const handleSelectCharacter = async (c: Character) => {
    setCharacter(c);
    // 프롤로그 체크
    const seen = await window.api.getPrologueSeen(c.id);
    if (!seen) {
      setPage('prologue');
    } else {
      setPage('game');
    }
  };

  const handlePrologueComplete = async () => {
    if (character) {
      await window.api.setPrologueSeen(character.id);
    }
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
      {page === 'prologue' && character && (
        <Cutscene
          scenes={PROLOGUE_SCENES}
          characterName={character.name}
          characterType={character.character_type}
          onComplete={handlePrologueComplete}
          title="프롤로그"
        />
      )}
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

