import React, { useEffect, useState } from 'react';
import type { ReciteResult as ReciteResultType } from '../types';
import { useApi } from '../api-context';

interface Props {
  result: ReciteResultType;
  villageId?: number;
  onClose: () => void;
  onBack: () => void;
}

export function ReciteResult({ result, villageId = 1, onClose, onBack }: Props) {
  const requiredScore = Math.max(0, villageId - 1);
  const [verseRef, setVerseRef] = useState({ book: '시편', chapter: '119' });
  const { api } = useApi();

  useEffect(() => {
    api.adminGetSettings().then((s) => {
      setVerseRef({ book: s.book, chapter: s.chapter });
    });
  }, []);
  const scorePercent = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;

  return (
    <div className="page recite-result">
      <h1 className="title">📋 채점 결과</h1>

      <div className="score-summary">
        <div className="score-circle">
          <span className="score-number">{scorePercent}</span>
          <span className="score-unit">점</span>
        </div>
        <p className="score-detail">{result.score} / {result.totalQuestions} 정답</p>
      </div>

      <div className="exp-gain">
        <span className="exp-text">★ 경험치 +{result.earnedExp} 획득! ★</span>
        {result.leveledUp && (
          <div className="level-up-notice">
            🎉 레벨업! Lv.{(result.newLevel ?? 1) - 1} → Lv.{result.newLevel} 🎉
          </div>
        )}
      </div>

      <div className="result-list">
        {result.results.map((r) => (
          <div key={r.verse_number} className={`result-item ${r.correct ? 'correct' : 'wrong'}`}>
            <div className="result-header">
              <span className="verse-num">{verseRef.book} {verseRef.chapter}:{r.verse_number}</span>
              <span className={`result-badge ${r.correct ? 'correct' : 'wrong'}`}>
                {r.correct ? '✓ 정답' : '✗ 오답'}
              </span>
            </div>
            {!r.correct && (
              <div className="result-compare">
                <div className="answer-row">
                  <span className="answer-label wrong">내 답:</span>
                  <span className="answer-text">{r.userAnswer || '(미입력)'}</span>
                </div>
                <div className="answer-row">
                  <span className="answer-label correct">정답:</span>
                  <span className="answer-text">{r.correctAnswer}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {result.score >= requiredScore ? (
        <>
          {result.score > 0 && (
            <div className="score-boost-info">
              💪 암송 점수 {scorePercent}% → 공격력 부스트 적용!
            </div>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            ⚔️ 전투 시작!
          </button>
        </>
      ) : (
        <>
          <div className="score-boost-info" style={{ color: '#f44336', borderColor: '#f44336' }}>
            이 마을에서는 최소 {requiredScore}문제 이상 맞춰야 전투에 참여할 수 있습니다!
          </div>
          <button className="btn btn-secondary" onClick={onBack}>
            돌아가기
          </button>
        </>
      )}
    </div>
  );
}
