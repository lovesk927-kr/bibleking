import React, { useState, useEffect, useRef } from 'react';
import type { Character, Verse } from '../types';
import { useApi } from '../api-context';
import { useInputFocus } from '../hooks';

interface Props {
  character: Character;
  onBack: () => void;
}

type Phase = 'setup' | 'drill' | 'write' | 'grade' | 'finalTest' | 'finalGrade';

interface DrillQuestion {
  words: string[];
  blankIndex: number;
  answer: string;
}

const normalize = (s: string) => s.replace(/[\s,.!?;:'"'\u2018\u2019\u201C\u201D\u00B7\u3000]/g, '');

export function TrainingMode2({ character, onBack }: Props) {
  const { api } = useApi();

  // Setup
  const [verseNumbers, setVerseNumbers] = useState<number[]>([]);
  const [startVerse, setStartVerse] = useState(0);
  const [endVerse, setEndVerse] = useState(0);

  // Core state
  const [phase, setPhase] = useState<Phase>('setup');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIdx, setCurrentVerseIdx] = useState(0);

  // Drill
  const [drillQuestion, setDrillQuestion] = useState<DrillQuestion | null>(null);
  const [drillInput, setDrillInput] = useState('');
  const [drillFeedback, setDrillFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [drillCorrectAnswer, setDrillCorrectAnswer] = useState('');
  const [drillCount, setDrillCount] = useState(0);
  const prevBlankIdx = useRef(-1);

  // Write (per-verse)
  const [writeInput, setWriteInput] = useState('');

  // Grade (per-verse)
  const [gradeCorrect, setGradeCorrect] = useState(false);

  // Final test
  const [finalAnswers, setFinalAnswers] = useState<Record<number, string>>({});
  const [finalResults, setFinalResults] = useState<Record<number, boolean>>({});

  // Focus
  const [inputRef, inputHandlers] = useInputFocus([phase, currentVerseIdx]);
  const writeRef = useRef<HTMLTextAreaElement | null>(null);

  const currentVerse = verses[currentVerseIdx];

  // Ctrl+Enter = "다음" 단축키 (모든 phase에서)
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const gradeCorrectRef = useRef(gradeCorrect);
  gradeCorrectRef.current = gradeCorrect;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const p = phaseRef.current;
        if (p === 'drill') {
          handleGoToWrite();
        } else if (p === 'write') {
          handleWriteSubmit();
        } else if (p === 'grade') {
          handleNextVerse();
        } else if (p === 'finalTest') {
          handleFinalGrade();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [verses, currentVerseIdx, writeInput, finalAnswers]);

  // Load verse numbers on mount
  useEffect(() => {
    api.getVerseNumbers().then((nums: number[]) => {
      if (nums.length === 0) {
        alert('관리자가 아직 암송 구절을 등록하지 않았습니다.');
        onBack();
        return;
      }
      setVerseNumbers(nums);
      setStartVerse(nums[0]);
      setEndVerse(nums[Math.min(nums.length - 1, 9)]);
    });
  }, []);

  // Focus textarea in write/finalTest phase
  useEffect(() => {
    if (phase === 'finalTest') {
      setTimeout(() => {
        const el = document.querySelector<HTMLTextAreaElement>('.training2-page textarea.verse-input');
        if (el) {
          el.focus();
        }
      }, 100);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'write') {
      setTimeout(() => {
        if (writeRef.current) {
          writeRef.current.focus();
          if (document.activeElement !== writeRef.current) {
            window.api?.focusWindow?.().then(() => {
              setTimeout(() => writeRef.current?.focus(), 50);
            });
          }
        }
      }, 50);
    }
  }, [phase, currentVerseIdx]);

  const generateDrillQuestion = (verse: Verse, prevIdx: number): DrillQuestion => {
    const words = verse.content.replace(/\s+/g, ' ').split(' ');
    let blankIndex: number;
    if (words.length <= 1) {
      blankIndex = 0;
    } else {
      do {
        blankIndex = Math.floor(Math.random() * words.length);
      } while (blankIndex === prevIdx && words.length > 1);
    }
    return {
      words,
      blankIndex,
      answer: words[blankIndex],
    };
  };

  const handleStartTraining = async () => {
    if (startVerse > endVerse) {
      alert('시작 절이 끝 절보다 클 수 없습니다.');
      return;
    }
    const data = await api.getQuizRange({ startVerse, endVerse });
    if (!data || data.length === 0) {
      alert('해당 범위에 구절이 없습니다.');
      return;
    }
    setVerses(data);
    setCurrentVerseIdx(0);
    prevBlankIdx.current = -1;
    startDrill(data[0]);
  };

  const startDrill = (verse: Verse) => {
    prevBlankIdx.current = -1;
    setDrillCount(0);
    const q = generateDrillQuestion(verse, -1);
    prevBlankIdx.current = q.blankIndex;
    setDrillQuestion(q);
    setDrillInput('');
    setDrillFeedback(null);
    setDrillCorrectAnswer('');
    setPhase('drill');
  };

  const handleDrillSubmit = () => {
    if (!drillQuestion || drillFeedback) return;

    const isCorrect = normalize(drillInput) === normalize(drillQuestion.answer);

    if (isCorrect) {
      setDrillFeedback('correct');
      setTimeout(() => {
        nextDrillQuestion();
      }, 400);
    } else {
      setDrillFeedback('wrong');
      setDrillCorrectAnswer(drillQuestion.answer);
      setTimeout(() => {
        nextDrillQuestion();
      }, 1200);
    }
  };

  const nextDrillQuestion = () => {
    if (!currentVerse) return;
    const q = generateDrillQuestion(currentVerse, prevBlankIdx.current);
    prevBlankIdx.current = q.blankIndex;
    setDrillQuestion(q);
    setDrillInput('');
    setDrillFeedback(null);
    setDrillCorrectAnswer('');
    setDrillCount(c => c + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleDrillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      if (!drillFeedback) {
        handleDrillSubmit();
      }
    }
  };

  const handleGoToWrite = () => {
    setWriteInput('');
    setPhase('write');
  };

  const handleWriteSubmit = () => {
    if (!currentVerse) return;
    const isCorrect = normalize(writeInput) === normalize(currentVerse.content);
    setGradeCorrect(isCorrect);
    setPhase('grade');
  };


  const handleRetryVerse = () => {
    startDrill(currentVerse);
  };

  const handleNextVerse = () => {
    const nextIdx = currentVerseIdx + 1;
    if (nextIdx >= verses.length) {
      setPhase('finalTest');
      const initial: Record<number, string> = {};
      verses.forEach(v => { initial[v.verse_number] = ''; });
      setFinalAnswers(initial);
      setFinalResults({});
      return;
    }
    setCurrentVerseIdx(nextIdx);
    startDrill(verses[nextIdx]);
  };

  const handleFinalGrade = () => {
    const results: Record<number, boolean> = {};
    for (const v of verses) {
      results[v.verse_number] = normalize(finalAnswers[v.verse_number] || '') === normalize(v.content);
    }
    setFinalResults(results);
    setPhase('finalGrade');
  };

  const handleRestart = () => {
    setCurrentVerseIdx(0);
    prevBlankIdx.current = -1;
    startDrill(verses[0]);
  };

  const renderDiff = (userText: string, correctText: string) => {
    const elements: React.ReactNode[] = [];
    for (let i = 0; i < correctText.length; i++) {
      if (i < userText.length && userText[i] === correctText[i]) {
        elements.push(<span key={i} className="diff-correct">{correctText[i]}</span>);
      } else {
        elements.push(<span key={i} className="diff-wrong">{correctText[i]}</span>);
        if (i + 1 < correctText.length) {
          elements.push(<span key="rest" className="diff-rest">{correctText.slice(i + 1)}</span>);
        }
        break;
      }
    }
    if (userText.length < correctText.length && elements.length === userText.length) {
      elements.push(<span key="missing" className="diff-wrong">{correctText[userText.length]}</span>);
      if (userText.length + 1 < correctText.length) {
        elements.push(<span key="rest2" className="diff-rest">{correctText.slice(userText.length + 1)}</span>);
      }
    }
    return elements;
  };

  const progressPercent = verses.length > 0 ? ((currentVerseIdx) / verses.length) * 100 : 0;
  const progressText = verses.length > 0 ? `${currentVerseIdx + 1} / ${verses.length}` : '';

  // Compute grade score (used in grade phase)
  const gradeScorePercent = (phase === 'grade' && currentVerse) ? (
    gradeCorrect ? 100 : Math.round(
      (normalize(writeInput).split('').filter((c, i) => c === normalize(currentVerse.content)[i]).length /
        Math.max(1, normalize(currentVerse.content).length)) * 100
    )
  ) : 0;

  const isLastVerse = currentVerseIdx >= verses.length - 1;

  // Final grade stats
  const finalTotal = verses.length;
  const finalCorrectCount = Object.values(finalResults).filter(Boolean).length;
  const finalScorePercent = finalTotal > 0 ? Math.round((finalCorrectCount / finalTotal) * 100) : 0;

  const isFinalPhase = phase === 'finalTest' || phase === 'finalGrade';

  // Header with progress bar (shared across drill/write/grade)
  const renderProgressHeader = (title: string) => (
    <>
      <div className="training2-header">
        <h2>{title}</h2>
        <span className="training2-progress-text">{progressText}</span>
      </div>
      <div className="training2-progress-bar">
        <div className="training2-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      {currentVerse && (
        <div className="training2-verse-ref">
          {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse_number}
        </div>
      )}
    </>
  );

  // phase + currentVerseIdx를 key로 사용해 전환 시 페이드인 재실행
  const phaseKey = `${phase}-${currentVerseIdx}`;

  return (
    <div className={`page training2-page ${isFinalPhase ? 'training2-final' : ''}`}>
      <div className="training2-phase-content" key={phaseKey}>

      {/* ===== SETUP ===== */}
      {phase === 'setup' && (
        <>
          <h1 className="title">📖 트레이닝</h1>
          <p className="subtitle">블랭크 드릴 + 전문 쓰기 단계별 훈련</p>

          <div className="training2-setup">
            <div className="training2-range-select">
              <label>
                시작 절:
                <select value={startVerse} onChange={e => setStartVerse(Number(e.target.value))}>
                  {verseNumbers.map(n => <option key={n} value={n}>{n}절</option>)}
                </select>
              </label>
              <span className="training2-range-separator">~</span>
              <label>
                끝 절:
                <select value={endVerse} onChange={e => setEndVerse(Number(e.target.value))}>
                  {verseNumbers.map(n => <option key={n} value={n}>{n}절</option>)}
                </select>
              </label>
            </div>

            <div className="training2-setup-buttons">
              <button className="btn btn-primary" onClick={handleStartTraining}>훈련 시작</button>
              <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
            </div>
          </div>
        </>
      )}

      {/* ===== DRILL ===== */}
      {phase === 'drill' && drillQuestion && currentVerse && (
        <>
          {renderProgressHeader('📖 블랭크 드릴')}

          <div className="training2-drill-area">
            <div className="boss-verse-content">
              {drillQuestion.words.map((word, i) => {
                if (i === drillQuestion.blankIndex) {
                  return <span key={i} className="boss-blank-word">{'_'.repeat(Math.max(4, word.length * 2))} </span>;
                }
                return <span key={i}>{word} </span>;
              })}
            </div>

            <div className={`boss-answer-box ${drillFeedback === 'wrong' ? 'boss-wrong-shake' : ''}`}>
              <input
                ref={inputRef}
                className={`boss-answer-input ${drillFeedback === 'correct' ? 'boss-answer-correct' : ''} ${drillFeedback === 'wrong' ? 'training2-answer-wrong' : ''}`}
                type="text"
                value={drillInput}
                onChange={e => setDrillInput(e.target.value)}
                onKeyDown={handleDrillKeyDown}
                {...inputHandlers}
                placeholder="빈칸에 들어갈 단어를 입력하세요"
                disabled={!!drillFeedback}
              />
              <button className="btn btn-primary boss-submit-btn" onClick={handleDrillSubmit} disabled={!!drillFeedback || !drillInput.trim()}>
                확인
              </button>
            </div>

            {drillFeedback === 'wrong' && (
              <div className="training2-correct-reveal">
                정답: <strong>{drillCorrectAnswer}</strong>
              </div>
            )}
            {drillFeedback === 'correct' && (
              <div className="training2-correct-feedback">정답!</div>
            )}
          </div>

          <div className="training2-drill-footer">
            <button className="btn btn-primary" onClick={handleGoToWrite}>
              다음 (전문 쓰기)
            </button>
            <button className="btn btn-secondary" onClick={onBack}>나가기</button>
          </div>
        </>
      )}

      {/* ===== WRITE ===== */}
      {phase === 'write' && currentVerse && (
        <>
          {renderProgressHeader('✍️ 전문 쓰기')}

          <div className="training2-write-area">
            <textarea
              ref={writeRef}
              className="training2-write-input"
              lang="ko"
              value={writeInput}
              onChange={e => setWriteInput(e.target.value)}
              placeholder="이 절의 내용을 작성하세요... (Ctrl+Enter로 채점)"
              rows={4}
            />
          </div>

          <div className="training2-write-footer">
            <button className="btn btn-primary" onClick={handleWriteSubmit} disabled={!writeInput.trim()}>
              채점하기
            </button>
            <button className="btn btn-secondary" onClick={onBack}>나가기</button>
          </div>
        </>
      )}

      {/* ===== GRADE ===== */}
      {phase === 'grade' && currentVerse && (
        <>
          {renderProgressHeader('📊 채점 결과')}

          <div className="training2-grade-area">
            <div className={`training2-score ${gradeCorrect ? 'training2-score-perfect' : 'training2-score-partial'}`}>
              {gradeCorrect ? '100점! 완벽합니다!' : `${gradeScorePercent}점`}
            </div>

            {!gradeCorrect && (
              <div className="training2-comparison">
                <div className="training2-compare-section">
                  <div className="training2-compare-label">내 답:</div>
                  <div className="training2-compare-text training2-user-answer">{writeInput}</div>
                </div>
                <div className="training2-compare-section">
                  <div className="training2-compare-label">정답:</div>
                  <div className="training2-compare-text training2-correct-text">
                    {renderDiff(writeInput, currentVerse.content)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="training2-grade-footer">
            {!gradeCorrect && (
              <button className="btn btn-secondary" onClick={handleRetryVerse}>
                절 다시하기
              </button>
            )}
            <button className="btn btn-primary" onClick={handleNextVerse}>
              {isLastVerse ? '최종 테스트로' : '다음 절'}
            </button>
          </div>
        </>
      )}

      {/* ===== FINAL TEST ===== */}
      {phase === 'finalTest' && (
        <>
          <div className="training2-final-scroll">
            <h1 className="title">📝 최종 테스트</h1>
            <p className="subtitle">{verses[0]?.verse_number}절 ~ {verses[verses.length - 1]?.verse_number}절 전문 쓰기</p>

            <div className="quiz-list">
              {verses.map(v => (
                <div key={v.verse_number} className="quiz-item">
                  <label className="verse-label">{v.book} {v.chapter}:{v.verse_number}</label>
                  <textarea
                    className="verse-input"
                    lang="ko"
                    value={finalAnswers[v.verse_number] || ''}
                    onChange={e => setFinalAnswers(prev => ({ ...prev, [v.verse_number]: e.target.value }))}
                    placeholder="이 절의 내용을 암송하세요..."
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="recite-quiz-fixed-buttons">
            <button className="btn btn-primary" onClick={handleFinalGrade}>채점하기</button>
            <button className="btn btn-secondary" onClick={onBack}>나가기</button>
          </div>
        </>
      )}

      {/* ===== FINAL GRADE ===== */}
      {phase === 'finalGrade' && (
        <>
          <div className="training2-final-scroll">
            <h1 className="title">📊 최종 테스트 결과</h1>

            <div className={`training2-final-score ${finalScorePercent === 100 ? 'training2-score-perfect' : 'training2-score-partial'}`}>
              {finalCorrectCount} / {finalTotal} ({finalScorePercent}%)
            </div>

            <div className="quiz-list">
              {verses.map(v => {
                const isCorrect = finalResults[v.verse_number];
                return (
                  <div key={v.verse_number} className={`quiz-item ${isCorrect ? 'training2-item-correct' : 'training2-item-wrong'}`}>
                    <label className="verse-label">
                      {isCorrect ? '✅' : '❌'} {v.book} {v.chapter}:{v.verse_number}
                    </label>
                    {!isCorrect && (
                      <div className="training2-comparison">
                        <div className="training2-compare-section">
                          <div className="training2-compare-label">내 답:</div>
                          <div className="training2-compare-text training2-user-answer">
                            {finalAnswers[v.verse_number] || '(미입력)'}
                          </div>
                        </div>
                        <div className="training2-compare-section">
                          <div className="training2-compare-label">정답:</div>
                          <div className="training2-compare-text training2-correct-text">
                            {renderDiff(finalAnswers[v.verse_number] || '', v.content)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="recite-quiz-fixed-buttons">
            <button className="btn btn-primary" onClick={handleRestart}>처음부터 다시하기</button>
            <button className="btn btn-secondary" onClick={onBack}>메뉴로 돌아가기</button>
          </div>
        </>
      )}

      </div>
    </div>
  );
}
