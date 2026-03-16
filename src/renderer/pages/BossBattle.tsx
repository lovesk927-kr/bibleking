import React, { useState, useEffect, useRef } from 'react';
import type { Character, BossBattleState, BlankQuestion, BossBattleResult, Item } from '../types';
import { getBossForVillage, CHARACTER_INFO } from '../constants';

interface Props {
  character: Character;
  villageId: number;
  onComplete: (result: BossBattleResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'playing' | 'victory' | 'defeat';

export function BossBattle({ character, villageId, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [introStep, setIntroStep] = useState(0); // 0: 암전, 1: 흔들림, 2: 보스등장, 3: 대사
  const [battleState, setBattleState] = useState<BossBattleState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<BlankQuestion | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [timer, setTimer] = useState(40);
  const [log, setLog] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [wrongAnim, setWrongAnim] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [bossHitAnim, setBossHitAnim] = useState(false);
  const [playerHitAnim, setPlayerHitAnim] = useState(false);
  const [defeatLine, setDefeatLine] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef<Phase>('intro');
  const logEndRef = useRef<HTMLDivElement>(null);

  const boss = getBossForVillage(villageId);
  const timerDuration = character.recite_mode === 1 ? 40 : 15; // 빈칸모드 40초, 주관식모드 15초

  // 인트로 시퀀스
  useEffect(() => {
    if (phase !== 'intro') return;
    const timers = [
      setTimeout(() => setIntroStep(1), 500),   // 암전 후 흔들림
      setTimeout(() => setIntroStep(2), 1500),  // 보스 등장
      setTimeout(() => setIntroStep(3), 2500),  // 대사 표시
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // 전투 시작
  const startBattle = async () => {
    const state = await window.api.startBossBattle({ characterId: character.id, villageId });
    if (!state) return;
    setBattleState(state);
    phaseRef.current = 'playing';
    setPhase('playing');
    loadNextQuestion();
  };

  const loadNextQuestion = async () => {
    const q = await window.api.getBossQuestion({ villageId, reciteMode: character.recite_mode });
    if (q) {
      setCurrentQuestion(q);
      setAnswered(false);
      setAnswerInput('');
      setTimer(timerDuration);
      setRound(prev => prev + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // 타이머
  useEffect(() => {
    if (phase !== 'playing' || !currentQuestion || answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, round, answered]);

  // 로그 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // 포커스 관리
  useEffect(() => {
    if (phase === 'playing' && !answered) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase, round, answered]);

  const handleAnswer = async (correct: boolean) => {
    if (answered || !battleState) return;
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const result = await window.api.bossAttack({ characterId: character.id, villageId, correct });

    if (correct) {
      setBossHitAnim(true);
      setTimeout(() => setBossHitAnim(false), 500);
    } else {
      setPlayerHitAnim(true);
      setTimeout(() => setPlayerHitAnim(false), 500);
    }

    setBattleState(prev => prev ? {
      ...prev,
      bossHp: result.bossHp,
      playerHp: result.playerHp,
      round: prev.round + 1,
    } : null);
    setLog(prev => [...prev, result.log]);

    // 승패 판정
    if (result.bossHp <= 0) {
      phaseRef.current = 'victory';
      const bossData = getBossForVillage(villageId);
      setDefeatLine(bossData?.defeatLine || '');
      setTimeout(() => setPhase('victory'), 1000);
    } else if (result.playerHp <= 0) {
      phaseRef.current = 'defeat';
      setTimeout(() => setPhase('defeat'), 1000);
    } else {
      setTimeout(() => loadNextQuestion(), 800);
    }
  };

  const handleSubmitAnswer = () => {
    if (answered || !currentQuestion) return;
    const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');

    // 디버그: 치트 커맨드로 보스 즉사
    if (answerInput === '/kill') {
      setBattleState(prev => prev ? { ...prev, bossHp: 0 } : null);
      setBossHitAnim(true);
      setTimeout(() => setBossHitAnim(false), 500);
      setLog(prev => [...prev, '⚡ 디버그: 보스 즉사!']);
      setAnswered(true);
      if (timerRef.current) clearInterval(timerRef.current);
      phaseRef.current = 'victory';
      const bossData = getBossForVillage(villageId);
      setDefeatLine(bossData?.defeatLine || '');
      setTimeout(() => setPhase('victory'), 1000);
      return;
    }

    // 보스전은 항상 빈칸 1개 모드
    const isCorrect = normalize(answerInput) === normalize(currentQuestion.answers[0]);
    handleAnswer(isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const handleVictoryComplete = async () => {
    const result = await window.api.completeBoss({ characterId: character.id, villageId });
    console.log('[BossBattle] completeBoss result:', JSON.stringify(result));
    onComplete(result);
  };

  const handleDefeatBack = () => {
    onBack();
  };

  if (!boss) return <div className="page"><p>보스 데이터 오류</p></div>;

  // ===== 인트로 =====
  if (phase === 'intro') {
    return (
      <div className={`page boss-battle boss-intro ${introStep >= 1 ? 'boss-shake' : ''}`}>
        <div className={`boss-intro-overlay ${introStep >= 0 ? 'boss-darken' : ''}`}>
          {introStep >= 2 && (
            <div className="boss-intro-appear">
              <div className="boss-intro-emoji">{boss.emoji}</div>
              <div className="boss-intro-title">{boss.title}</div>
              <div className="boss-intro-name">{boss.name}</div>
            </div>
          )}
          {introStep >= 3 && (
            <div className="boss-intro-dialogue">
              <p>"{boss.enterLine}"</p>
              <button className="btn btn-primary boss-start-btn" onClick={startBattle}>
                전투 시작
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== 승리 =====
  if (phase === 'victory') {
    return (
      <div className="page boss-battle boss-victory">
        <div className="boss-victory-overlay">
          <div className="boss-victory-emoji">✨</div>
          <h1 className="boss-victory-title">보스 처치!</h1>
          <div className="boss-defeat-line">
            <span className="boss-defeat-emoji">{boss.emoji}</span>
            <p>"{defeatLine}"</p>
          </div>
          <div className="boss-light-fragment">
            📜 빛의 조각을 획득했습니다!
          </div>
          <button className="btn btn-primary" onClick={handleVictoryComplete}>
            보상 확인
          </button>
        </div>
      </div>
    );
  }

  // ===== 패배 =====
  if (phase === 'defeat') {
    return (
      <div className="page boss-battle boss-defeat">
        <div className="boss-defeat-overlay">
          <div className="boss-defeat-big-emoji">{boss.emoji}</div>
          <h1 className="boss-defeat-title">패배...</h1>
          <p className="boss-defeat-taunt">"{boss.enterLine}"</p>
          <div className="boss-battle-log">
            {log.slice(-5).map((l, i) => (
              <div key={i} className="boss-log-entry">{l}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleDefeatBack}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ===== 전투 중 =====
  const bossHpPercent = battleState ? (battleState.bossHp / battleState.bossMaxHp) * 100 : 100;
  const playerHpPercent = battleState ? (battleState.playerHp / battleState.playerMaxHp) * 100 : 100;

  // 빈칸 모드에서 첫 번째 빈칸만 보여주기
  const currentBlankIndex = currentQuestion ? currentQuestion.blankIndices[0] : -1;

  return (
    <div className="page boss-battle boss-playing">
      {/* 종료 버튼 */}
      <button className="btn boss-exit-btn" onClick={onBack}>✕ 포기</button>

      {/* 보스 정보 */}
      <div className={`boss-info-section ${bossHitAnim ? 'boss-hit-shake' : ''}`}>
        <div className="boss-display">
          <span className="boss-battle-emoji">{boss.emoji}</span>
          <div className="boss-name-area">
            <span className="boss-title-small">{boss.title}</span>
            <span className="boss-name-text">{boss.name}</span>
          </div>
        </div>
        <div className="boss-hp-bar-container">
          <div className="boss-hp-bar" style={{ width: `${bossHpPercent}%` }}></div>
          <span className="boss-hp-text">
            {battleState?.bossHp ?? 0} / {battleState?.bossMaxHp ?? 0}
          </span>
        </div>
      </div>

      {/* 플레이어 정보 */}
      <div className={`player-info-section ${playerHitAnim ? 'boss-hit-shake' : ''}`}>
        <div className="player-display">
          <span className="player-battle-emoji">
            {CHARACTER_INFO[character.character_type]?.emoji || '🗡️'}
          </span>
          <span className="player-name-text">{character.name} Lv.{character.level}</span>
        </div>
        <div className="player-hp-bar-container">
          <div className="player-hp-bar" style={{ width: `${playerHpPercent}%` }}></div>
          <span className="player-hp-text">
            {battleState?.playerHp ?? 0} / {battleState?.playerMaxHp ?? 0}
          </span>
        </div>
      </div>

      {/* 문제 영역 */}
      <div className="boss-question-area">
        <div className="boss-question-header">
          <span className="boss-round">라운드 {round}</span>
          <span className={`boss-timer ${timer <= 5 ? 'boss-timer-urgent' : ''}`}>⏱ {timer}초</span>
        </div>

        {currentQuestion && (
          <div className="boss-verse-display">
            <div className="boss-verse-ref">
              {round}번째 문제 (제{currentQuestion.verseNumber}절)
            </div>
            <div className="boss-verse-content">
              {currentQuestion.words.map((word, i) => {
                if (i === currentBlankIndex) {
                  return <span key={i} className="boss-blank-word">{'_'.repeat(Math.max(4, word.length * 2))} </span>;
                }
                return <span key={i}>{word} </span>;
              })}
            </div>

            <div className={`boss-answer-box ${wrongAnim ? 'boss-wrong-shake' : ''}`}>
              <input
                ref={inputRef}
                className={`boss-answer-input ${answered ? 'boss-answer-correct' : ''}`}
                type="text"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="빈칸에 들어갈 단어를 입력하세요"
                autoFocus
                disabled={answered}
              />
              <button className="btn btn-primary boss-submit-btn" onClick={handleSubmitAnswer} disabled={answered || !answerInput.trim()}>
                공격!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 전투 로그 */}
      <div className="boss-battle-log">
        {log.slice(-4).map((l, i) => (
          <div key={i} className="boss-log-entry">{l}</div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
