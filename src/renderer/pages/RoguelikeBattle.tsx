import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Character, RoguelikeRunState, RoguelikeTurnResult, RoguelikeQuestion } from '../types';

interface Props {
  character: Character;
  runState: RoguelikeRunState;
  onTurnComplete: (result: RoguelikeTurnResult) => void;
  onMonsterDefeated: () => void;
  onDeath: () => void;
  onStateUpdate: (state: RoguelikeRunState) => void;
}

export function RoguelikeBattle({ character, runState, onTurnComplete, onDeath, onStateUpdate }: Props) {
  const [question, setQuestion] = useState<RoguelikeQuestion | null>(null);
  const [filledBlanks, setFilledBlanks] = useState<Record<number, string>>({});
  const [remainingBlanks, setRemainingBlanks] = useState(0);
  const [answer, setAnswer] = useState('');
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'answering' | 'result'>('loading');
  const [lastResult, setLastResult] = useState<RoguelikeTurnResult | null>(null);
  const [itemDrop, setItemDrop] = useState<any>(null);
  const [itemRevealed, setItemRevealed] = useState(false);
  const [monsterDying, setMonsterDying] = useState(false);
  const [pendingDefeatedResult, setPendingDefeatedResult] = useState<RoguelikeTurnResult | null>(null);
  const [showWrongAnswer, setShowWrongAnswer] = useState(false);
  const [localMonster, setLocalMonster] = useState(runState.monster);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // 부모에서 monster가 바뀌면 로컬도 업데이트 (단, dying 중에는 유지)
  useEffect(() => {
    if (runState.monster && !monsterDying) {
      setLocalMonster(runState.monster);
    }
  }, [runState.monster, monsterDying]);

  const monster = localMonster;

  const loadQuestion = useCallback(async () => {
    setItemDrop(null);
    const q = await window.api.roguelikeGetQuestion({ characterId: character.id, reciteMode: character.recite_mode });
    if (q) {
      setQuestion(q);
      setFilledBlanks({});
      setRemainingBlanks(q.blankCount);
      setAnswer('');
      setPhase('answering');
      if (q.timeLimit > 0) setTimeLeft(q.timeLimit);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [character.id, character.recite_mode]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // F2: 자동 정답 입력 (테스트용)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'F2' && phase === 'answering' && question) {
        e.preventDefault();
        // 아직 안 채운 빈칸 그룹의 정답을 찾아서 순서대로 제출
        const groups = question.blankGroups || question.blankIndices.map(i => [i]);
        for (const group of groups) {
          if (group.every(idx => filledBlanks[idx])) continue;
          const ans = group.map(idx => question.words[idx]).join(' ');
          const result = await window.api.roguelikeSubmitAnswer({ characterId: character.id, answer: ans });
          if (result.correct) {
            const newFilled: Record<number, string> = { ...filledBlanks };
            for (const idx of result.filledIndices) {
              newFilled[idx] = question.words[idx] || '';
            }
            setFilledBlanks(newFilled);
            setRemainingBlanks(result.remainingBlanks);
            if (result.remainingBlanks === 0) {
              clearInterval(timerRef.current);
              setPhase('result');
              const turnResult = await window.api.roguelikeCompleteTurn({ characterId: character.id, allCorrect: true });
              if (turnResult) processResult(turnResult, true);
              return;
            }
          }
          break; // 한 번에 하나씩
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, question, filledBlanks, character.id]);

  // 타이머
  useEffect(() => {
    if (phase !== 'answering' || !question || question.timeLimit === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, question]);

  const handleTimeUp = async () => {
    clearInterval(timerRef.current);
    setPhase('result');
    // 빈칸에 빨간색으로 정답 표시
    setShowWrongAnswer(true);
    const result = await window.api.roguelikeCompleteTurn({ characterId: character.id, allCorrect: false });
    if (result) {
      setTimeout(() => {
        setShowWrongAnswer(false);
        processResult(result, false);
      }, 1500);
    }
  };

  const processResult = (result: RoguelikeTurnResult, isAttack: boolean) => {
    setLastResult(result);
    setBattleLog(prev => [...prev, result.log]);
    onTurnComplete(result);

    if (result.playerDead) {
      setTimeout(() => onDeath(), 1500);
    } else if (result.monsterDefeated) {
      // 몬스터 처치 애니메이션
      setMonsterDying(true);
      setTimeout(() => {
        setMonsterDying(false);
        if (isAttack && result.itemDrop) {
          // 아이템 드롭 → 카드 오픈 화면
          setItemDrop(result.itemDrop);
          setItemRevealed(false);
          setPendingDefeatedResult(result);
        } else {
          handleMonsterDefeated(result);
        }
      }, 1500);
    } else {
      setTimeout(() => loadQuestion(), 1200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || phase !== 'answering') return;

    const result = await window.api.roguelikeSubmitAnswer({ characterId: character.id, answer: answer.trim() });
    setAnswer('');

    if (result.correct) {
      // 채워진 인덱스들 표시
      const newFilled: Record<number, string> = { ...filledBlanks };
      for (const idx of result.filledIndices) {
        newFilled[idx] = question?.words[idx] || '';
      }
      setFilledBlanks(newFilled);
      setRemainingBlanks(result.remainingBlanks);

      if (result.remainingBlanks === 0) {
        clearInterval(timerRef.current);
        setPhase('result');
        const turnResult = await window.api.roguelikeCompleteTurn({ characterId: character.id, allCorrect: true });
        if (turnResult) processResult(turnResult, true);
      }
    } else {
      clearInterval(timerRef.current);
      setPhase('result');
      // 빈칸에 빨간색으로 정답 표시
      setShowWrongAnswer(true);
      const turnResult = await window.api.roguelikeCompleteTurn({ characterId: character.id, allCorrect: false });
      if (turnResult) {
        setTimeout(() => {
          setShowWrongAnswer(false);
          processResult(turnResult, false);
        }, 1500);
      }
    }

    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleItemConfirm = () => {
    if (pendingDefeatedResult) {
      setItemDrop(null);
      setItemRevealed(false);
      handleMonsterDefeated(pendingDefeatedResult);
      setPendingDefeatedResult(null);
    }
  };

  const handleMonsterDefeated = (result: RoguelikeTurnResult) => {
    setTimeout(() => {
      const fakeState: RoguelikeRunState = {
        ...runState,
        playerHp: result.playerHp,
        playerMaxHp: result.playerMaxHp,
        playerAttack: result.playerAttack ?? runState.playerAttack,
        playerDefense: result.playerDefense ?? runState.playerDefense,
        combo: result.combo,
        maxCombo: Math.max(runState.maxCombo, result.combo),
        monstersKilled: runState.monstersKilled,
        gold: runState.gold,
        monster: null,
        roomType: 'path_select',
      };
      onStateUpdate(fakeState);
    }, 500);
  };

  if (!monster) return null;

  // 연속 블랭크를 하나의 긴 블랭크로 렌더링
  const renderWords = () => {
    if (!question) return null;
    const groups = question.blankGroups || question.blankIndices.map(i => [i]);
    const rendered: React.ReactNode[] = [];
    let i = 0;

    while (i < question.words.length) {
      const isBlank = question.blankIndices.includes(i);

      if (isBlank) {
        // 이 인덱스가 속한 그룹 찾기
        const group = groups.find(g => g.includes(i));
        if (group && i === group[0]) {
          // 그룹의 시작: 전체 그룹을 하나로 표시
          const allFilled = group.every(idx => filledBlanks[idx]);
          const filledText = allFilled ? group.map(idx => filledBlanks[idx] || question.words[idx]).join(' ') : null;
          // 글자 수에 맞춰 블랭크 너비 계산
          const answerText = group.map(idx => question.words[idx]).join(' ');
          const charCount = answerText.length;

          // 오답 시 빈칸에 빨간색으로 정답 표시
          if (showWrongAnswer && !allFilled) {
            rendered.push(
              <span key={i} className="word wrong-answer">
                {answerText}{' '}
              </span>
            );
          } else {
            rendered.push(
              <span key={i} className={`word ${allFilled ? 'filled' : 'blank'}`}
                style={!allFilled ? { minWidth: `${Math.max(2, charCount) * 0.9}em` } : undefined}>
                {filledText || '\u00A0'}
                {' '}
              </span>
            );
          }
          i = group[group.length - 1] + 1; // 그룹 끝으로 건너뛰기
          continue;
        }
      }

      if (!isBlank) {
        rendered.push(
          <span key={i} className="word">
            {question.words[i]}
            {' '}
          </span>
        );
      }
      i++;
    }

    return rendered;
  };

  return (
    <div className="roguelike-battle">
      {/* 몬스터 정보 */}
      <div className={`monster-display ${monster.isElite ? 'elite' : ''} ${monsterDying ? 'monster-dying' : ''}`}>
        <div className="monster-emoji-large">{monster.emoji}</div>
        <div className="monster-name">{monster.name} Lv.{monster.level}</div>
        <div className="monster-hp-bar">
          <div className="monster-hp-fill" style={{ width: `${(lastResult ? lastResult.monsterHp : monster.hp) / monster.maxHp * 100}%` }} />
          <span className="monster-hp-text">{lastResult ? lastResult.monsterHp : monster.hp} / {monster.maxHp}</span>
        </div>
      </div>

      {/* 전투 로그 */}
      {battleLog.length > 0 && (
        <div className="battle-log-mini">
          {battleLog.slice(-3).map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      )}

      {/* 아이템 드랍 카드 */}
      {itemDrop && (
        <div className="item-drop-overlay">
          <div className="item-drop-title">아이템 획득!</div>
          {!itemRevealed ? (
            <div className="item-card item-card-closed" onClick={() => setItemRevealed(true)}>
              <div className="item-card-back">
                <span className="item-card-icon">🎁</span>
                <div className="item-card-hint">클릭하여 열기</div>
              </div>
            </div>
          ) : (
            <div className={`item-card item-card-opened rarity-${itemDrop.rarity}`}>
              <div className="item-card-rarity">{itemDrop.rarity === 'legendary' ? '전설' : itemDrop.rarity === 'epic' ? '영웅' : itemDrop.rarity === 'rare' ? '희귀' : '일반'}</div>
              <div className="item-card-name">{itemDrop.name}</div>
              <div className="item-card-desc">{itemDrop.description}</div>
              <div className="item-card-stat">
                {itemDrop.stat_type === 'attack' ? '⚔️ 공격력' : itemDrop.stat_type === 'defense' ? '🛡️ 방어력' : itemDrop.stat_type === 'hp' ? '❤️ 체력' : '💨 회피'} +{itemDrop.stat_bonus}
              </div>
              <button className="btn btn-primary item-card-confirm" onClick={handleItemConfirm}>확인</button>
            </div>
          )}
        </div>
      )}

      {/* 구절 & 블랭크 */}
      {question && (
        <div className="verse-display">
          <div className="verse-ref">{question.verseRef}</div>
          <div className="verse-words">{renderWords()}</div>
          <div className="blank-info">
            남은 빈칸: {remainingBlanks} / {question.blankCount}
          </div>
        </div>
      )}

      {/* 타이머 */}
      {question && question.timeLimit > 0 && phase === 'answering' && (
        <div className={`timer-display ${timeLeft <= 3 ? 'timer-urgent' : ''}`}>
          {timeLeft}초
        </div>
      )}

      {/* 입력 */}
      {phase === 'answering' && (
        <form onSubmit={handleSubmit} className="answer-form">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="빈칸의 답을 입력하세요"
            className="answer-input"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">입력</button>
        </form>
      )}

      {/* 결과 표시 */}
      {phase === 'result' && lastResult && !showWrongAnswer && (
        <div className={`turn-result ${lastResult.isPlayerAttack ? 'player-attack' : 'monster-attack'}`}>
          <div className="result-text">{lastResult.log}</div>
        </div>
      )}
    </div>
  );
}
