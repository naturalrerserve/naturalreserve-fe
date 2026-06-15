'use client';
import { useEffect, useRef } from 'react';
import styles from '@/styles/login.module.css';

export default function Bubbles() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const cfg = [
      { s: 8,  l: 12, d: 1.2, x: 10 },
      { s: 14, l: 18, d: 0.8, x: 25 },
      { s: 6,  l: 14, d: 1.6, x: 40 },
      { s: 10, l: 22, d: 1.0, x: 55 },
      { s: 18, l: 16, d: 0.6, x: 70 },
      { s: 7,  l: 20, d: 1.4, x: 82 },
      { s: 12, l: 10, d: 1.1, x: 92 },
    ];
    cfg.forEach(({ s, l, d, x }) => {
      const b = document.createElement('div');
      b.className = styles.bubble;
      b.style.cssText = `width:${s}px;height:${s}px;left:${x}%;animation-duration:${l}s;animation-delay:-${d * l}s`;
      wrap.appendChild(b);
    });
    return () => { wrap.innerHTML = ''; };
  }, []);

  return <div className={styles.bubbles} ref={wrapRef} />;
}
