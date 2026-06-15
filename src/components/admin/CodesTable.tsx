'use client';
import { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/admin.module.css';
import { nrGetAccessCodes, nrRevokeAccessCode } from '@/lib/firebase-data';
import type { AccessCode } from '@/types';

interface Props {
  showMsg: (type: 'success' | 'error', msg: string) => void;
}

function fmtDate(iso: string): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function CodesTable({ showMsg }: Props) {
  const [rows, setRows]     = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const codes = await nrGetAccessCodes();
      setRows(codes);
    } catch {
      showMsg('error', 'Gagal memuat kode akses.');
    } finally {
      setLoading(false);
    }
  }, [showMsg]);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  const revokeCode = async (id: string) => {
    if (!confirm('Yakin ingin mencabut kode ini? Pengguna tidak bisa login lagi.')) return;
    try {
      await nrRevokeAccessCode(id);
      showMsg('success', 'Kode berhasil dicabut.');
      await loadCodes();
    } catch {
      showMsg('error', 'Gagal mencabut kode.');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Kode Aktif</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`${styles.btn} ${styles.btnCopy}`} onClick={loadCodes}>↻ Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p className={styles.emptyText}>Memuat...</p></div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}><div className={styles.emptyIcon}>🔑</div><p className={styles.emptyText}>Belum ada kode akses.</p></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th><th>Nama</th><th>Email</th>
                <th>Dibuat</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--teal3)' }}>{r.username}</span></td>
                  <td>{r.name || '–'}</td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{r.email || '–'}</td>
                  <td style={{ fontSize: 11, color: 'var(--mist)', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    <span className={`${styles.badgeStatus} ${r.status === 'active' ? styles.badgeActive : styles.badgeRejected}`}>
                      {r.status === 'active' ? 'Aktif' : 'Dicabut'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.status === 'active' && (
                      <button className={`${styles.btn} ${styles.btnRevoke}`} style={{ marginLeft: 6 }} onClick={() => revokeCode(r.id)}>
                        🚫 Cabut
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
