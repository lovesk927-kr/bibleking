import React from 'react';
import type { Character } from '../types';
import { VILLAGES } from '../constants';

interface Props {
  character: Character;
  onSelect: (villageId: number) => void;
  onBack: () => void;
}

export function VillageSelect({ character, onSelect, onBack }: Props) {
  const unlockedVillages = VILLAGES.filter(v => character.level >= v.levelReq);
  const lockedVillages = VILLAGES.filter(v => character.level < v.levelReq);

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

        {lockedVillages.slice(0, 3).map(village => (
          <div key={village.id} className="village-card locked">
            <div className="village-emoji">{village.emoji}</div>
            <div className="village-info">
              <div className="village-name">{village.name}</div>
              <div className="village-desc locked-text">🔒 Lv.{village.levelReq} 달성 시 해금</div>
            </div>
            <div className="village-level locked-level">Lv.{village.levelReq}</div>
          </div>
        ))}
        {lockedVillages.length > 3 && (
          <div className="village-more">... 외 {lockedVillages.length - 3}개 마을</div>
        )}
      </div>

      <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
    </div>
  );
}
