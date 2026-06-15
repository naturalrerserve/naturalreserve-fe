'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/admin.module.css';
import { nrCreateAdmin, nrListAdmins, nrDeleteAdmin } from '@/lib/firebase-data';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface AdminManagementProps {
  showMsg: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminManagement({ showMsg }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await nrListAdmins();
      setAdmins(data);
    } catch {
      showMsg('error', 'Gagal memuat daftar admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      showMsg('error', 'Semua field harus diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg('error', 'Format email tidak valid.');
      return;
    }
    if (password.length < 8) {
      showMsg('error', 'Password minimal 8 karakter.');
      return;
    }
    if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
      showMsg('error', 'Password harus mengandung minimal 1 huruf besar dan 1 angka.');
      return;
    }
    if (password !== confirmPassword) {
      showMsg('error', 'Password dan konfirmasi password tidak cocok.');
      return;
    }

    setFormLoading(true);
    try {
      await nrCreateAdmin(name.trim(), email.trim(), username.trim(), password);
      showMsg('success', `✅ Admin '${username.trim()}' berhasil dibuat!`);
      setName(''); setEmail(''); setUsername(''); setPassword(''); setConfirmPassword('');
      await loadAdmins();
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal membuat admin baru.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`Hapus admin '${admin.username}'? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(admin.id);
    try {
      await nrDeleteAdmin(admin.id);
      showMsg('success', `Admin '${admin.username}' berhasil dihapus.`);
      await loadAdmins();
    } catch (err: any) {
      showMsg('error', err.message || 'Gagal menghapus admin.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── FORM BUAT ADMIN ── */}
      <div className={styles.tableWrap} style={{ padding: 24 }}>
        <div className={styles.tableTitle} style={{ marginBottom: 20 }}>
          <span>👤</span> Tambah Admin Baru
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
          {/* Nama */}
          <div>
            <label className={styles.formLabel}>Nama Lengkap</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="Nama lengkap admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className={styles.formLabel}>Email</label>
            <input
              className={styles.formInput}
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Username */}
          <div>
            <label className={styles.formLabel}>Username</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="username_admin"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
            />
          </div>

          {/* Password */}
          <div>
            <label className={styles.formLabel}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={styles.formInput}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 karakter, 1 huruf besar, 1 angka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mist)', padding: 4,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>Konfirmasi Password</label>
            <input
              className={styles.formInput}
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi password di atas"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && password !== confirmPassword && (
              <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>❌ Password tidak cocok</div>
            )}
            {confirmPassword && password === confirmPassword && (
              <div style={{ color: '#4ade80', fontSize: 12, marginTop: 6 }}>✅ Password cocok</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleCreate}
            disabled={formLoading}
          >
            {formLoading ? '⏳ Membuat...' : '➕ Buat Admin Baru'}
          </button>
        </div>
      </div>

      {/* ── DAFTAR ADMIN ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableTitle} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span>🛡️</span> Daftar Admin ({admins.length})
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--mist)' }}>Memuat daftar admin...</div>
        ) : admins.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--mist)' }}>
            Belum ada admin yang dibuat dari panel ini.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nama</th>
                <th className={styles.th}>Username</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Dibuat</th>
                <th className={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--teal3), var(--teal4))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#0a2a2a', flexShrink: 0,
                      }}>
                        {(admin.firstName || admin.username)[0].toUpperCase()}
                      </div>
                      <span>{admin.firstName} {admin.lastName}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                      @{admin.username}
                    </code>
                  </td>
                  <td className={styles.td} style={{ color: 'var(--mist)', fontSize: 13 }}>{admin.email}</td>
                  <td className={styles.td} style={{ color: 'var(--mist)', fontSize: 13 }}>{formatDate(admin.createdAt)}</td>
                  <td className={styles.td}>
                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => handleDelete(admin)}
                      disabled={deletingId === admin.id}
                    >
                      {deletingId === admin.id ? '⏳' : '🗑️ Hapus'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
