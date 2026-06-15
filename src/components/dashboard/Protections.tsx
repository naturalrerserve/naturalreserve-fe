'use client';
import { useEffect, useState } from 'react';
import type { AppSettings } from '@/types';

export default function Protections({ settings }: { settings: AppSettings }) {
  const [devToolsLocked, setDevToolsLocked] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (settings.prot_rightclick) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (settings.prot_copy && ctrl && ['c', 'x'].includes(key)) {
        e.preventDefault();
      }
      if (settings.prot_viewsource && ctrl && key === 'u') {
        e.preventDefault();
      }
      if (settings.prot_saveprint && ctrl && ['s', 'p'].includes(key)) {
        e.preventDefault();
      }
      if (settings.prot_devtools) {
        if (key === 'f12') e.preventDefault();
        if (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
        }
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (settings.prot_drag) {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (settings.prot_copy) e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      if (settings.prot_copy) e.preventDefault();
    };

    const handleBeforePrint = (e: Event) => {
      if (settings.prot_saveprint) {
        e.stopImmediatePropagation();
        window.location.reload();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [settings]);

  // DevTools detection
  useEffect(() => {
    if (!settings.prot_devdetect) {
      setDevToolsLocked(false);
      return;
    }
    const threshold = 160;
    const interval = setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        setDevToolsLocked(true);
      } else {
        setDevToolsLocked(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.prot_devdetect]);

  return (
    <>
      {settings.prot_select && (
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
          }
          input, textarea, [contenteditable="true"] {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
          }
        ` }} />
      )}
      
      {settings.prot_watermark && (
        <div style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 99999,
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'repeating-linear-gradient(-45deg, transparent, transparent 120px, rgba(13,148,136,0.015) 120px, rgba(13,148,136,0.015) 121px)'
        }} />
      )}

      {devToolsLocked && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#051a26', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: 24
        }}>
          <div>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h2 style={{ color: '#5eead4', fontSize: 22, marginBottom: 12 }}>Akses Ditolak</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
              Halaman ini dilindungi. Tutup Developer Tools untuk melanjutkan.
            </p>
            <button onClick={() => window.location.reload()} style={{
              marginTop: 24, padding: '10px 24px', background: '#0d9488', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, cursor: 'pointer'
            }}>
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      )}
    </>
  );
}
