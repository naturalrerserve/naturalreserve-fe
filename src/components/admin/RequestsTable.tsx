'use client';
import { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/admin.module.css';
import { nrGetAccessRequests, nrApproveAccessRequest, nrRejectAccessRequest } from '@/lib/firebase-data';
import { genRandomCode } from '@/lib/fr-database';
import type { AccessRequest } from '@/types';

interface Props {
  currentAdmin: string;
  onPendingCount: (n: number) => void;
  showMsg: (type: 'success' | 'error', msg: string) => void;
}

function fmtDate(iso: string): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: styles.badgePending,
    approved: styles.badgeActive,
    rejected: styles.badgeRejected,
  };
  const label: Record<string, string> = {
    pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
  };
  return (
    <span className={`${styles.badgeStatus} ${map[status] || ''}`}>
      {label[status] || status}
    </span>
  );
}

export default function RequestsTable({ currentAdmin, onPendingCount, showMsg }: Props) {
  const [rows, setRows]             = useState<AccessRequest[]>([]);
  const [loading, setLoading]       = useState(true);

  /* Approve modal state */
  const [approveData, setApproveData]   = useState<{ id: string; name: string; email: string; username: string; code: string } | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  /* Reject modal state */
  const [rejectData, setRejectData] = useState<{ id: string; name: string } | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await nrGetAccessRequests();
      setRows(requests);
      onPendingCount(requests.filter((r) => r.status === 'pending').length);
    } catch {
      showMsg('error', 'Gagal memuat data permintaan.');
    } finally {
      setLoading(false);
    }
  }, [onPendingCount, showMsg]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const openApprove = (r: AccessRequest) => {
    setApproveData({ id: r.id, name: r.name, email: r.email, username: r.username, code: genRandomCode() });
  };

  const confirmApprove = async () => {
    if (!approveData) return;
    const { id, email } = approveData;
    setApproveLoading(true);
    try {
      // In NestJS backend, we just call the approve request endpoint which handles everything
      // including registering the user, generating the code, saving it, and emailing the user.
      const res = await nrApproveAccessRequest(id);
      
      showMsg('success', `✓ Permintaan disetujui. Kode akses ${res.code || approveData.code} telah dikirim ke ${email}`);

      setApproveData(null);
      await loadRequests();
    } catch (err: any) {
      showMsg('error', '✗ Error: ' + (err.message || 'Gagal memproses.'));
    } finally {
      setApproveLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectData) return;
    try {
      await nrRejectAccessRequest(rejectData.id);
      showMsg('success', 'Permintaan berhasil ditolak.');
      setRejectData(null);
      await loadRequests();
    } catch {
      showMsg('error', 'Gagal menolak permintaan.');
    }
  };

  const pending  = rows.filter((r) => r.status === 'pending').length;
  const approved = rows.filter((r) => r.status === 'approved').length;
  const rejected = rows.filter((r) => r.status === 'rejected').length;

  return (
    <>
      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Menunggu</div>
          <div className={`${styles.statVal} ${styles.amber}`}>{pending}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Disetujui</div>
          <div className={`${styles.statVal} ${styles.teal}`}>{approved}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ditolak</div>
          <div className={`${styles.statVal} ${styles.coral}`}>{rejected}</div>
        </div>
      </div>

      {/* Table Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelTitle}>Daftar Permintaan</div>
          <button className={`${styles.btn} ${styles.btnCopy}`} onClick={loadRequests}>↻ Refresh</button>
        </div>

        {loading ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p className={styles.emptyText}>Memuat...</p></div>
        ) : rows.length === 0 ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><p className={styles.emptyText}>Belum ada permintaan akses.</p></div>
        ) : (
          <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th><th>Username</th><th>Email</th>
                <th>Keperluan</th><th>Tanggal</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td><span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--teal3)' }}>{r.username}</span></td>
                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{r.email}</td>
                  <td style={{ fontSize: 12, color: 'var(--mist)', maxWidth: 180 }}>{r.reason || '–'}</td>
                  <td style={{ fontSize: 11, color: 'var(--mist)', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.status === 'pending' ? (
                      <>
                        <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => openApprove(r)}>✓ Setujui</button>
                        <button className={`${styles.btn} ${styles.btnReject}`} style={{ marginLeft: 6 }} onClick={() => setRejectData({ id: r.id, name: r.name })}>✕ Tolak</button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(148,163,184,.4)' }}>–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── APPROVE MODAL ── */}
      {approveData && (
        <div className={`${styles.modalOverlay} ${styles.open}`} onClick={(e) => { if (e.target === e.currentTarget) setApproveData(null); }}>
          <div className={styles.modalCard}>
            <div className={styles.modalTitle}>✅ Setujui &amp; Kirim Kode</div>
            <div style={{ fontSize: 13, color: 'var(--mist)', marginBottom: 16, lineHeight: 1.7 }}>
              Kode akses unik akan di-generate secara otomatis dan dikirim ke email pengguna:
              <strong style={{ color: '#e0f7f4', display: 'block', marginTop: 6 }}>
                {approveData.name} &lt;{approveData.email}&gt;
              </strong>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => setApproveData(null)}>Batal</button>
              <button
                id="approveConfirmBtn"
                className={`${styles.btn} ${styles.btnApprove}`}
                onClick={confirmApprove}
                disabled={approveLoading}
              >
                {approveLoading ? 'Memproses...' : '✓ Setujui & Kirim Kode'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectData && (
        <div className={`${styles.modalOverlay} ${styles.open}`} onClick={(e) => { if (e.target === e.currentTarget) setRejectData(null); }}>
          <div className={styles.modalCard}>
            <div className={styles.modalTitle}>❌ Tolak Permintaan</div>
            <div style={{ fontSize: 13, color: 'var(--mist)', marginBottom: 20, lineHeight: 1.7 }}>
              Permintaan dari <strong style={{ color: '#e0f7f4' }}>{rejectData.name}</strong> akan ditolak.
              Pengguna tidak akan mendapat kode akses.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className={`${styles.btn} ${styles.btnCopy}`} onClick={() => setRejectData(null)}>Batal</button>
              <button className={`${styles.btn} ${styles.btnReject}`} onClick={confirmReject}>Tolak</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
