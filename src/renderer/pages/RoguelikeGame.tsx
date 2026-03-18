import React, { useState, useEffect, useCallback } from 'react';
import { RoguelikeLobby } from './RoguelikeLobby';
import { RoguelikePathSelect } from './RoguelikePathSelect';
import { RoguelikeBattle } from './RoguelikeBattle';
import { RoguelikeShop } from './RoguelikeShop';
import { RoguelikeEvent } from './RoguelikeEvent';
import { RoguelikeBuffSelect } from './RoguelikeBuffSelect';
import { RoguelikeElite } from './RoguelikeElite';
import { RoguelikeRunEnd } from './RoguelikeRunEnd';
import { BossBattle } from './BossBattle';
import { Cutscene } from './Cutscene';
import { VillageUnlock } from './VillageUnlock';
import { VILLAGE_CUTSCENES, VILLAGE_ENTER_SCENES, VILLAGES } from '../constants';
import type { Character, RoguelikeRunState, RoguelikePermanentState, Item } from '../types';

type Phase = 'lobby' | 'path_select' | 'battle' | 'elite' | 'shop' | 'event' | 'buff_select' | 'run_end' | 'boss_enter_cutscene' | 'boss_battle' | 'boss_reward' | 'boss_cutscene' | 'village_unlock' | 'village_enter_cutscene';

interface Props {
  character: Character;
  onBack: () => void;
  onCharacterUpdate: (c: Character) => void;
}

export function RoguelikeGame({ character, onBack, onCharacterUpdate }: Props) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [runState, setRunState] = useState<RoguelikeRunState | null>(null);
  const [permState, setPermState] = useState<RoguelikePermanentState | null>(null);
  const [charLevel, setCharLevel] = useState(character.level);
  const [charExp, setCharExp] = useState(character.exp);
  const [charMaxExp, setCharMaxExp] = useState(character.max_exp);
  const [expGain, setExpGain] = useState<number | null>(null);
  const [bossReward, setBossReward] = useState<Item | null>(null);
  const [bossCutsceneData, setBossCutsceneData] = useState<{ scenes: any[]; title: string } | null>(null);
  const [bossCompleteResult, setBossCompleteResult] = useState<{ runState: RoguelikeRunState; bossVictory: boolean; finalVictory?: boolean } | null>(null);
  const [bossDefeatedVillageId, setBossDefeatedVillageId] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const toastIdRef = React.useRef(0);
  const shownToastsRef = React.useRef<Set<string>>(new Set());

  const showToast = (message: string, key?: string) => {
    if (key) {
      if (shownToastsRef.current.has(key)) return;
      shownToastsRef.current.add(key);
    }
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const loadPermState = useCallback(async () => {
    const state = await window.api.roguelikeGetState(character.id);
    setPermState(state);
  }, [character.id]);

  useEffect(() => { loadPermState(); }, [loadPermState]);

  // F3: 보스 즉시 소환 (디버그)
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if (e.key === 'F3' && runState && phase !== 'lobby' && phase !== 'boss_battle') {
        const state = await window.api.roguelikeDebugBoss(character.id);
        if (state) {
          setRunState(state);
          goToPhase(state);
        }
      }
      if (e.key === 'F4' && runState && phase !== 'lobby') {
        const state = await window.api.roguelikeDebugEvent(character.id);
        if (state) {
          setRunState(state);
          setPhase('event');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [character.id, runState, phase]);

  const handleStartRun = async (startBuffs: string[], villageId: number) => {
    const state = await window.api.roguelikeStartRun({ characterId: character.id, startBuffs, villageId });
    if (state) {
      setRunState(state);
      setPhase('path_select');
      shownToastsRef.current.clear();
    }
  };

  const handleChoosePath = async (choice: 'left' | 'right') => {
    const state = await window.api.roguelikeChoosePath({ characterId: character.id, choice });
    if (state) {
      setRunState(state);
      goToPhase(state);
    }
  };

  const goToPhase = async (state: RoguelikeRunState) => {
    if (state.roomType === 'boss_battle') {
      // 보스 진입 컷신 확인
      const enterCutscene = VILLAGE_CUTSCENES.find(c => c.villageId === state.villageId && c.type === 'enter');
      if (enterCutscene) {
        const seen = await window.api.getCutsceneSeen({ characterId: character.id, villageId: state.villageId, type: 'boss_enter' });
        if (!seen) {
          setBossCutsceneData({ scenes: enterCutscene.scenes, title: VILLAGES.find(v => v.id === state.villageId)?.name + ' - 보스 등장' });
          setPhase('boss_enter_cutscene');
          return;
        }
      }
    }
    setPhase(state.roomType as Phase);
  };

  const handleRunStateUpdate = (state: RoguelikeRunState) => {
    setRunState(state);
    goToPhase(state);
  };

  const handleDeath = () => {
    setPhase('run_end');
  };

  const handleRunEnd = async () => {
    await loadPermState();
    const updated = await window.api.getCharacter(character.id);
    if (updated) onCharacterUpdate(updated);
    setRunState(null);
    setPhase('lobby');
  };

  const handleShopDone = () => {
    if (!runState) return;
    // 상점 끝 -> 버프 선택 또는 경로 선택
    setPhase('path_select');
  };

  const handleEventDone = (newState: RoguelikeRunState) => {
    setRunState(newState);
    goToPhase(newState);
  };

  const handleBuffDone = (newState: RoguelikeRunState) => {
    setRunState(newState);
    goToPhase(newState);
  };

  const handleEliteChoice = async (fight: boolean) => {
    const state = await window.api.roguelikeEliteChoice({ characterId: character.id, fight });
    if (state) {
      setRunState(state);
      goToPhase(state);
    }
  };

  if (phase === 'lobby') {
    return (
      <RoguelikeLobby
        character={character}
        permState={permState}
        onStartRun={handleStartRun}
        onBack={onBack}
        onUpgrade={async (type) => {
          const result = await window.api.roguelikeUpgrade({ characterId: character.id, upgradeType: type });
          if (result.success) setPermState(result.state);
          return result;
        }}
      />
    );
  }

  if (!runState) return null;

  return (
    <div className="page roguelike-game">
      {/* 상단 HUD */}
      <div className="roguelike-hud">
        <div className="hud-top-row">
          <div className="hud-room">처치 {runState.monstersKilled}</div>
          <div className="hud-level">Lv.{charLevel}</div>
          <button className="hud-exit-btn" onClick={() => setPhase('run_end')}>나가기</button>
        </div>
        <div className="hud-hp">
          HP {runState.playerHp}/{runState.playerMaxHp}
          <div className="hud-hp-bar">
            <div className="hud-hp-fill" style={{ width: `${(runState.playerHp / runState.playerMaxHp) * 100}%` }} />
          </div>
        </div>
        <div className="hud-exp">
          EXP {charExp}/{charMaxExp}
          <div className="hud-exp-bar">
            <div className="hud-exp-fill" style={{ width: `${(charExp / charMaxExp) * 100}%` }} />
          </div>
          {expGain && <span className="exp-gain-popup">+{expGain} EXP</span>}
        </div>
        <div className="hud-stats">
          <span>⚔️{runState.playerAttack}</span>
          <span>🛡️{runState.playerDefense}</span>
          <span>💰{runState.gold}</span>
        </div>
        {runState.combo > 0 && (
          <div className="hud-combo">{runState.combo} COMBO! ×{Math.min(2.0, 1 + runState.combo * 0.02).toFixed(2)}</div>
        )}
      </div>

      {/* 토스트 알림 */}
      {toasts.length > 0 && (
        <div className="roguelike-toast-container">
          {toasts.map(t => (
            <div key={t.id} className="roguelike-toast">{t.message}</div>
          ))}
        </div>
      )}

      {phase === 'path_select' && (
        <RoguelikePathSelect
          runState={runState}
          onChoose={handleChoosePath}
        />
      )}

      {phase === 'battle' && runState.monster && (
        <RoguelikeBattle
          character={character}
          runState={runState}
          onTurnComplete={(turnResult) => {
            setRunState(prev => prev ? {
              ...prev,
              playerHp: turnResult.playerHp,
              playerMaxHp: turnResult.playerMaxHp,
              playerAttack: turnResult.playerAttack ?? prev.playerAttack,
              playerDefense: turnResult.playerDefense ?? prev.playerDefense,
              combo: turnResult.combo,
              maxCombo: Math.max(prev.maxCombo, turnResult.combo),
              monstersKilled: turnResult.monsterDefeated ? prev.monstersKilled + 1 : prev.monstersKilled,
              gold: prev.gold + turnResult.goldEarned,
              maxGoldHeld: Math.max(prev.maxGoldHeld, prev.gold + turnResult.goldEarned),
              monster: prev.monster ? {
                ...prev.monster,
                hp: turnResult.monsterHp,
              } : null,
            } : prev);
            // 콤보 마일스톤 토스트
            if (turnResult.combo === 10) showToast('🔥 10 COMBO 달성!', 'combo_10');
            if (turnResult.combo === 20) showToast('🔥🔥 20 COMBO 달성!', 'combo_20');
            if (turnResult.combo === 30) showToast('🔥🔥🔥 30 COMBO!', 'combo_30');
            if (turnResult.combo === 50) showToast('💥 50 COMBO! 최대 배율!', 'combo_50');
            // 레벨업 토스트
            if (turnResult.leveledUp && turnResult.newLevel) {
              showToast(`⬆️ 레벨 업! Lv.${turnResult.newLevel}`, `level_${turnResult.newLevel}`);
            }
            // 경험치 업데이트
            if (turnResult.expEarned > 0) {
              setExpGain(turnResult.expEarned);
              setTimeout(() => setExpGain(null), 1500);
              if (turnResult.leveledUp && turnResult.newLevel) {
                setCharLevel(turnResult.newLevel);
                // 레벨업 시 서버에서 최신 정보 가져오기
                window.api.getCharacter(character.id).then(c => {
                  if (c) {
                    setCharExp(c.exp);
                    setCharMaxExp(c.max_exp);
                  }
                });
              } else {
                setCharExp(prev => prev + turnResult.expEarned);
              }
            }
          }}
          onMonsterDefeated={async () => {
            // 서버에서 roomType이 결정됨
            const state = await window.api.roguelikeChoosePath({ characterId: character.id, choice: 'left' });
            // 실제로는 completeTurn에서 이미 roomType 변경됨
            // path_select로 이동은 RoguelikeBattle에서 처리
          }}
          onDeath={handleDeath}
          onStateUpdate={handleRunStateUpdate}
        />
      )}

      {phase === 'elite' && runState.monster && (
        <RoguelikeElite
          monster={runState.monster}
          onChoice={handleEliteChoice}
        />
      )}

      {phase === 'shop' && (
        <RoguelikeShop
          character={character}
          runState={runState}
          onBuy={async (itemId) => {
            const result = await window.api.roguelikeShopBuy({ characterId: character.id, shopItemId: itemId });
            if (result.success) {
              setRunState(prev => prev ? {
                ...prev,
                gold: result.gold,
                playerHp: result.playerHp,
                playerMaxHp: result.playerMaxHp,
                playerAttack: result.playerAttack,
                playerDefense: result.playerDefense,
              } : prev);
            }
            return result;
          }}
          onDone={handleShopDone}
        />
      )}

      {phase === 'event' && (
        <RoguelikeEvent
          character={character}
          onDone={handleEventDone}
        />
      )}

      {phase === 'buff_select' && (
        <RoguelikeBuffSelect
          character={character}
          onDone={handleBuffDone}
        />
      )}

      {phase === 'boss_enter_cutscene' && bossCutsceneData && (
        <Cutscene
          scenes={bossCutsceneData.scenes}
          characterName={character.name}
          characterType={character.character_type}
          title={bossCutsceneData.title}
          onComplete={() => {
            setBossCutsceneData(null);
            window.api.setCutsceneSeen({ characterId: character.id, villageId: runState.villageId, type: 'boss_enter' });
            setPhase('boss_battle');
          }}
        />
      )}

      {phase === 'boss_battle' && runState && (
        <BossBattle
          character={character}
          villageId={runState.villageId}
          onComplete={async (result) => {
            const clearedVillageId = runState.villageId;
            const res = await window.api.roguelikeBossComplete({
              characterId: character.id,
              villageId: clearedVillageId,
              victory: result.victory,
            });
            if (!res) return;
            setRunState(res.runState);
            setBossCompleteResult(res);
            setBossDefeatedVillageId(clearedVillageId);

            if (!res.bossVictory) {
              setPhase('run_end');
              return;
            }

            // 보상이 있으면 보상 화면부터
            if (res.reward) {
              setBossReward(res.reward);
              setPhase('boss_reward');
            } else {
              // 보상 없으면 컷신 확인
              const clearCutscene = VILLAGE_CUTSCENES.find(c => c.villageId === clearedVillageId && c.type === 'clear');
              if (clearCutscene) {
                setBossCutsceneData({ scenes: clearCutscene.scenes, title: '보스 처치!' });
                setPhase('boss_cutscene');
              } else if (res.finalVictory) {
                setPhase('run_end');
              } else {
                // 컷신/보상 없어도 마을 해금 화면은 보여줌
                const nextVillage = VILLAGES.find(v => v.id === clearedVillageId + 1);
                if (nextVillage) {
                  setPhase('village_unlock');
                } else {
                  goToPhase(res.runState);
                }
              }
            }
          }}
          onBack={() => setPhase('run_end')}
        />
      )}

      {phase === 'boss_reward' && bossReward && (
        <div className="boss-reward-overlay">
          <div className="boss-reward-content">
            <h2>보스 처치 보상!</h2>
            <div className={`boss-reward-card rarity-${bossReward.rarity}`}>
              <div className="boss-reward-name">{bossReward.name}</div>
              <div className="boss-reward-desc">{bossReward.description}</div>
              <div className="boss-reward-stat">
                {bossReward.stat_type} +{bossReward.stat_bonus}
              </div>
              <div className="boss-reward-rarity">{bossReward.rarity}</div>
            </div>
            <button className="btn btn-primary" onClick={() => {
              setBossReward(null);
              const clearCutscene = VILLAGE_CUTSCENES.find(c => c.villageId === bossDefeatedVillageId && c.type === 'clear');
              if (clearCutscene) {
                setBossCutsceneData({ scenes: clearCutscene.scenes, title: '보스 처치!' });
                setPhase('boss_cutscene');
              } else if (bossCompleteResult?.finalVictory) {
                setPhase('run_end');
              } else {
                // 클리어 컷신 없어도 마을 해금 화면은 보여줌
                const nextVillage = VILLAGES.find(v => v.id === bossDefeatedVillageId + 1);
                if (nextVillage) {
                  setPhase('village_unlock');
                } else if (bossCompleteResult) {
                  goToPhase(bossCompleteResult.runState);
                }
              }
            }}>
              확인
            </button>
          </div>
        </div>
      )}

      {phase === 'boss_cutscene' && bossCutsceneData && (
        <Cutscene
          scenes={bossCutsceneData.scenes}
          characterName={character.name}
          characterType={character.character_type}
          title={bossCutsceneData.title}
          onComplete={() => {
            setBossCutsceneData(null);
            window.api.setCutsceneSeen({ characterId: character.id, villageId: bossDefeatedVillageId, type: 'boss_clear' });
            if (bossCompleteResult?.finalVictory) {
              setPhase('run_end');
            } else {
              // 다음 마을 해금 화면
              const nextVillage = VILLAGES.find(v => v.id === bossDefeatedVillageId + 1);
              if (nextVillage) {
                setPhase('village_unlock');
              } else if (bossCompleteResult) {
                goToPhase(bossCompleteResult.runState);
              }
            }
          }}
        />
      )}

      {phase === 'village_unlock' && (() => {
        const nextVillage = VILLAGES.find(v => v.id === bossDefeatedVillageId + 1);
        if (!nextVillage) return null;
        return (
          <VillageUnlock
            village={nextVillage}
            onClose={() => {
              // 마을 진입 컷신 확인
              const enterScene = VILLAGE_ENTER_SCENES.find(c => c.villageId === nextVillage.id);
              if (enterScene) {
                setBossCutsceneData({ scenes: enterScene.scenes, title: `${nextVillage.name}` });
                setPhase('village_enter_cutscene');
              } else if (bossCompleteResult) {
                goToPhase(bossCompleteResult.runState);
              }
            }}
          />
        );
      })()}

      {phase === 'village_enter_cutscene' && bossCutsceneData && (
        <Cutscene
          scenes={bossCutsceneData.scenes}
          characterName={character.name}
          characterType={character.character_type}
          title={bossCutsceneData.title}
          onComplete={() => {
            setBossCutsceneData(null);
            const nextVillageId = bossDefeatedVillageId + 1;
            window.api.setCutsceneSeen({ characterId: character.id, villageId: nextVillageId, type: 'village_enter' });
            if (bossCompleteResult) {
              goToPhase(bossCompleteResult.runState);
            }
          }}
        />
      )}

      {phase === 'run_end' && (
        <RoguelikeRunEnd
          character={character}
          onDone={handleRunEnd}
        />
      )}
    </div>
  );
}
