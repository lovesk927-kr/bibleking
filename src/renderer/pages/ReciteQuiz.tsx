import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Character, Verse, ReciteResult as ReciteResultType } from '../types';
import { useApi } from '../api-context';

interface Props {
  character: Character;
  villageId?: number;
  onComplete: (result: ReciteResultType) => void;
  onBack: () => void;
}

export function ReciteQuiz({ character, villageId = 1, onComplete, onBack }: Props) {
  const { api } = useApi();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  // 소모품 상태
  const [consumables, setConsumables] = useState<Record<string, number>>({});
  const [hintActive, setHintActive] = useState(false);
  const [hintTimer, setHintTimer] = useState(0);
  const hintIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ref로 관리하여 클로저 문제 방지
  const blankRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const correctBlanksRef = useRef<Record<number, string[]>>({});
  const blankOrderRef = useRef<{ verseNumber: number; blankIndex: number }[]>([]);
  const autoMoveTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isBlankMode = character.recite_mode === 1;

  // 원문과 빈칸 템플릿을 비교하여 각 빈칸의 정답 추출
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
    // 컴포넌트 마운트 시 ref 초기화
    blankRefs.current = {};
    correctBlanksRef.current = {};
    blankOrderRef.current = [];
    Object.values(autoMoveTimerRef.current).forEach(t => clearTimeout(t));
    autoMoveTimerRef.current = {};

    loadQuiz();
    loadConsumables();

    return () => {
      Object.values(autoMoveTimerRef.current).forEach(t => clearTimeout(t));
      autoMoveTimerRef.current = {};
      blankRefs.current = {};
      if (hintIntervalRef.current) clearInterval(hintIntervalRef.current);
    };
  }, []);

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

  const loadConsumables = async () => {
    const data = await api.getConsumables(character.id);
    const map: Record<string, number> = {};
    data.forEach((c: { type: string; quantity: number }) => { map[c.type] = c.quantity; });
    setConsumables(map);
  };

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
  };

  const handleBlankChange = (verseNumber: number, blankIndex: number, value: string) => {
    setBlankAnswers((prev) => {
      const updated = { ...prev };
      const arr = [...(updated[verseNumber] || [])];
      arr[blankIndex] = value;
      updated[verseNumber] = arr;
      return updated;
    });
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

  const assembleBlankAnswer = (template: string, blanks: string[]): string => {
    let idx = 0;
    return template.replace(/x/g, () => blanks[idx++] || '');
  };

  const getRequiredVerseCount = (): number => {
    // 마을 1(에덴): 0절, 마을 2: 1절, 마을 3: 2절, ...
    return Math.max(0, villageId - 1);
  };

  // 암송 100점권 사용
  const usePerfectScore = async () => {
    const result = await api.useConsumable({ characterId: character.id, type: 'perfect_score' });
    if (!result.success) { alert(result.message || '사용 실패'); return; }

    // 모든 답을 정답으로 채워서 제출
    const answerList = verses.map((v) => ({
      verse_number: v.verse_number,
      answer: v.content,
    }));
    const submitResult = await api.submitRecite({
      characterId: character.id,
      answers: answerList,
    });
    onComplete({ ...submitResult, usedPerfectScore: true });
  };

  // 힌트권 사용
  const useHint = async () => {
    const result = await api.useConsumable({ characterId: character.id, type: 'hint' });
    if (!result.success) { alert(result.message || '사용 실패'); return; }

    setHintActive(true);
    setHintTimer(20);
    setConsumables(prev => ({ ...prev, hint: Math.max(0, (prev.hint || 0) - 1) }));

    hintIntervalRef.current = setInterval(() => {
      setHintTimer(prev => {
        if (prev <= 1) {
          if (hintIntervalRef.current) clearInterval(hintIntervalRef.current);
          setHintActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (hintActive) return; // 힌트 활성화 중엔 제출 불가

    // 마을별 최소 입력 절 수 체크
    const required = getRequiredVerseCount();
    if (required > 0) {
      let filledCount = 0;
      verses.forEach((v) => {
        if (isBlankMode && v.blank_template && blankAnswers[v.verse_number]) {
          const hasInput = blankAnswers[v.verse_number].some((b) => b.trim() !== '');
          if (hasInput) filledCount++;
        } else {
          if ((answers[v.verse_number] || '').trim() !== '') filledCount++;
        }
      });
      if (filledCount < required) {
        alert(`이 마을에서는 최소 ${required}절 이상 입력해야 전투할 수 있습니다. (현재 ${filledCount}절 입력)`);
        return;
      }
    }

    const answerList = verses.map((v) => {
      let answer = answers[v.verse_number] || '';
      if (isBlankMode && v.blank_template && blankAnswers[v.verse_number]) {
        answer = assembleBlankAnswer(v.blank_template, blankAnswers[v.verse_number]);
      }
      return { verse_number: v.verse_number, answer };
    });

    const result = await api.submitRecite({
      characterId: character.id,
      answers: answerList,
    });

    onComplete(result);
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
        elements.push(
          <input
            key={`b-${blankIdx}`}
            ref={(el) => setBlankRef(v.verse_number, blankIdx, el)}
            type="text"
            className="blank-input"
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
    });

    return elements;
  };

  if (loading) return <div className="page"><p>로딩 중...</p></div>;

  const hasPerfectScore = (consumables.perfect_score || 0) > 0;
  const hasHint = (consumables.hint || 0) > 0;

  return (
    <div className="page recite-quiz recite-quiz-layout">
      <div className="recite-quiz-scroll">
        <h1 className="title">📖 암송 도전</h1>
        <p className="subtitle">말씀을 암송해보세요!</p>

        {/* 소모품 버튼 */}
        <div className="consumable-bar">
          <button
            className={`btn btn-consumable btn-perfect-score ${!hasPerfectScore ? 'disabled' : ''}`}
            onClick={usePerfectScore}
            disabled={!hasPerfectScore || hintActive}
          >
            📜 100점권 ({consumables.perfect_score || 0})
          </button>
          <button
            className={`btn btn-consumable btn-hint ${!hasHint || hintActive ? 'disabled' : ''}`}
            onClick={useHint}
            disabled={!hasHint || hintActive}
          >
            💡 힌트권 ({consumables.hint || 0})
          </button>
        </div>

        {hintActive && (
          <div className="hint-banner">
            💡 힌트 활성화 중! ({hintTimer}초 남음) — 제출 버튼 비활성화
          </div>
        )}

        <div className="quiz-list">
          {verses.map((v) => (
            <div key={v.verse_number} className="quiz-item">
              <label className="verse-label">{v.book} {v.chapter}:{v.verse_number}</label>
              {hintActive && (
                <div className="hint-answer">💡 {v.content}</div>
              )}
              {isBlankMode && v.blank_template ? (
                <div className="blank-fill-container">
                  {renderBlankTemplate(v)}
                </div>
              ) : (
                <textarea
                  className="verse-input"
                  value={answers[v.verse_number] || ''}
                  onChange={(e) => handleChange(v.verse_number, e.target.value)}
                  placeholder="이 절의 내용을 암송하세요..."
                  rows={2}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="recite-quiz-fixed-buttons">
        <button
          className={`btn btn-primary ${hintActive ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={hintActive}
        >
          {hintActive ? `힌트 확인 중... (${hintTimer}초)` : '제출하기'}
        </button>
        <button className="btn btn-secondary" onClick={onBack}>돌아가기</button>
      </div>
    </div>
  );
}
