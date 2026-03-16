import { useEffect, useRef, RefObject } from 'react';

/**
 * Electron + React 환경에서 input 포커스를 안정적으로 처리하는 훅.
 * - 마운트 시 딜레이 후 포커스
 * - 윈도우 포커스 복귀 시 재포커스
 * - 클릭 시 포커스 보장
 *
 * @param deps - 포커스를 다시 잡아야 하는 의존성 (예: round, phase)
 * @returns [ref, handlers] - input에 연결할 ref와 onMouseDown 핸들러
 */
export function useInputFocus<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  deps: any[] = []
): [RefObject<T | null>, { onMouseDown: (e: React.MouseEvent<T>) => void }] {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => ref.current?.focus(), 120);
    const onWindowFocus = () => {
      setTimeout(() => ref.current?.focus(), 50);
    };
    window.addEventListener('focus', onWindowFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, deps);

  const handlers = {
    onMouseDown: (e: React.MouseEvent<T>) => { e.currentTarget.focus(); },
  };

  return [ref, handlers];
}
