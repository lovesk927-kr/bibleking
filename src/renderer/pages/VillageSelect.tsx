import React, { useState, useEffect } from 'react';
import type { Character } from '../types';
import { VILLAGES } from '../constants';

interface Props {
  character: Character;
  onSelect: (villageId: number) => void;
  onBack: () => void;
}

export function VillageSelect({ character, onSelect, onBack }: Props) {
  const [bossClears, setBossClears] = useState<number[]>([]);

  useEffect(() => {
    window.api.getBossClears(character.id).then(setBossClears);
  }, [character.id]);

  // 마을 해금 조건: 레벨 충족 + 이전 마을 보스 클리어 (1번 마을은 항상 해금)
  const isUnlocked = (villageId: number) => {
    const village = VILLAGES.find(v => v.id === villageId);
    if (!village) return false;
    if (character.level < village.levelReq) return false;
    if (villageId === 1) return true;
    return bossClears.includes(villageId - 1);
  };

  const unlockedVillages = VILLAGES.filter(v => isUnlocked(v.id));
  const lockedVillages = VILLAGES.filter(v => !isUnlocked(v.id));

  return (
    <div className="page village-select">
      <h1 className="title">🗺️ 마을 선택</h1>

      <div className="village-list">
        {unlockedVillages.map(village => (
          <div
            key={village.id}
            className="village-card unlocked"
            onClick={() => onSelect(village.id)}
          >
            <div className="village-emoji">{village.emoji}</div>
            <div className="village-info">
              <div className="village-name">{village.name}</div>
              <div className="village-desc">{village.description}</div>
              <div className="village-monsters">
                {village.monsters.map(m => m.emoji).join(' ')} {village.monsters.map(m => m.name).join(', ')}
              </div>
            </div>
            <div className="village-level">Lv.{village.levelReq}+</div>
          </div>
        ))}

        {lockedVillages.slice(0, 3).map(village => {
          const needsBoss = character.level >= village.levelReq && !bossClears.includes(village.id - 1);
          return (
            <div key={village.id} className="village-card locked">
              <div className="village-emoji">{village.emoji}</div>
              <div className="village-info">
                <div className="village-name">{village.name}</div>
                <div className="village-desc locked-text">
                  {needsBoss
                    ? '⚔️ 이전 마을 보스를 처치하면 해금'
                    : `🔒 Lv.${village.levelReq} 달성 시 해금`}
                </div>
              </div>
              <div className="village-level locked-level">Lv.{village.levelReq}</div>
            </div>
          );
        })}
        {lockedVillages.length > 3 && (
          <div className="village-more">... 외 {lockedVillages.length - 3}개 마을</div>
        )}
      </div>

      <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
    </div>
  );
}
