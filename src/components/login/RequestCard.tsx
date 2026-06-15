'use client';
import { useState, KeyboardEvent } from 'react';
import styles from '@/styles/login.module.css';
import { nrCreateAccessRequest, nrVerifyOtp } from '@/lib/firebase-data';

export default function RequestCard({ onSwitchTab }: { onSwitchTab: () => void }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reason,   setReason]   = useState('');
  const [otp,      setOtp]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  
  // OTP state
  const [showOtp, setShowOtp] = useState(false);

  const handleRequest = async () => {
    setAlert(null);

    if (!name.trim())          { setAlert({ type: 'error', msg: 'Nama tidak boleh kosong.' }); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlert({ type: 'error', msg: 'Format email tidak valid.' }); return;
    }
    const uname = username.trim().toLowerCase();
    if (!uname || uname.length < 3) { setAlert({ type: 'error', msg: 'Username minimal 3 karakter.' }); return; }
    if (/\s/.test(uname))           { setAlert({ type: 'error', msg: 'Username tidak boleh ada spasi.' }); return; }
    if (!password || password.length < 6) { setAlert({ type: 'error', msg: 'Password minimal 6 karakter.' }); return; }
    if (!reason.trim())             { setAlert({ type: 'error', msg: 'Keperluan akses harus diisi.' }); return; }

    setLoading(true);
    try {
      const res = await nrCreateAccessRequest(name.trim(), email.trim(), uname, password, reason.trim());
      setAlert({ type: 'success', msg: 'Kode verifikasi OTP telah dikirim ke email Anda. Silakan masukkan di bawah.' });
      setShowOtp(true);
    } catch (err: any) {
      const msg = err.message || 'Gagal mengirim permintaan. Coba lagi.';
      setAlert({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAlert(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setAlert({ type: 'error', msg: 'Masukkan 6-digit kode verifikasi OTP.' });
      return;
    }

    setLoading(true);
    try {
      const uname = username.trim().toLowerCase();
      await nrVerifyOtp(uname, otp.trim());
      setAlert({ type: 'success', msg: 'Email berhasil diverifikasi! Permintaan Anda sedang ditinjau oleh Admin.' });
      setShowOtp(false);
      setName('');
      setEmail('');
      setUsername('');
      setReason('');
      setOtp('');
    } catch (err: any) {
      const msg = err.message || 'Kode verifikasi salah atau kedaluwarsa.';
      setAlert({ type: 'error', msg });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showOtp) {
        handleVerifyOtp();
      } else {
        handleRequest();
      }
    }
  };

  return (
    <div className={styles.loginCard}>
      <div className={styles.cardTitle}>Ajukan Permintaan Akses</div>

      {alert && (
        <div className={`${styles.alert} ${alert.type === 'error' ? styles.alertError : styles.alertSuccess} ${styles.show}`}>
          <span>{alert.type === 'error' ? '⚠' : '✓'}</span>
          <span>{alert.msg}</span>
        </div>
      )}

      {!showOtp ? (
        <>
          <div className={styles.requestHint}>
            📋 Isi form berikut dengan <strong style={{ color: 'var(--teal3)' }}>email asli</strong> Anda. 
            Kode OTP verifikasi akan dikirim langsung untuk memverifikasi akun Anda.
          </div>

          {/* Nama */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="reqName">Nama Lengkap</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </span>
              <input id="reqName" className={styles.formInput} type="text" placeholder="Nama lengkap Anda"
                value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} />
            </div>
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="reqEmail">Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input id="reqEmail" className={styles.formInput} type="email" placeholder="email@contoh.com"
                value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} />
            </div>
          </div>

          {/* Username */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="reqUsername">Username yang Diinginkan</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input id="reqUsername" className={styles.formInput} type="text" placeholder="username_anda"
                value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={onKeyDown} />
            </div>
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="reqPassword">Password Baru</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input id="reqPassword" className={styles.formInput} type="password" placeholder="Minimal 6 karakter"
                value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} />
            </div>
          </div>

          {/* Alasan */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="reqReason">Keperluan Akses</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon} style={{ top: 14, transform: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </span>
              <textarea id="reqReason" className={styles.formTextarea}
                placeholder="Jelaskan keperluan akses Anda..."
                style={{ paddingTop: 10 }}
                value={reason} onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="reqBtn"
            className={`${styles.btnRequest} ${loading ? styles.loading : ''}`}
            onClick={handleRequest}
            disabled={loading}
          >
            <div className={styles.btnSpinner} />
            <span className={styles.btnText}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ verticalAlign: '-2px' }}>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Kirim Permintaan Akses
            </span>
          </button>
        </>
      ) : (
        <>
          <div className={styles.requestHint}>
            🔑 Masukkan <strong>6-digit kode OTP</strong> yang kami kirimkan ke email: <strong style={{ color: 'var(--teal3)' }}>{email}</strong>
          </div>

          {/* OTP Input */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="otpCode">Kode OTP Verifikasi</label>
            <div className={styles.inputWrap}>
              <input
                id="otpCode"
                className={`${styles.formInput} ${styles.accessCodeInput}`}
                type="text"
                placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontWeight: 'bold', fontSize: 18 }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={onKeyDown}
                autoFocus
              />
            </div>
          </div>

          {/* Verify OTP Button */}
          <button
            id="verifyOtpBtn"
            className={`${styles.btnLogin} ${loading ? styles.loading : ''}`}
            onClick={handleVerifyOtp}
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            <div className={styles.btnSpinner} />
            <span className={styles.btnText}>Verifikasi &amp; Kirim</span>
          </button>

          <button
            className={`${styles.forgotLink}`}
            style={{ marginTop: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'block', margin: '14px auto 0' }}
            onClick={() => setShowOtp(false)}
            type="button"
          >
            ← Kembali ke Form Pengajuan
          </button>
        </>
      )}

      <div className={styles.switchLink} style={{ marginTop: 14 }}>
        Sudah punya kode?{' '}
        <button onClick={onSwitchTab} type="button">Masuk di sini</button>
      </div>
    </div>
  );
}
