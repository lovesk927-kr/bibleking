import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Character, Verse } from '../types';
import { useApi } from '../api-context';

interface Props {
  character: Character;
  onBack: () => void;
}

export function TrainingMode({ character, onBack }: Props) {
  const { api } = useApi();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [graded, setGraded] = useState(false);
  const [gradeResult, setGradeResult] = useState<Record<string, boolean>>({});
  const blankRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const correctBlanksRef = useRef<Record<number, string[]>>({});
  const blankOrderRef = useRef<{ verseNumber: number; blankIndex: number }[]>([]);
  const autoMoveTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastFocusRef = useRef<string | null>(null);
  const lastCursorPos = useRef<number>(0);
  const lastVerseRef = useRef<number | null>(null);

  const isBlankMode = character.recite_mode === 1;

  const extractBlankAnswers = (original: string, template: string): string[] => {
    const answers: string[] = [];
    for (let i = 0; i < template.length; i++) {
      if (template[i] === 'x') {
        answers.push(original[i] || '');
      }
    }
    return answers;
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  // 페이지 로드 후 첫 입력칸 포커스 + 창 포커스 복귀 시 복구
  const restoringFocusRef = useRef(false);
  useEffect(() => {
    if (loading) return;
    const focusFirst = () => {
      // F5 정답보기 복구 중이면 무시 (별도 복구 로직 사용)
      if (restoringFocusRef.current) return;
      if (isBlankMode) {
        const first = blankOrderRef.current[0];
        if (first) blankRefs.current[`${first.verseNumber}-${first.blankIndex}`]?.focus();
      } else if (verses.length > 0) {
        const el = document.querySelector<HTMLTextAreaElement>('textarea.verse-input');
        el?.focus();
      }
    };
    // 윈도우 포커스 복구 후 입력칸 포커스 (IME 한글 유지)
    window.api?.focusWindow?.().then(() => {
      setTimeout(focusFirst, 50);
    });
    window.addEventListener('focus', focusFirst);
    return () => window.removeEventListener('focus', focusFirst);
  }, [loading]);

  // F5 키 누르면 답 보기, 떼면 숨기기 / F9 채점
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        // 현재 커서 위치 저장
        const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          lastCursorPos.current = active.selectionStart || 0;
        }
        setShowAnswers(true);
      }
      if (e.key === 'F9') {
        e.preventDefault();
        doGrade();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        doReset();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setShowAnswers(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [verses, answers, blankAnswers]);

  // showAnswers가 false로 바뀌면 (F5 뗐을 때) 렌더링 후 포커스 복구
  const prevShowAnswers = useRef(showAnswers);
  useEffect(() => {
    if (prevShowAnswers.current && !showAnswers) {
      // focusFirst 리스너가 개입하지 않도록 플래그 설정
      restoringFocusRef.current = true;
      const restoreFocus = () => {
        let target: HTMLInputElement | HTMLTextAreaElement | null = null;
        if (isBlankMode && lastFocusRef.current) {
          target = blankRefs.current[lastFocusRef.current] || null;
        } else if (lastVerseRef.current !== null) {
          target = document.querySelector<HTMLTextAreaElement>(`textarea[data-verse="${lastVerseRef.current}"]`);
        }
        if (target) {
          target.focus();
          const pos = lastCursorPos.current;
          target.setSelectionRange(pos, pos);
        }
        restoringFocusRef.current = false;
      };
      window.api?.focusWindow?.().then(() => {
        requestAnimationFrame(restoreFocus);
      });
    }
    prevShowAnswers.current = showAnswers;
  }, [showAnswers]);

  const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');

  // 첫 번째 틀린 위치를 찾아 하이라이트된 JSX 반환
  const renderDiff = (userText: string, correctText: string) => {
    const elements: React.ReactNode[] = [];
    let firstWrongIdx = -1;

    for (let i = 0; i < correctText.length; i++) {
      if (i < userText.length && userText[i] === correctText[i]) {
        elements.push(<span key={i} className="diff-correct">{correctText[i]}</span>);
      } else {
        firstWrongIdx = i;
        // 틀린 글자 표시
        elements.push(<span key={i} className="diff-wrong">{correctText[i]}</span>);
        // 나머지는 회색으로
        if (i + 1 < correctText.length) {
          elements.push(<span key="rest" className="diff-rest">{correctText.slice(i + 1)}</span>);
        }
        break;
      }
    }

    // 사용자가 더 많이 쓴 경우 (정답보다 긴 입력)
    if (firstWrongIdx === -1 && userText.length > correctText.length) {
      // 모두 맞지만 추가 글자가 있음 - 이 경우는 채점에서 이미 처리
    }

    // 사용자 입력이 짧아서 아직 못 쓴 경우
    if (firstWrongIdx === -1 && userText.length < correctText.length) {
      elements.push(<span key="missing" className="diff-wrong">{correctText[userText.length]}</span>);
      if (userText.length + 1 < correctText.length) {
        elements.push(<span key="rest" className="diff-rest">{correctText.slice(userText.length + 1)}</span>);
      }
    }

    return elements;
  };

  const doGrade = () => {
    const result: Record<string, boolean> = {};

    if (isBlankMode) {
      // 빈칸 모드: 각 빈칸별 채점
      for (const v of verses) {
        const correct = correctBlanksRef.current[v.verse_number] || [];
        const userBlanks = blankAnswers[v.verse_number] || [];
        for (let i = 0; i < correct.length; i++) {
          const key = `blank-${v.verse_number}-${i}`;
          result[key] = normalize(userBlanks[i] || '') === normalize(correct[i]);
        }
      }
    } else {
      // 전문 모드: 절 단위 채점
      for (const v of verses) {
        const key = `verse-${v.verse_number}`;
        const userAnswer = answers[v.verse_number] || '';
        result[key] = normalize(userAnswer) === normalize(v.content);
      }
    }

    setGradeResult(result);
    setGraded(true);
  };

  const clearGrade = () => {
    setGraded(false);
    setGradeResult({});
  };

  const doReset = () => {
    const resetAnswers: Record<number, string> = {};
    const resetBlanks: Record<number, string[]> = {};
    for (const v of verses) {
      resetAnswers[v.verse_number] = '';
      if (isBlankMode && v.blank_template) {
        const blankCount = v.blank_template.split('x').length - 1;
        resetBlanks[v.verse_number] = new Array(blankCount).fill('');
      }
    }
    setAnswers(resetAnswers);
    setBlankAnswers(resetBlanks);
    clearGrade();
    // 첫 번째 입력칸에 포커스
    setTimeout(() => {
      if (isBlankMode) {
        const first = blankOrderRef.current[0];
        if (first) blankRefs.current[`${first.verseNumber}-${first.blankIndex}`]?.focus();
      } else {
        const el = document.querySelector<HTMLTextAreaElement>('textarea.verse-input');
        el?.focus();
      }
    }, 50);
  };

  const loadQuiz = async () => {
    const data = await api.getQuiz();
    if (data.length === 0) {
      alert('관리자가 아직 암송 구절을 등록하지 않았습니다.');
      onBack();
      return;
    }
    setVerses(data);
    const initial: Record<number, string> = {};
    const initialBlanks: Record<number, string[]> = {};
    const corrects: Record<number, string[]> = {};
    const order: { verseNumber: number; blankIndex: number }[] = [];

    data.forEach((v: Verse) => {
      initial[v.verse_number] = '';
      if (isBlankMode && v.blank_template) {
        const blankCount = v.blank_template.split('x').length - 1;
        initialBlanks[v.verse_number] = new Array(blankCount).fill('');
        corrects[v.verse_number] = extractBlankAnswers(v.content, v.blank_template);
        for (let i = 0; i < blankCount; i++) {
          order.push({ verseNumber: v.verse_number, blankIndex: i });
        }
      }
    });
    setAnswers(initial);
    setBlankAnswers(initialBlanks);
    correctBlanksRef.current = corrects;
    blankOrderRef.current = order;
    setLoading(false);
  };

  const setBlankRef = useCallback((verseNumber: number, blankIndex: number, el: HTMLInputElement | null) => {
    blankRefs.current[`${verseNumber}-${blankIndex}`] = el;
  }, []);

  const focusNextBlank = (verseNumber: number, blankIndex: number) => {
    const order = blankOrderRef.current;
    const currentIdx = order.findIndex(
      (b) => b.verseNumber === verseNumber && b.blankIndex === blankIndex
    );
    if (currentIdx >= 0 && currentIdx < order.length - 1) {
      const next = order[currentIdx + 1];
      const nextEl = blankRefs.current[`${next.verseNumber}-${next.blankIndex}`];
      if (nextEl) nextEl.focus();
    }
  };

  const handleChange = (verseNumber: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [verseNumber]: value }));
    if (graded) clearGrade();
  };

  const handleBlankChange = (verseNumber: number, blankIndex: number, value: string) => {
    setBlankAnswers((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[verseNumber] || [])];
      arr[blankIndex] = value;
      updated[verseNumber] = arr;
      return updated;
    });
    if (graded) clearGrade();
  };

  const checkAndAutoMove = (verseNumber: number, blankIndex: number) => {
    const key = `${verseNumber}-${blankIndex}`;
    if (autoMoveTimerRef.current[key]) {
      clearTimeout(autoMoveTimerRef.current[key]);
    }
    const correct = correctBlanksRef.current[verseNumber]?.[blankIndex];
    if (!correct) return;
    const el = blankRefs.current[key];
    if (!el) return;
    const value = el.value;
    if (value === correct) {
      autoMoveTimerRef.current[key] = setTimeout(() => {
        const currentVal = blankRefs.current[key]?.value;
        if (currentVal === correct) {
          focusNextBlank(verseNumber, blankIndex);
        }
      }, 150);
    }
  };

  const renderBlankTemplate = (v: Verse) => {
    const template = v.blank_template;
    const parts = template.split('x');
    const blanks = blankAnswers[v.verse_number] || [];
    const correct = correctBlanksRef.current[v.verse_number] || [];
    const elements: React.ReactNode[] = [];

    parts.forEach((part, i) => {
      if (part) elements.push(<span key={`t-${i}`} className="blank-text">{part}</span>);
      if (i < parts.length - 1) {
        const blankIdx = i;
        if (showAnswers) {
          elements.push(
            <span key={`b-${blankIdx}`} className="blank-answer-reveal">
              {correct[blankIdx] || ''}
            </span>
          );
        } else {
          const gradeKey = `blank-${v.verse_number}-${blankIdx}`;
          const isGradedCorrect = graded && gradeResult[gradeKey] === true;
          const isGradedWrong = graded && gradeResult[gradeKey] === false && (blanks[blankIdx] || '').length > 0;
          const isGradedEmpty = graded && gradeResult[gradeKey] === false && !(blanks[blankIdx] || '').length;
          elements.push(
            <span key={`b-${blankIdx}`} className="blank-wrapper">
              <input
                ref={(el) => setBlankRef(v.verse_number, blankIdx, el)}
                type="text"
                lang="ko"
                className={`blank-input ${isGradedCorrect ? 'blank-correct' : ''} ${isGradedWrong || isGradedEmpty ? 'blank-wrong' : ''}`}
                value={blanks[blankIdx] || ''}
                onChange={(e) => {
                  handleBlankChange(v.verse_number, blankIdx, e.target.value);
                  checkAndAutoMove(v.verse_number, blankIdx);
                }}
                onFocus={() => { lastFocusRef.current = `${v.verse_number}-${blankIdx}`; }}
                onCompositionEnd={() => {
                  setTimeout(() => checkAndAutoMove(v.verse_number, blankIdx), 30);
                }}
                placeholder="___"
                style={{ width: `${Math.max(3, (correct[blankIdx]?.length || 2)) * 18 + 16}px` }}
              />
              {(isGradedWrong || isGradedEmpty) && (
                <span className="blank-correct-answer">
                  {renderDiff(blanks[blankIdx] || '', correct[blankIdx])}
                </span>
              )}
            </span>
          );
        }
      }
    });

    return elements;
  };

  // 채점 결과 요약
  const getGradeSummary = () => {
    const keys = Object.keys(gradeResult);
    const total = keys.length;
    const correct = keys.filter(k => gradeResult[k]).length;
    return { total, correct };
  };

  if (loading) return <div className="page"><p>로딩 중...</p></div>;

  const gradeSummary = graded ? getGradeSummary() : null;

  return (
    <div className="page recite-quiz recite-quiz-layout">
      <div className="recite-quiz-scroll">
        <h1 className="title">📝 트레이닝 모드</h1>
        <p className="subtitle">F5: 정답 보기 | F9: 채점 | F10: 초기화</p>

        {showAnswers && (
          <div className="training-answer-indicator">정답 표시 중...</div>
        )}

        {graded && gradeSummary && (
          <div className="training-grade-indicator">
            채점 결과: {gradeSummary.correct}/{gradeSummary.total} 정답
            ({gradeSummary.total > 0 ? Math.round((gradeSummary.correct / gradeSummary.total) * 100) : 0}%)
          </div>
        )}

        <div className="quiz-list">
          {verses.map((v) => {
            const verseGradeKey = `verse-${v.verse_number}`;
            const isVerseCorrect = graded && gradeResult[verseGradeKey] === true;
            const isVerseWrong = graded && gradeResult[verseGradeKey] === false && (answers[v.verse_number] || '').length > 0;

            return (
              <div key={v.verse_number} className="quiz-item">
                <label className="verse-label">{v.book} {v.chapter}:{v.verse_number}</label>
                {isBlankMode && v.blank_template ? (
                  <div className="blank-fill-container">
                    {renderBlankTemplate(v)}
                  </div>
                ) : (
                  <div>
                    {showAnswers ? (
                      <div className="training-full-answer">{v.content}</div>
                    ) : (
                      <>
                        <textarea
                          className={`verse-input ${isVerseCorrect ? 'verse-correct' : ''} ${isVerseWrong ? 'verse-wrong' : ''}`}
                          data-verse={v.verse_number}
                          lang="ko"
                          value={answers[v.verse_number] || ''}
                          onChange={(e) => handleChange(v.verse_number, e.target.value)}
                          onFocus={() => { lastVerseRef.current = v.verse_number; }}
                          placeholder="이 절의 내용을 암송하세요..."
                          rows={2}
                        />
                        {isVerseWrong && (
                          <div className="verse-correct-answer">
                            <span className="verse-correct-label">정답: </span>
                            {renderDiff(answers[v.verse_number] || '', v.content)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="recite-quiz-fixed-buttons">
        <button className="btn btn-primary" onClick={doGrade}>채점 (F9)</button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    </div>
  );
}
