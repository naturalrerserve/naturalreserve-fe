'use client';
import { useState } from 'react';
import styles from '@/styles/dashboard.module.css';
import type { UserProfile } from '@/types';
import { auth } from '@/lib/firebase';
import { nrSaveProfile, nrSaveAvatar, nrChangePassword, nrGetCurrentUser, nrGetActivity } from '@/lib/firebase-data';
import type { ActivityLog } from '@/types';

interface Props {
  user: UserProfile | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  onUpdate: (user: UserProfile) => void;
}

export default function ProfileModal({ user, onClose, showToast, onUpdate }: Props) {
  const [tab,        setTab]        = useState<'info' | 'security' | 'activity'>('info');
  const [firstName,  setFirstName]  = useState(user?.firstName || '');
  const [lastName,   setLastName]   = useState(user?.lastName  || '');
  const [phone,      setPhone]      = useState(user?.phone     || '');
  const [location,   setLocation]   = useState(user?.location  || '');
  const [bio,        setBio]        = useState(user?.bio        || '');
  const [newPass,    setNewPass]    = useState('');
  const [curPass,    setCurPass]    = useState('');
  const [activity,   setActivity]   = useState<ActivityLog[]>([]);
  const [actLoaded,  setActLoaded]  = useState(false);
  const [pfAlert,    setPfAlert]    = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const initial = user?.firstName?.[0] || user?.username?.[0] || '?';

  const saveInfo = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !user) return;
    try {
      await nrSaveProfile(uid, { firstName, lastName, phone, location, bio });
      const updated = await nrGetCurrentUser();
      if (updated) onUpdate(updated);
      showToast('Profil diperbarui');
      setPfAlert({ type: 'ok', msg: '✓ Profil berhasil disimpan' });
    } catch (e) {
      setPfAlert({ type: 'err', msg: '✗ Gagal menyimpan profil' });
    }
  };

  const changePass = async () => {
    if (!curPass || newPass.length < 6) {
      setPfAlert({ type: 'err', msg: 'Password baru minimal 6 karakter' }); return;
    }
    try {
      await nrChangePassword(curPass, newPass);
      showToast('Password berhasil diubah');
      setPfAlert({ type: 'ok', msg: '✓ Password berhasil diubah' });
      setCurPass(''); setNewPass('');
    } catch (e: unknown) {
      setPfAlert({ type: 'err', msg: '✗ Password lama salah' });
    }
  };

  const loadActivity = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const act = await nrGetActivity(uid);
    setActivity(act);
    setActLoaded(true);
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const uid = auth.currentUser?.uid;
      if (!uid || !user) return;
      await nrSaveAvatar(uid, dataUrl);
      const updated = await nrGetCurrentUser();
      if (updated) onUpdate(updated);
      showToast('Avatar diperbarui');
    };
    reader.readAsDataURL(file);
  };

  const joinDate  = user?.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID') : '–';

  return (
    <div className={`${styles.pfOverlay} ${styles.open}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.pfModal}>
        {/* Tabs */}
        <div className={styles.pfTabs}>
          {(['info', 'security', 'activity'] as const).map((t) => (
            <button
              key={t}
              className={`${styles.pfTab} ${tab === t ? styles.active : ''}`}
              onClick={() => { setTab(t); if (t === 'activity' && !actLoaded) loadActivity(); }}
            >
              {t === 'info' ? '👤 Profil' : t === 'security' ? '🔒 Keamanan' : '📋 Aktivitas'}
            </button>
          ))}
        </div>

        <div className={styles.pfBody}>
          <div className={styles.pfCloseBtn}>
            <span className={styles.pfModalTitle}>
              {tab === 'info' ? 'Profil & Akun' : tab === 'security' ? 'Keamanan' : 'Aktivitas'}
            </span>
            <button className={styles.pfClose} onClick={onClose}>✕</button>
          </div>

          {/* Alert */}
          {pfAlert && (
            <div className={`${styles.pfAlert} ${pfAlert.type === 'ok' ? styles.pfAlertOk : styles.pfAlertErr} ${styles.show}`}>
              {pfAlert.msg}
            </div>
          )}

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div className={`${styles.pfPanel} ${styles.active}`}>
              <div className={styles.pfAvatarSection}>
                <label className={styles.pfAvatarWrap} htmlFor="avatarInput">
                  <div className={styles.pfAvatarImg}>
                    {user?.avatar ? <img src={user.avatar} alt="avatar" /> : initial.toUpperCase()}
                  </div>
                  <div className={styles.pfAvatarOverlay}>📷</div>
                </label>
                <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
                <span className={styles.pfAvatarHint}>Klik untuk ganti foto</span>
              </div>

              <div className={styles.pfStatRow}>
                <div className={styles.pfStat}>
                  <div className={styles.pfStatVal}>{user?.loginCount || 1}</div>
                  <div className={styles.pfStatLbl}>Login</div>
                </div>
                <div className={styles.pfStat}>
                  <div className={styles.pfStatVal}>{joinDate}</div>
                  <div className={styles.pfStatLbl}>Bergabung</div>
                </div>
                <div className={styles.pfStat}>
                  <div className={styles.pfStatVal}>{user?.role || 'Operator'}</div>
                  <div className={styles.pfStatLbl}>Role</div>
                </div>
              </div>

              <div className={styles.pfRow2}>
                <div className={styles.pfFormGroup}>
                  <label className={styles.pfLabel}>Nama Depan</label>
                  <input className={styles.pfInput} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className={styles.pfFormGroup}>
                  <label className={styles.pfLabel}>Nama Belakang</label>
                  <input className={styles.pfInput} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>Username</label>
                <input className={styles.pfInput} type="text" value={user?.username || ''} disabled />
              </div>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>Email</label>
                <input className={styles.pfInput} type="text" value={user?.email || ''} disabled />
              </div>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>No. Telepon</label>
                <input className={styles.pfInput} type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>Lokasi</label>
                <input className={styles.pfInput} type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <button className={styles.pfBtnSave} onClick={saveInfo}>💾 Simpan Profil</button>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === 'security' && (
            <div className={`${styles.pfPanel} ${styles.active}`}>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>Password Saat Ini</label>
                <input className={styles.pfInput} type="password" placeholder="••••••••" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
              </div>
              <div className={styles.pfFormGroup}>
                <label className={styles.pfLabel}>Password Baru</label>
                <input className={styles.pfInput} type="password" placeholder="Min. 6 karakter" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </div>
              <button className={styles.pfBtnSave} onClick={changePass}>🔒 Ganti Password</button>
            </div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {tab === 'activity' && (
            <div className={`${styles.pfPanel} ${styles.active}`}>
              {activity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--mist)', fontSize: 13 }}>
                  📭 Belum ada aktivitas tercatat.
                </div>
              ) : (
                activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(13,148,136,.08)', fontSize: 12 }}>
                    <span style={{ color: 'var(--teal3)', fontFamily: "'DM Mono',monospace", minWidth: 60 }}>{a.type}</span>
                    <span style={{ color: '#cbd5e1', flex: 1 }}>{a.desc}</span>
                    <span style={{ color: 'var(--mist)', fontSize: 10, fontFamily: "'DM Mono',monospace" }}>
                      {new Date(a.time).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
