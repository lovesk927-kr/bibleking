import React, { useState, useEffect } from 'react';
import type { Character, RoguelikePermanentState } from '../types';
import { VILLAGES } from '../constants';

interface Props {
  character: Character;
  permState: RoguelikePermanentState | null;
  onStartRun: (startBuffs: string[], villageId: number) => void;
  onBack: () => void;
  onUpgrade: (type: string) => Promise<{ success: boolean; message: string }>;
}

export function RoguelikeLobby({ character, permState, onStartRun, onBack, onUpgrade }: Props) {
  const [tab, setTab] = useState<'main' | 'upgrades' | 'achievements'>('main');
  const [selectedBuffs, setSelectedBuffs] = useState<string[]>([]);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [selectedVillage, setSelectedVillage] = useState(1);
  const [bossClears, setBossClears] = useState<number[]>([]);

  useEffect(() => {
    window.api.getBossClears(character.id).then((clears) => {
      setBossClears(clears);
      // 갈 수 있는 최대 마을을 기본 선택
      let maxAvailable = 1;
      for (const v of VILLAGES) {
        const unlocked = v.id === 1 || clears.includes(v.id - 1);
        if (unlocked) maxAvailable = v.id;
      }
      setSelectedVillage(maxAvailable);
    });
  }, [character.id, character.level]);

  if (!permState) return <div className="page"><p>로딩 중...</p></div>;

  const maxSlots = permState.startBuffSlots;

  const toggleBuff = (id: string) => {
    setSelectedBuffs(prev => {
      if (prev.includes(id)) return prev.filter(b => b !== id);
      if (prev.length >= maxSlots) return prev;
      return [...prev, id];
    });
  };

  const handleUpgrade = async (type: string) => {
    const result = await onUpgrade(type);
    setUpgradeMsg(result.message);
    setTimeout(() => setUpgradeMsg(''), 2000);
  };

  return (
    <div className="page roguelike-lobby">
      <h1 className="roguelike-title">게임 모드</h1>

      {/* 탭 메뉴 */}
      <div className="roguelike-tabs">
        <button className={`tab-btn ${tab === 'main' ? 'active' : ''}`} onClick={() => setTab('main')}>메인</button>
        <button className={`tab-btn ${tab === 'upgrades' ? 'active' : ''}`} onClick={() => setTab('upgrades')}>영구 강화</button>
        <button className={`tab-btn ${tab === 'achievements' ? 'active' : ''}`} onClick={() => setTab('achievements')}>업적</button>
      </div>

      {tab === 'main' && (
        <div className="roguelike-main-tab">
          {/* 기록 */}
          <div className="roguelike-records">
            <h3>내 기록</h3>
            <div className="record-grid">
              <div className="record-item"><span className="record-label">총 런</span><span className="record-value">{permState.totalRuns}</span></div>
              <div className="record-item"><span className="record-label">총 처치</span><span className="record-value">{permState.totalMonstersKilled}</span></div>
              <div className="record-item"><span className="record-label">최고 콤보</span><span className="record-value">{permState.bestCombo}</span></div>
              <div className="record-item"><span className="record-label">보유 별</span><span className="record-value">{permState.stars}</span></div>
            </div>
          </div>

          {/* 시작 버프 선택 */}
          {permState.unlockedStartBuffs.length > 0 && (
            <div className="roguelike-start-buffs">
              <h3>시작 버프 (최대 {maxSlots}개)</h3>
              <div className="buff-select-grid">
                {permState.unlockedStartBuffs.map(sb => (
                  <button
                    key={sb.id}
                    className={`buff-select-btn ${selectedBuffs.includes(sb.id) ? 'selected' : ''}`}
                    onClick={() => toggleBuff(sb.id)}
                  >
                    <div className="buff-name">{sb.name}</div>
                    <div className="buff-desc">{sb.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 마을 선택 */}
          <div className="roguelike-village-select">
            <h3>마을 선택</h3>
            <div className="village-grid">
              {VILLAGES.map(v => {
                const unlocked = v.id === 1 || bossClears.includes(v.id - 1);
                const available = unlocked;
                return (
                  <button
                    key={v.id}
                    className={`village-btn ${selectedVillage === v.id ? 'selected' : ''} ${!available ? 'locked' : ''}`}
                    onClick={() => available && setSelectedVillage(v.id)}
                    disabled={!available}
                  >
                    <span className="village-emoji">{v.emoji}</span>
                    <span className="village-name">{v.name}</span>
                    {!unlocked && <span className="village-lock">🔒</span>}
                    {bossClears.includes(v.id) && <span className="village-cleared">✅</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="roguelike-actions">
            <button className="btn btn-primary btn-large" onClick={() => onStartRun(selectedBuffs, selectedVillage)}>
              던전 입장
            </button>
            <button className="btn btn-back" onClick={onBack}>뒤로</button>
          </div>
        </div>
      )}

      {tab === 'upgrades' && (
        <div className="roguelike-upgrades-tab">
          <h3>영구 강화 (보유: {permState.stars})</h3>
          {upgradeMsg && <div className="upgrade-msg">{upgradeMsg}</div>}
          <div className="upgrade-grid">
            {permState.upgrades.map(u => (
              <div key={u.type} className="upgrade-card">
                <div className="upgrade-name">{u.name}</div>
                <div className="upgrade-desc">{u.description}</div>
                <div className="upgrade-level">{u.level} / {u.maxLevel}</div>
                {u.level < u.maxLevel ? (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleUpgrade(u.type)}
                    disabled={permState.stars < u.cost}
                  >
                    {u.cost} 업그레이드
                  </button>
                ) : (
                  <span className="upgrade-maxed">MAX</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="roguelike-achievements-tab">
          <h3>업적</h3>
          <div className="achievement-list">
            {permState.achievements.map(a => (
              <div key={a.id} className={`achievement-item ${a.unlocked ? 'unlocked' : ''}`}>
                <div className="achievement-icon">{a.unlocked ? '✅' : '🔒'}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{a.name}</div>
                  <div className="achievement-desc">{a.description}</div>
                </div>
                <div className="achievement-reward">⭐ +{a.reward}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
