import React, { useEffect } from 'react';
import type { RoguelikeRunState } from '../types';

interface Props {
  runState: RoguelikeRunState;
  onChoose: (choice: 'left' | 'right') => void;
}

export function RoguelikePathSelect({ runState, onChoose }: Props) {
  // 자동으로 다음 진행
  useEffect(() => {
    const timer = setTimeout(() => {
      onChoose('left');
    }, 1200);
    return () => clearTimeout(timer);
  }, [onChoose]);

  return (
    <div className="roguelike-path-select">
      <div className="path-info">
        <div className="room-transition-icon">⚔️</div>
        <h2>다음 적 탐색 중...</h2>
      </div>

      {/* 활성 버프 표시 */}
      {runState.activeBuffs.length > 0 && (
        <div className="active-buffs-display">
          {runState.activeBuffs.map((b, i) => (
            <span key={i} className="buff-tag">{b.name}</span>
          ))}
        </div>
      )}

      <div className="path-stats-summary">
        <span>처치: {runState.monstersKilled}</span>
        <span>금화: {runState.gold}</span>
      </div>
    </div>
  );
}
