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
  useEffect(() => {
    if (loading) return;
    const focusFirst = () => {
      if (isBlankMode) {
        const first = blankOrderRef.current[0];
        if (first) blankRefs.current[`${first.verseNumber}-${first.blankIndex}`]?.focus();
      } else if (verses.length > 0) {
        const el = document.querySelector<HTMLTextAreaElement>('textarea.verse-input');
        el?.focus();
      }
    };
    setTimeout(focusFirst, 100);
    window.addEventListener('focus', focusFirst);
    return () => window.removeEventListener('focus', focusFirst);
  }, [loading]);

  // F5 키 누르면 답 보기, 떼면 숨기기 / F9 채점
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setShowAnswers(true);
      }
      if (e.key === 'F9') {
        e.preventDefault();
        doGrade();
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

  const normalize = (s: string) => s.replace(/[\s,.!?;:'"''""·\u3000]/g, '');

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
          elements.push(
            <input
              key={`b-${blankIdx}`}
              ref={(el) => setBlankRef(v.verse_number, blankIdx, el)}
              type="text"
              className={`blank-input ${isGradedCorrect ? 'blank-correct' : ''} ${isGradedWrong ? 'blank-wrong' : ''}`}
              value={blanks[blankIdx] || ''}
              onChange={(e) => {
                handleBlankChange(v.verse_number, blankIdx, e.target.value);
                checkAndAutoMove(v.verse_number, blankIdx);
              }}
              onCompositionEnd={() => {
                setTimeout(() => checkAndAutoMove(v.verse_number, blankIdx), 30);
              }}
              placeholder="___"
              style={{ width: `${Math.max(3, (correct[blankIdx]?.length || 2)) * 18 + 16}px` }}
            />
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
        <p className="subtitle">F5: 정답 보기 | F9: 채점</p>

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
                      <textarea
                        className={`verse-input ${isVerseCorrect ? 'verse-correct' : ''} ${isVerseWrong ? 'verse-wrong' : ''}`}
                        value={answers[v.verse_number] || ''}
                        onChange={(e) => handleChange(v.verse_number, e.target.value)}
                        placeholder="이 절의 내용을 암송하세요..."
                        rows={2}
                      />
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
