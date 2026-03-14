import React, { useEffect, useState, useRef } from 'react';
import type { BattleResult } from '../types';

interface Props {
  battleResult: BattleResult;
  onClose: () => void;
}

export function BattleScreen({ battleResult, onClose }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 전투 로그를 한 줄씩 표시
    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= battleResult.log.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(timer);
  }, [battleResult.log.length]);

  // 로그 추가될 때마다 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLines]);

  const allShown = visibleLines >= battleResult.log.length;

  return (
    <div className="page battle-screen">
      <h1 className="title">
        {battleResult.victory ? '⚔️ 전투 승리!' : '⚔️ 전투...'}
      </h1>

      <div className="battle-log">
        {battleResult.log.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`log-line ${line === '---' ? 'log-divider' : ''} ${line.includes('승리') ? 'log-victory' : ''} ${line.includes('패배') ? 'log-defeat' : ''} ${line.includes('크리티컬') ? 'log-crit' : ''} ${line.includes('드롭') ? 'log-drop' : ''}`}
          >
            {line === '---' ? '' : line}
          </div>
        ))}
        {!allShown && <div className="log-cursor">▮</div>}
        <div ref={logEndRef} />
      </div>

      {allShown && (
        <div className="battle-summary">
          {battleResult.victory ? (
            <div className="victory-banner">
              <span className="victory-text">🎉 승리!</span>
              <span className="battle-exp">전투 경험치 +{battleResult.battleExp}</span>
            </div>
          ) : (
            <div className="defeat-banner">
              <span className="defeat-text">💀 패배</span>
              <span className="battle-hint">장비를 강화하거나 암송 점수를 올려보세요!</span>
            </div>
          )}

          {battleResult.battleRewards.length > 0 && (
            <div className="battle-drops">
              <p className="drop-title">🎁 아이템 상자 {battleResult.battleRewards.length}개 획득!</p>
            </div>
          )}

          <button className="btn btn-primary" onClick={onClose}>
            {battleResult.battleRewards.length > 0 ? '상자 열기 📦' : '확인'}
          </button>
        </div>
      )}

      {!allShown && (
        <button className="btn btn-secondary" onClick={() => setVisibleLines(battleResult.log.length)}>
          스킵 ▶▶
        </button>
      )}
    </div>
  );
}
