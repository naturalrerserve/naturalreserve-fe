'use client';
import { useState, KeyboardEvent, useEffect } from 'react';
import styles from '@/styles/admin.module.css';
import AdminSidebar from '@/components/admin/AdminSidebar';
import RequestsTable from '@/components/admin/RequestsTable';
import CodesTable from '@/components/admin/CodesTable';
import GenerateForm from '@/components/admin/GenerateForm';
import AdminManagement from '@/components/admin/AdminManagement';
import Bubbles from '@/components/login/Bubbles';
import { nrAdminLogin, nrLogout } from '@/lib/firebase-data';
import type { AdminSection } from '@/types';

export default function AdminPage() {
  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [currentAdmin,  setCurrentAdmin]  = useState('');
  const [adminUser,     setAdminUser]     = useState('');
  const [adminPass,     setAdminPass]     = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [activeSection, setActiveSection] = useState<AdminSection>('requests');
  const [pendingCount,  setPendingCount]  = useState(0);

  /* Global msg state */
  const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showMsg = (type: 'success' | 'error', msg: string) => {
    setGlobalMsg({ type, msg });
    setTimeout(() => setGlobalMsg(null), 5000);
  };

  /* Check session on load */
  useEffect(() => {
    const token = localStorage.getItem('nr_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (payload.role === 'ADMIN') {
          setCurrentAdmin(payload.username);
          setIsLoggedIn(true);
        }
      } catch {
        // invalid token, ignore
      }
    }
  }, []);

  /* ── ADMIN LOGIN ── */
  const doAdminLogin = async () => {
    setLoginError('');
    if (!adminUser.trim() || !adminPass.trim()) {
      setLoginError('Username dan password harus diisi.');
      return;
    }
    try {
      const user = await nrAdminLogin(adminUser.trim(), adminPass.trim());
      setCurrentAdmin(user.username);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || 'Username atau password salah.');
    }
  };

  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Enter') doAdminLogin(); };

  const doAdminLogout = async () => {
    await nrLogout();
    setIsLoggedIn(false);
    setCurrentAdmin('');
    setAdminUser('');
    setAdminPass('');
    setActiveSection('requests');
  };

  /* ── LOGIN SCREEN ── */
  if (!isLoggedIn) {
    return (
      <div className={styles.pageBody}>
        <Bubbles />
        <div className={styles.loginScreen}>
          <div className={styles.loginBox}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
              <div style={{
                fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800,
                background: 'linear-gradient(135deg,#e0f7f4,var(--teal3))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Admin Panel
              </div>
              <div style={{ fontSize: 12, color: 'var(--mist)', marginTop: 4 }}>Natural Reserve · Akses Admin</div>
            </div>

            {loginError && (
              <div className={`${styles.alert} ${styles.alertError} ${styles.show}`} style={{ marginBottom: 16 }}>
                <span>⚠</span><span>{loginError}</span>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className={styles.formLabel}>Username Admin</label>
              <input
                id="adminUser"
                className={styles.formInput}
                type="text"
                placeholder="admin"
                autoFocus
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className={styles.formLabel}>Password</label>
              <input
                id="adminPass"
                className={styles.formInput}
                type="password"
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={doAdminLogin}
            >
              Masuk sebagai Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN SHELL ── */

  return (
    <div className={styles.pageBody}>
      <Bubbles />
      <div className={styles.shell}>
        {/* Mobile hamburger header */}
        <div className={styles.mobileHeader}>
          <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
            <span></span><span></span><span></span>
          </button>
          <div className={styles.mobileHeaderTitle}>
            <span>🐟</span> Natural Reserve
          </div>
        </div>

        <AdminSidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          pendingCount={pendingCount}
          currentAdmin={currentAdmin}
          onLogout={doAdminLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className={styles.main}>
          {/* Global alerts */}
          {globalMsg && (
            <div className={`${styles.alert} ${globalMsg.type === 'success' ? styles.alertSuccess : styles.alertError} ${styles.show}`}>
              <span>{globalMsg.type === 'success' ? '✓' : '⚠'}</span>
              <span>{globalMsg.msg}</span>
            </div>
          )}

          {/* ── REQUESTS ── */}
          {activeSection === 'requests' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>📝 Permintaan Akses</div>
                <div className={styles.pageSub}>Tinjau dan setujui permintaan dari pengguna baru</div>
              </div>
              <RequestsTable currentAdmin={currentAdmin} onPendingCount={setPendingCount} showMsg={showMsg} />
            </>
          )}

          {/* ── CODES ── */}
          {activeSection === 'codes' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>🔑 Kode Akses Aktif</div>
                <div className={styles.pageSub}>Semua kode yang sedang aktif — klik salin untuk menyalin kode</div>
              </div>
              <CodesTable showMsg={showMsg} />
            </>
          )}

          {/* ── GENERATE ── */}
          {activeSection === 'generate' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>➕ Buat Kode Manual</div>
                <div className={styles.pageSub}>Generate kode akses baru untuk pengguna tertentu</div>
              </div>
              <GenerateForm showMsg={showMsg} />
            </>
          )}

          {/* ── ADMIN MANAGEMENT ── */}
          {activeSection === 'admins' && (
            <>
              <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>🛡️ Kelola Admin</div>
                <div className={styles.pageSub}>Tambah atau hapus akun admin yang dapat masuk ke panel ini</div>
              </div>
              <AdminManagement showMsg={showMsg} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
