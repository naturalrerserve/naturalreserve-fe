'use client';
import { useState } from 'react';
import styles from '@/styles/admin.module.css';
import { nrRegister } from '@/lib/firebase-data';
import { genRandomCode } from '@/lib/fr-database';

interface Props {
  showMsg: (type: 'success' | 'error', msg: string) => void;
}

export default function GenerateForm({ showMsg }: Props) {
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [name,      setName]      = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [result, setResult]       = useState<{ code: string; email: string; name: string; username: string } | null>(null);
  const [loading, setLoading]     = useState(false);

  const handleGenerate = async () => {
    if (!username || !email || !name) {
      showMsg('error', 'Username, email, dan nama harus diisi.');
      return;
    }
    const code = codeInput || 'password123';
    setLoading(true);
    try {
      // With NestJS backend, we just call nrRegister which runs the admin code generator endpoint.
      // No need to perform the "register and logout admin" client-side hacks anymore!
      await nrRegister({
        username: username.toLowerCase(),
        password: code,
        email,
        firstName: name,
        lastName: '',
        role: 'Operator',
      });

      setResult({ code, email, name, username });
      showMsg('success', `Kode ${code} berhasil dibuat untuk ${username}`);
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal membuat kode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Form Pembuatan Akun</div>
      </div>
      <div style={{ padding: 20, display: 'grid', gap: 16, maxWidth: 480 }}>
        {/* Username */}
        <div>
          <label className={styles.formLabel}>Username</label>
          <input className={styles.formInput} type="text" placeholder="username_pengguna"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        {/* Email */}
        <div>
          <label className={styles.formLabel}>Email Tujuan</label>
          <input className={styles.formInput} type="email" placeholder="email@pengguna.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {/* Name */}
        <div>
          <label className={styles.formLabel}>Nama Penerima</label>
          <input className={styles.formInput} type="text" placeholder="Nama lengkap"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {/* Custom code */}
        <div>
          <label className={styles.formLabel}>Password Default (kosongkan = password123)</label>
          <input className={styles.formInput} type="text"
            placeholder="Contoh: pass1234 (opsional)"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)} />
        </div>
        {/* Submit */}
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ width: 'fit-content' }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '⏳ Memproses...' : '🔑 Buat Akun & Kirim Email'}
        </button>

        {/* Result box */}
        {result && (
          <div className={styles.genResult}>
            <div style={{ fontSize: 12, color: 'var(--mist)', marginBottom: 8 }}>Akun berhasil dibuat:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className={styles.codeChip}>{result.code}</span>
              <button className={`${styles.btn} ${styles.btnCopy}`} onClick={() => { navigator.clipboard.writeText(result.code); showMsg('success', 'Disalin!'); }}>📋 Salin Password</button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,.5)', marginTop: 8, fontFamily: "'DM Mono',monospace" }}>
              Informasi akun telah berhasil dikirim ke email <strong>{result.email}</strong>. (Password hanya diketahui oleh Anda atau menggunakan default password123).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
