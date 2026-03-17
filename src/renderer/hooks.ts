import { useEffect, useRef, RefObject } from 'react';

/**
 * Electron + React 환경에서 input 포커스를 안정적으로 처리하는 훅.
 * - 마운트 시 Electron 윈도우 포커스 강제 복구 후 input 포커스
 * - 윈도우 포커스 복귀 시 재포커스
 * - 클릭 시 포커스 안 잡히면 윈도우 포커스 복구 후 재시도
 *
 * @param deps - 포커스를 다시 잡아야 하는 의존성 (예: round, phase)
 * @returns [ref, handlers] - input에 연결할 ref와 onMouseDown 핸들러
 */
export function useInputFocus<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  deps: any[] = []
): [RefObject<T | null>, { onMouseDown: (e: React.MouseEvent<T>) => void }] {
  const ref = useRef<T | null>(null);

  const focusInput = () => {
    if (ref.current) {
      ref.current.focus();
      // focus가 실제로 안 잡혔으면 윈도우 포커스 복구 후 재시도
      if (document.activeElement !== ref.current) {
        window.api?.focusWindow?.().then(() => {
          setTimeout(() => ref.current?.focus(), 50);
        });
      }
    }
  };

  useEffect(() => {
    // 마운트 시 input 포커스 시도, 실패 시에만 윈도우 포커스 복구
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        if (document.activeElement !== ref.current) {
          window.api?.focusWindow?.().then(() => {
            setTimeout(() => ref.current?.focus(), 50);
          });
        }
      }
    }, 50);

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
    onMouseDown: (e: React.MouseEvent<T>) => {
      e.preventDefault();
      focusInput();
    },
  };

  return [ref, handlers];
}
