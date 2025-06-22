import { useEffect, useRef, RefObject } from 'react';
import React from 'react';

interface Size {
  width: number;
  height: number;
}

/**
 * Hook para observar mudanças no tamanho de um elemento
 * Útil para componentes que precisam reagir a mudanças de tamanho
 * como quando o sidebar é aberto/fechado
 */
export function useResizeObserver<T extends HTMLElement>(): [RefObject<T>, DOMRectReadOnly | null] {
  const ref = useRef<T>(null);
  const [size, setSize] = React.useState<DOMRectReadOnly | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize(entry.contentRect);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

// Hook para tamanho da janela (SSR-safe)
export function useWindowSize() {
  const [windowSize, setWindowSize] = React.useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
} 