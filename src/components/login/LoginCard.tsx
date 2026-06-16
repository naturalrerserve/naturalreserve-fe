'use client';
import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/login.module.css';
import { nrLogin, nrVerifyLoginOtp, nrAuthReady, nrLogActivity, nrGoogleLogin } from '@/lib/firebase-data';
import { auth } from '@/lib/firebase';
import { GoogleLogin } from '@react-oauth/google';

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
  
  // OTP state
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

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
      const res = await nrLogin(username.trim(), password);

      if (res.requiresOtp) {
        setAlert({ type: 'success', msg: res.message });
        setShowOtpInput(true);
        setLoading(false);
        return;
      }

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

  const handleVerifyOtp = async () => {
    setAlert(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setAlert({ type: 'error', msg: 'Masukkan 6-digit Kode Akses Permanen Anda.' });
      return;
    }

    setLoading(true);
    try {
      await nrVerifyLoginOtp(username.trim(), otp.trim());

      if (rememberMe) {
        localStorage.setItem('nr_remember_user', username.trim());
      } else {
        localStorage.removeItem('nr_remember_user');
      }

      const user = auth.currentUser;
      if (user) await nrLogActivity(user.uid, 'login', 'Login menggunakan password (2FA)');

      setAlert({ type: 'success', msg: 'Verifikasi berhasil! Mengalihkan…' });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Kode akses salah.';
      setAlert({ type: 'error', msg });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setAlert(null);
    setLoading(true);
    try {
      if (!credentialResponse.credential) throw new Error('Token Google tidak ditemukan.');
      await nrGoogleLogin(credentialResponse.credential);
      
      const user = auth.currentUser;
      if (user) await nrLogActivity(user.uid, 'login', 'Login menggunakan akun Google');

      setAlert({ type: 'success', msg: 'Login berhasil! Mengalihkan…' });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Gagal login menggunakan akun Google.';
      setAlert({ type: 'error', msg });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleMainAction = () => {
    if (!showOtpInput) {
      handleLogin();
    } else {
      handleVerifyOtp();
    }
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
            disabled={showOtpInput}
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
            disabled={showOtpInput}
          />
          <button className={styles.eyeBtn} onClick={() => setShowCode(!showCode)} type="button" title="Tampilkan/sembunyikan" disabled={showOtpInput}>
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

      {/* OTP Input */}
      <div className={styles.formGroup} style={{ opacity: showOtpInput ? 1 : 0.5, transition: 'opacity 0.3s' }}>
        <label className={styles.formLabel} htmlFor="otpInput">Kode Akses Permanen</label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            id="otpInput"
            className={styles.formInput}
            type="text"
            placeholder={showOtpInput ? "Masukkan 6-digit kode" : "Klik 'Masuk' untuk lanjut"}
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            onKeyDown={onKeyDown}
            disabled={!showOtpInput}
          />
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

      {/* Google Login Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: '14px' }}>atau</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
      </div>

      {/* Google Login Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            setAlert({ type: 'error', msg: 'Terjadi kesalahan saat memuat Google Login.' });
          }}
          useOneTap
          shape="rectangular"
          theme="outline"
          text="signin_with"
        />
      </div>
    </div>
  );
}
