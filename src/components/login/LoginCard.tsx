'use client';
import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/login.module.css';
import { nrLogin, nrAuthReady, nrLogActivity } from '@/lib/firebase-data';
import { auth } from '@/lib/firebase';

export default function LoginCard({
  onSwitchTab,
}: {
  onSwitchTab: () => void;
}) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCode,   setShowCode]   = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [shake, setShake] = useState(false);

  /* Restore remembered username */
  useEffect(() => {
    const saved = localStorage.getItem('nr_remember_user');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
    /* If already logged in, redirect */
    nrAuthReady().then((user) => {
      if (user) router.push('/dashboard');
    });
  }, [router]);

  const handlePasswordInput = (val: string) => {
    setPassword(val);
  };

  const handleLogin = async () => {
    setAlert(null);

    if (!username.trim() || !password.trim()) {
      setAlert({ type: 'error', msg: 'Username dan password harus diisi.' });
      return;
    }

    setLoading(true);

    try {
      /* Step 1: Login via NestJS backend */
      await nrLogin(username.trim(), password);

      /* Step 2: Remember me */
      if (rememberMe) {
        localStorage.setItem('nr_remember_user', username.trim());
      } else {
        localStorage.removeItem('nr_remember_user');
      }

      /* Step 3: Log activity */
      const user = auth.currentUser;
      if (user) await nrLogActivity(user.uid, 'login', 'Login menggunakan password');

      setAlert({ type: 'success', msg: 'Login berhasil! Mengalihkan…' });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Username atau password salah.';
      setAlert({ type: 'error', msg });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleMainAction = () => {
    handleLogin();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMainAction();
    }
  };

  return (
    <div className={`${styles.loginCard} ${shake ? styles.shake : ''}`}>
      <div className={styles.cardTitle}>Masuk sebagai Operator</div>

      {/* Alerts */}
      {alert && (
        <div className={`${styles.alert} ${styles[alert.type === 'error' ? 'alertError' : 'alertSuccess']} ${styles.show}`}>
          <span>{alert.type === 'error' ? '⚠' : '✓'}</span>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Username */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="username">Username</label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          <input
            id="username"
            className={styles.formInput}
            type="text"
            placeholder="Masukkan username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
        </div>
      </div>

      {/* Password */}
      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor="password">Password</label>
        <div className={styles.inputWrap}>
          <input
            id="password"
            className={`${styles.formInput} ${styles.accessCodeInput}`}
            type={showCode ? 'text' : 'password'}
            placeholder="● ● ● ● ● ● ● ●"
            autoComplete="current-password"
            value={password}
            onChange={(e) => handlePasswordInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className={styles.eyeBtn} onClick={() => setShowCode(!showCode)} type="button" title="Tampilkan/sembunyikan">
            {showCode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Remember + Forgot */}
      <div className={styles.formFooterRow}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span className={styles.checkboxLabel}>Ingat username</span>
        </label>
        <button className={styles.forgotLink} onClick={onSwitchTab} type="button">
          Belum punya akses?
        </button>
      </div>

      {/* Login Button */}
      <button
        className={`${styles.btnLogin} ${loading ? styles.loading : ''}`}
        onClick={handleMainAction}
        disabled={loading}
        id="loginBtn"
      >
        <div className={styles.btnSpinner} />
        <span className={styles.btnText}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ verticalAlign: '-2px' }}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Masuk
        </span>
      </button>
    </div>
  );
}
