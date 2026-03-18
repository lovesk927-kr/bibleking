import React from 'react';
import type { RoguelikeMonster } from '../types';

interface Props {
  monster: RoguelikeMonster;
  onChoice: (fight: boolean) => void;
}

export function RoguelikeElite({ monster, onChoice }: Props) {
  return (
    <div className="roguelike-elite">
      <div className="elite-warning">엘리트 몬스터 등장!</div>
      <div className="elite-monster-card">
        <div className="elite-emoji">{monster.emoji}</div>
        <div className="elite-name">{monster.name}</div>
        <div className="elite-level">Lv.{monster.level}</div>
        <div className="elite-stats">
          <span>HP: {monster.hp}</span>
          <span>공격: {monster.attack}</span>
          <span>방어: {monster.defense}</span>
        </div>
      </div>
      <div className="elite-reward-info">
        승리 보상: 아이템 100% + 금화 2배 + 별 보너스
      </div>
      <div className="elite-choices">
        <button className="btn btn-danger btn-large" onClick={() => onChoice(true)}>
          도전!
        </button>
        <button className="btn btn-secondary" onClick={() => onChoice(false)}>
          도망
        </button>
      </div>
    </div>
  );
}
