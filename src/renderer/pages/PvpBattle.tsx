import React, { useEffect, useState, useRef } from 'react';
import type { Character, Verse } from '../types';
import { CHARACTER_INFO } from '../constants';
import { useInputFocus } from '../hooks';
import { NetworkClient } from '../network-client';

interface Props {
  character: Character;
  isHost: boolean;
  client?: NetworkClient;
  onEnd: () => void;
}

interface TeamMember {
  id: string;
  characterName: string;
  characterType: number;
  hp: number;
  maxHp: number;
  team: 'blue' | 'red';
}

interface BlankQuestion {
  verse: Verse;
  words: string[];
  blankIndices: number[];
  answers: string[];
}

type PvpPhase = 'waiting' | 'playing' | 'result';

function generateBlankQuestion(verse: Verse): BlankQuestion {
  const words = verse.content.split(' ').filter(w => w.length > 0);
  const blankIdx = Math.floor(Math.random() * words.length);
  return {
    verse,
    words,
    blankIndices: [blankIdx],
    answers: [words[blankIdx]],
  };
}

export function PvpBattle({ character, isHost, client, onEnd }: Props) {
  const [phase, setPhase] = useState<PvpPhase>('waiting');
  const [myHp, setMyHp] = useState(0);
  const [myMaxHp, setMyMaxHp] = useState(0);
  const [myTeam, setMyTeam] = useState<'blue' | 'red'>('blue');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [enemies, setEnemies] = useState<TeamMember[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BlankQuestion | null>(null);
  const [questionNum, setQuestionNum] = useState(1);
  const [timer, setTimer] = useState(15);
  const [attackAnim, setAttackAnim] = useState<'none' | 'attack' | 'hit' | 'miss'>('none');
  const [winningTeam, setWinningTeam] = useState<string | null>(null);
  const [winnerNames, setWinnerNames] = useState<string[]>([]);
  const [loserNames, setLoserNames] = useState<string[]>([]);
  const [attackLog, setAttackLog] = useState<string[]>([]);
  const [skipCount, setSkipCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [easyMode, setEasyMode] = useState(false);
  const [showTimeoutAnswer, setShowTimeoutAnswer] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [wrongAnim, setWrongAnim] = useState(false);
  const [earnedExp, setEarnedExp] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [nullified, setNullified] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myIdRef = useRef(isHost ? 'host' : (client?.id || ''));
  const versesRef = useRef<Verse[]>([]);
  const phaseRef = useRef<PvpPhase>('waiting');
  const [inputRef, inputHandlers] = useInputFocus([phase, questionNum, answered]);

  const timerDuration = easyMode ? 40 : 15;
  const maxSkips = easyMode ? 7 : 5;

  const nextQuestion = () => {
    const verses = versesRef.current;
    if (verses.length === 0) return;
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];
    const q = generateBlankQuestion(randomVerse);
    setCurrentQuestion(q);
    setQuestionNum(prev => prev + 1);
    setAnswered(false);
    setTimer(timerDuration);
  };

  const handlePvpEvent = (data: any) => {
    console.log('[PvP] Event received:', data.type, data);
    switch (data.type) {
      case 'pvp:start': {
        setMyHp(data.myHp);
        setMyMaxHp(data.myMaxHp);
        setMyTeam(data.team || 'blue');
        setTeamMembers(data.myTeam || []);
        setEnemies(data.opponents || []);
        versesRef.current = data.verses || [];
        if (data.easyMode) setEasyMode(true);
        setTimer(data.easyMode ? 40 : 15);
        phaseRef.current = 'playing';
        setPhase('playing');
        if (data.verses && data.verses.length > 0) {
          const randomVerse = data.verses[Math.floor(Math.random() * data.verses.length)];
          const q = generateBlankQuestion(randomVerse);
          setCurrentQuestion(q);
          setQuestionNum(1);
          setAnswered(false);
        }
        break;
      }
      case 'pvp:attackResult': {
        const isMyAttack = data.attackerId === myIdRef.current;
        const isDefender = data.defenderId === myIdRef.current;
        const defenderIsMyTeam = data.defenderTeam === (myIdRef.current === 'host' ? myTeam : myTeam);

        if (data.evaded) {
          if (isMyAttack) {
            setAttackAnim('miss');
            setAttackLog(prev => [...prev, `${data.defenderName}이(가) 회피! MISS!`]);
          } else if (isDefender) {
            setAttackAnim('miss');
            setAttackLog(prev => [...prev, `공격을 회피했다! MISS!`]);
          }
        } else {
          if (isMyAttack) {
            setAttackAnim('attack');
            setAttackLog(prev => [...prev, `${data.defenderName}에게 ${data.damage} 데미지!`]);
          } else if (isDefender) {
            setAttackAnim('hit');
            setMyHp(data.defenderHp);
            setAttackLog(prev => [...prev, `${data.attackerName}에게 ${data.damage} 데미지를 받았다!`]);
          } else {
            // 같은 팀원이 공격받았거나 상대팀 내부 공격 로그
            setAttackLog(prev => [...prev, `${data.attackerName} → ${data.defenderName} ${data.damage} 데미지`]);
          }
        }

        // Update team member / enemy HP
        if (data.defenderTeam) {
          setTeamMembers(prev => prev.map(m =>
            m.id === data.defenderId ? { ...m, hp: data.defenderHp } : m
          ));
          setEnemies(prev => prev.map(m =>
            m.id === data.defenderId ? { ...m, hp: data.defenderHp } : m
          ));
        }

        setTimeout(() => setAttackAnim('none'), 800);
        break;
      }
      case 'pvp:gameOver': {
        setWinningTeam(data.winningTeam);
        setWinnerNames(data.winnerNames || []);
        setLoserNames(data.loserNames || []);
        setNullified(data.nullified || false);
        setEarnedExp(data.earnedExp || 0);
        if (data.leveledUp) {
          setLeveledUp(true);
          setNewLevel(data.newLevel || 0);
          setShowLevelUp(true);
        }
        phaseRef.current = 'result';
        setPhase('result');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        break;
      }
    }
  };

  const handlePvpEventRef = useRef(handlePvpEvent);
  handlePvpEventRef.current = handlePvpEvent;

  useEffect(() => {
    if (isHost) {
      const handler = (_event: any, data: any) => handlePvpEventRef.current(data);
      window.api.onPvpEvent(handler);
      return () => { window.api.removePvpListener(); };
    } else if (client) {
      const handler = (data: any) => handlePvpEventRef.current(data);
      client.setOnPvpEvent(handler);
      return () => { client.setOnPvpEvent(() => {}); };
    }
  }, [isHost, client]);

  useEffect(() => {
    const sendReady = async () => {
      const stats = await window.api.getCharacterStats(character.id);
      if (isHost) {
        window.api.networkPvpReady({
          characterName: character.name,
          characterType: character.character_type,
          stats,
        });
      } else if (client) {
        client.pvpReady(stats);
      }
    };
    sendReady();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || !currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowTimeoutAnswer(true);
          setTimeout(() => {
            setShowTimeoutAnswer(false);
            if (phaseRef.current === 'playing') {
              nextQuestion();
            }
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, questionNum]);

  const isDead = myHp <= 0;

  const handleSubmitAnswer = () => {
    if (answered || !currentQuestion || isDead) return;
    const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');
    const isCorrect = normalize(answerInput) === normalize(currentQuestion.answers[0]);

    if (isCorrect) {
      setAnswered(true);
      if (isHost) {
        window.api.networkPvpAttack();
      } else if (client) {
        client.pvpAttack();
      }
      setTimeout(() => {
        if (phaseRef.current === 'playing') {
          setAnswerInput('');
          nextQuestion();
          // 포커스는 useInputFocus 훅이 처리
        }
      }, 1200);
    } else {
      setWrongAnim(true);
      setAnswerInput('');
      setTimeout(() => setWrongAnim(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const handleEndGame = () => {
    if (!confirm('정말 게임을 종료하시겠습니까?\n종료 시 무효 처리되어 경험치/전적이 기록되지 않습니다.')) return;
    if (isHost) {
      window.api.networkPvpEnd();
    } else if (client) {
      client.pvpEnd();
    }
  };

  const handleSkip = () => {
    if (!answered && skipCount < maxSkips) {
      setSkipCount(prev => prev + 1);
      setAnswerInput('');
      nextQuestion();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const myInfo = CHARACTER_INFO[character.character_type];

  // Waiting phase
  if (phase === 'waiting') {
    return (
      <div className="page pvp-battle">
        <h1 className="title">PvP 팀전</h1>
        <div className="pvp-waiting">
          <div className="waiting-dot-animation">
            <span>상대방을 기다리는 중</span>
            <span className="waiting-dots">...</span>
          </div>
        </div>
      </div>
    );
  }

  // Level up celebration
  if (phase === 'result' && showLevelUp) {
    return (
      <div className="page pvp-battle">
        <div className="pvp-levelup-overlay">
          <div className="pvp-levelup-box">
            <div className="pvp-levelup-emoji">🎉</div>
            <h1 className="pvp-levelup-title">레벨 업!</h1>
            <div className="pvp-levelup-level">
              Lv.{newLevel - 1} → Lv.{newLevel}
            </div>
            <p className="pvp-levelup-text">축하합니다! PvP에서 경험치를 얻어 레벨이 올랐습니다!</p>
            <button className="btn btn-primary" onClick={() => setShowLevelUp(false)}>확인</button>
          </div>
        </div>
      </div>
    );
  }

  // Result phase
  if (phase === 'result') {
    const isWinner = winningTeam === myTeam;
    return (
      <div className="page pvp-battle">
        <h1 className="title">PvP 팀전 결과</h1>
        <div className="pvp-result">
          <div className={`pvp-result-banner ${nullified ? 'defeat' : isWinner ? 'victory' : 'defeat'}`}>
            {nullified ? '무효 처리' : isWinner ? '승리!' : '패배...'}
          </div>
          <div className="pvp-result-detail">
            {nullified ? (
              <p style={{ color: '#aaa' }}>게임 종료 요청으로 무효 처리되었습니다. 경험치/전적 변동 없음.</p>
            ) : (
              <>
                <p>승리 팀: {winningTeam === 'blue' ? '🔵 블루팀' : '🔴 레드팀'}</p>
                {earnedExp > 0 && (
                  <div className="pvp-exp-gain">
                    ★ 경험치 +{earnedExp} 획득! ★
                  </div>
                )}
                {leveledUp && (
                  <div className="pvp-exp-gain" style={{ fontSize: '0.9rem' }}>
                    🎉 Lv.{newLevel} 달성!
                  </div>
                )}
              </>
            )}
            <div className="pvp-result-names">
              <div className="pvp-result-team">
                <span className="pvp-result-team-label" style={{ color: '#4a9eff' }}>🔵 블루</span>
                {(winningTeam === 'blue' ? winnerNames : loserNames).map((n, i) => (
                  <span key={i} className="pvp-result-player-name">{n}</span>
                ))}
              </div>
              <div className="pvp-result-team">
                <span className="pvp-result-team-label" style={{ color: '#ff4a4a' }}>🔴 레드</span>
                {(winningTeam === 'red' ? winnerNames : loserNames).map((n, i) => (
                  <span key={i} className="pvp-result-player-name">{n}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pvp-attack-log">
            {attackLog.slice(-10).map((log, i) => (
              <div key={i} className="pvp-log-entry">{log}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={onEnd}>돌아가기</button>
        </div>
      </div>
    );
  }

  // Playing phase
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  const aliveTeam = teamMembers.filter(t => t.hp > 0);

  return (
    <div className="page pvp-battle pvp-team-battle">
      {/* Team HP Section */}
      <div className="pvp-team-hp-section">
        {/* My Team */}
        <div className="pvp-team-column">
          <div className={`pvp-team-label ${myTeam === 'blue' ? 'team-label-blue' : 'team-label-red'}`}>
            {myTeam === 'blue' ? '🔵 블루팀' : '🔴 레드팀'}
          </div>
          {teamMembers.map(m => {
            const mInfo = CHARACTER_INFO[m.characterType];
            const isMe = m.id === myIdRef.current;
            return (
              <div key={m.id} className={`pvp-team-member ${isMe ? 'pvp-team-me' : ''} ${m.hp <= 0 ? 'pvp-team-dead' : ''} ${isMe && attackAnim === 'hit' ? 'pvp-shake' : ''}`}>
                <div className="pvp-team-member-info">
                  <span className="pvp-team-emoji">
                    {mInfo?.image ? <img src={mInfo.image} className="pvp-avatar-img" alt="" /> : mInfo?.emoji}
                  </span>
                  <span className="pvp-team-name">{m.characterName}{isMe ? ' (나)' : ''}</span>
                </div>
                <div className="pvp-hp-bar-container pvp-hp-bar-sm">
                  <div className="pvp-hp-bar" style={{ width: `${m.maxHp > 0 ? (m.hp / m.maxHp) * 100 : 0}%` }}></div>
                  <span className="pvp-hp-text-sm">{m.hp}/{m.maxHp}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pvp-vs">VS</div>

        {/* Enemy Team */}
        <div className="pvp-team-column">
          <div className={`pvp-team-label ${myTeam === 'blue' ? 'team-label-red' : 'team-label-blue'}`}>
            {myTeam === 'blue' ? '🔴 레드팀' : '🔵 블루팀'}
          </div>
          {enemies.map(e => {
            const eInfo = CHARACTER_INFO[e.characterType];
            return (
              <div key={e.id} className={`pvp-team-member ${e.hp <= 0 ? 'pvp-team-dead' : ''} ${attackAnim === 'attack' && e.hp > 0 ? '' : ''}`}>
                <div className="pvp-team-member-info">
                  <span className="pvp-team-emoji">
                    {eInfo?.image ? <img src={eInfo.image} className="pvp-avatar-img" alt="" /> : eInfo?.emoji || '?'}
                  </span>
                  <span className="pvp-team-name">{e.characterName}</span>
                </div>
                <div className="pvp-hp-bar-container pvp-hp-bar-sm">
                  <div className="pvp-hp-bar pvp-hp-bar-enemy" style={{ width: `${e.maxHp > 0 ? (e.hp / e.maxHp) * 100 : 0}%` }}></div>
                  <span className="pvp-hp-text-sm">{e.hp}/{e.maxHp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attack Animation Overlay */}
      {attackAnim === 'attack' && (
        <div className="pvp-attack-overlay">
          <div className="pvp-sword-slash">⚔️</div>
        </div>
      )}
      {attackAnim === 'miss' && (
        <div className="pvp-attack-overlay">
          <div className="pvp-miss-text">MISS!</div>
        </div>
      )}

      {/* Dead Banner */}
      {isDead && (
        <div className="pvp-dead-banner">
          💀 전사했습니다! 팀원의 활약을 응원하세요!
        </div>
      )}

      {/* Question Area */}
      <div className="pvp-question-area">
        <div className="pvp-question-header">
          <span className="pvp-question-number">문제 #{questionNum}</span>
          <span className={`pvp-timer ${timer <= 3 ? 'pvp-timer-urgent' : ''}`}>{timer}초</span>
        </div>

        {currentQuestion && !isDead && (
          <div className="pvp-verse-display">
            <div className="pvp-verse-ref">{currentQuestion.verse.book} {currentQuestion.verse.chapter}:{currentQuestion.verse.verse_number}</div>
            <div className="pvp-verse-content">
              {currentQuestion.words.map((word, i) => {
                if (currentQuestion.blankIndices.includes(i)) {
                  if (showTimeoutAnswer) {
                    return <span key={i} className="pvp-timeout-answer">{word} </span>;
                  }
                  return <span key={i} className="pvp-blank-word">{'_'.repeat(Math.max(4, word.length * 2))} </span>;
                }
                return <span key={i}>{word} </span>;
              })}
            </div>
            <div className={`pvp-answer-box ${wrongAnim ? 'pvp-wrong-shake' : ''}`}>
              <input
                ref={inputRef}
                className={`pvp-answer-input ${answered ? 'pvp-answer-correct' : ''}`}
                type="text"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                {...inputHandlers}
                placeholder="빈칸에 들어갈 단어를 입력하세요"
                disabled={answered}
              />
              <button className="btn btn-primary pvp-submit-btn" onClick={handleSubmitAnswer} disabled={answered || !answerInput.trim()}>
                공격!
              </button>
            </div>
          </div>
        )}

        <div className="pvp-button-group">
          <button className="btn btn-secondary" onClick={handleSkip} disabled={isDead || answered || skipCount >= maxSkips}>
            패스 ({maxSkips - skipCount}회 남음)
          </button>
          <button className="btn btn-back" onClick={handleEndGame} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            게임 종료
          </button>
        </div>
      </div>

      {/* Attack Log */}
      <div className="pvp-log-section">
        {attackLog.slice(-3).map((log, i) => (
          <div key={i} className="pvp-log-entry">{log}</div>
        ))}
      </div>
    </div>
  );
}
