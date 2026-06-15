'use client';
import { useState } from 'react';
import styles from '@/styles/dashboard.module.css';
import type { UserProfile } from '@/types';

interface Props {
  user: UserProfile | null;
  lang: 'id' | 'en';
  onToggleLang: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  showToast: (msg: string) => void;
}

export default function TopNav({ user, lang, onToggleLang, onOpenProfile, onLogout, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const initial = user?.firstName?.[0] || user?.username?.[0] || '?';

  return (
    <>
      <nav className={styles.topNav}>
        <div className={styles.navBrand}>
          <div className={styles.navBrandIcon}>🌿🐟</div>
          Natural Reserve
        </div>

        <button className={styles.profileBtn} onClick={() => setOpen(!open)}>
          <div className={styles.profileAvatar}>
            {user?.avatar ? <img src={user.avatar} alt="avatar" /> : initial.toUpperCase()}
          </div>
          <span className={styles.profileName}>{user?.firstName || user?.username || 'User'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
            <div className={`${styles.profileDropdown} ${styles.open}`}>
              <div className={styles.pdHeader}>
                <div className={styles.pdAvatarLg}>
                  {user?.avatar ? <img src={user.avatar} alt="avatar" /> : initial.toUpperCase()}
                </div>
                <div>
                  <div className={styles.pdName}>{user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'User'}</div>
                  <div className={styles.pdRole}>{user?.role || 'Operator'}</div>
                </div>
              </div>
              <div className={styles.pdMenu}>
                <button className={styles.pdItem} onClick={() => { setOpen(false); onOpenProfile(); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  {lang === 'id' ? 'Profil & Akun' : 'Profile & Account'}
                </button>
                <button className={styles.pdItem} onClick={() => { setOpen(false); onToggleLang(); }}>
                  🌐 {lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
                </button>
                <button className={styles.pdItem} onClick={() => { setOpen(false); onOpenSettings(); }}>
                  ⚙️ {lang === 'id' ? 'Pengaturan' : 'Settings'}
                </button>
                <div className={styles.pdDivider} />
                <button className={`${styles.pdItem} ${styles.pdItemDanger}`} onClick={() => { setOpen(false); onLogout(); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {lang === 'id' ? 'Keluar' : 'Logout'}
                </button>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
