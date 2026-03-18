import React, { useState, useEffect } from 'react';
import type { Character, RoguelikeRunEnd as RunEndType } from '../types';

interface Props {
  character: Character;
  onDone: () => void;
}

export function RoguelikeRunEnd({ character, onDone }: Props) {
  const [result, setResult] = useState<RunEndType | null>(null);

  useEffect(() => {
    window.api.roguelikeEndRun(character.id).then(setResult);
  }, [character.id]);

  if (!result) return <div className="roguelike-run-end"><p>결과 집계 중...</p></div>;

  return (
    <div className="roguelike-run-end">
      <h1 className="run-end-title">던전 탐험 종료</h1>

      <div className="run-end-summary">
        <div className="summary-item">
          <span className="summary-label">처치한 몬스터</span>
          <span className="summary-value">{result.monstersKilled}마리</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">최고 콤보</span>
          <span className="summary-value">{result.maxCombo}</span>
        </div>
        <div className="summary-item highlight">
          <span className="summary-label">획득한 별</span>
          <span className="summary-value">{result.starsEarned}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">총 보유 별</span>
          <span className="summary-value">{result.totalStars}</span>
        </div>
      </div>

      {result.newAchievements.length > 0 && (
        <div className="new-achievements">
          <h3>새 업적 달성!</h3>
          {result.newAchievements.map(a => (
            <div key={a.id} className="new-achievement">
              ✅ {a.name} (⭐ +{a.reward})
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-large" onClick={onDone}>
        로비로 돌아가기
      </button>
    </div>
  );
}
