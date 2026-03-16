import React, { useEffect, useState } from 'react';
import type { Character, CharacterStats } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useApi } from '../api-context';

interface Props {
  character: Character;
  onBack: () => void;
  onCharacterUpdate: (character: Character) => void;
}

export function CharacterDetail({ character, onBack, onCharacterUpdate }: Props) {
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [reciteMode, setReciteMode] = useState(character.recite_mode);
  const [exportMessage, setExportMessage] = useState('');
  const [lightFragments, setLightFragments] = useState(0);
  const { api } = useApi();

  useEffect(() => {
    api.getCharacterStats(character.id).then(setStats);
    api.getBossClears(character.id).then((clears: number[]) => setLightFragments(clears.length));
  }, [character.id]);

  const handleExport = async () => {
    const result = await api.exportCharacter(character.id);
    if (result.success) {
      setExportMessage('내보내기 완료!');
    } else {
      setExportMessage(result.error || '내보내기 취소');
    }
    setTimeout(() => setExportMessage(''), 3000);
  };

  const handleModeChange = async (mode: number) => {
    setReciteMode(mode);
    await api.updateReciteMode({ characterId: character.id, reciteMode: mode });
    const updated = await api.getCharacter(character.id);
    if (updated) onCharacterUpdate(updated);
  };

  const info = CHARACTER_INFO[character.character_type];
  const remainingExp = character.max_exp - character.exp;
  const expPercent = (character.exp / character.max_exp) * 100;

  return (
    <div className="page character-detail">
      <h1 className="title">캐릭터 상세</h1>

      <div className="detail-profile">
        <div className={`character-avatar-large type-${character.character_type}`}>
          {info.image
            ? <img src={info.image} className="character-avatar-img-large" alt="" />
            : info.emoji}
        </div>
        <h2 className="detail-name">{character.name}</h2>
        <span className="detail-class">{info.name}</span>
        <div className="detail-level">Lv.{character.level}</div>
      </div>

      <div className="detail-description">
        <div className="detail-section-title">성격 & 능력</div>
        <p className="detail-desc-text">
          {character.description || '아직 알려진 바가 없는 신비로운 모험가...'}
        </p>
      </div>

      <div className="detail-stats">
        <div className="detail-section-title">능력치</div>
        {stats && (
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-icon">⚔️</span>
              <span className="stat-label-text">공격력</span>
              <span className="stat-base">{stats.baseAttack}</span>
              {stats.bonusAttack > 0 && <span className="stat-bonus">+{stats.bonusAttack}</span>}
              <span className="stat-total">{stats.totalAttack}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🛡️</span>
              <span className="stat-label-text">방어력</span>
              <span className="stat-base">{stats.baseDefense}</span>
              {stats.bonusDefense > 0 && <span className="stat-bonus">+{stats.bonusDefense}</span>}
              <span className="stat-total">{stats.totalDefense}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">❤️</span>
              <span className="stat-label-text">체력</span>
              <span className="stat-base">{stats.baseHp}</span>
              {stats.bonusHp > 0 && <span className="stat-bonus">+{stats.bonusHp}</span>}
              <span className="stat-total">{stats.totalHp}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">💨</span>
              <span className="stat-label-text">회피율</span>
              <span className="stat-base">{stats.baseEvasion}%</span>
              {stats.bonusEvasion > 0 && <span className="stat-bonus">+{stats.bonusEvasion}%</span>}
              <span className="stat-total">{stats.totalEvasion}%</span>
            </div>
            <div className="stat-row stat-row-total">
              <span className="stat-icon">🔥</span>
              <span className="stat-label-text">종합 전투력</span>
              <span className="stat-total stat-total-power">{stats.totalAttack + stats.totalDefense + Math.floor(stats.totalHp / 10) + stats.totalEvasion}</span>
            </div>
          </div>
        )}
      </div>

      <div className="detail-recite-mode">
        <div className="detail-section-title">암송(공격) 방식</div>
        <div className="recite-mode-switch">
          <div
            className={`recite-mode-option ${reciteMode === 1 ? 'active' : ''}`}
            onClick={() => handleModeChange(1)}
          >
            <span className="recite-mode-option-icon">🔲</span>
            <span className="recite-mode-option-name">빈칸 채우기</span>
          </div>
          <div
            className={`recite-mode-option ${reciteMode === 0 ? 'active' : ''}`}
            onClick={() => handleModeChange(0)}
          >
            <span className="recite-mode-option-icon">📝</span>
            <span className="recite-mode-option-name">백지 모드</span>
            <span className="recite-mode-boost">EXP +20%</span>
          </div>
        </div>
      </div>

      <div className="light-fragment-section">
        <div className="light-fragment-header">
          <div className="detail-section-title">빛의 조각</div>
          <span className="light-fragment-count">{lightFragments} / 20</span>
        </div>
        <div className="light-fragment-bar">
          <div className="light-fragment-fill" style={{ width: `${(lightFragments / 20) * 100}%` }} />
        </div>
      </div>

      <div className="detail-exp">
        <div className="detail-section-title">경험치</div>
        <div className="exp-info">
          <div className="exp-row">
            <span>현재 경험치</span>
            <span className="exp-value">{character.exp} / {character.max_exp}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill exp" style={{ width: `${expPercent}%` }} />
          </div>
          <div className="exp-remaining">
            레벨업까지 <strong>{remainingExp} EXP</strong> 남음
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-export" onClick={handleExport}>
          캐릭터 내보내기
        </button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
      {exportMessage && <p className="file-message">{exportMessage}</p>}
    </div>
  );
}
