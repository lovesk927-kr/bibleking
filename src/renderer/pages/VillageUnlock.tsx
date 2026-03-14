import React from 'react';
import type { Village } from '../constants';

interface Props {
  village: Village;
  onClose: () => void;
}

export function VillageUnlock({ village, onClose }: Props) {
  return (
    <div className="page village-unlock">
      <div className="village-unlock-content">
        <div className="village-unlock-badge">🎉</div>
        <h1 className="village-unlock-title">새로운 마을 해금!</h1>
        <div className="village-unlock-icon">{village.emoji}</div>
        <div className="village-unlock-name">{village.name}</div>
        <div className="village-unlock-desc">{village.description}</div>
        <div className="village-unlock-monsters-title">출현 몬스터</div>
        <div className="village-unlock-monsters">
          {village.monsters.map((m, i) => (
            <span key={i} className="village-unlock-monster">
              {m.emoji} {m.name}
            </span>
          ))}
        </div>
        <button className="btn btn-primary village-unlock-btn" onClick={onClose}>
          진출하기! →
        </button>
      </div>
    </div>
  );
}
