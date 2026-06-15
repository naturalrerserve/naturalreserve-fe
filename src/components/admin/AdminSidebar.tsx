'use client';
import styles from '@/styles/admin.module.css';
import type { AdminSection } from '@/types';

interface Props {
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  pendingCount: number;
  currentAdmin: string;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  activeSection, onNavigate, pendingCount, currentAdmin, onLogout,
  isOpen, onClose,
}: Props) {
  const handleNav = (section: AdminSection) => {
    onNavigate(section);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.sidebarOverlay} onClick={onClose} />}

      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>🐟</div>
          <div>
            <div className={styles.brandName}>Natural Reserve</div>
            <div className={styles.brandSub}>Admin Panel</div>
          </div>
          {/* Mobile close button */}
          <button className={styles.sidebarCloseBtn} onClick={onClose} aria-label="Tutup menu">✕</button>
        </div>

        <div className={styles.navLabel}>📂 Menu</div>

        <button
          id="navRequests"
          className={`${styles.navBtn} ${activeSection === 'requests' ? styles.active : ''}`}
          onClick={() => handleNav('requests')}
        >
          📝 Permintaan Akses
          {pendingCount > 0 && (
            <span className={styles.badge}>{pendingCount}</span>
          )}
        </button>

        <button
          id="navCodes"
          className={`${styles.navBtn} ${activeSection === 'codes' ? styles.active : ''}`}
          onClick={() => handleNav('codes')}
        >
          🔑 Kode Akses Aktif
        </button>

        <button
          id="navGenerate"
          className={`${styles.navBtn} ${activeSection === 'generate' ? styles.active : ''}`}
          onClick={() => handleNav('generate')}
        >
          ➕ Buat Kode Manual
        </button>

        <button
          id="navAdmins"
          className={`${styles.navBtn} ${activeSection === 'admins' ? styles.active : ''}`}
          onClick={() => handleNav('admins')}
        >
          🛡️ Kelola Admin
        </button>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminName}>
            Login sebagai: <strong>{currentAdmin}</strong>
          </div>
          <button className={styles.navBtn} onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  );
}
