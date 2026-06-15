'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '@/styles/dashboard.module.css';
import { useRouter } from 'next/navigation';
import { auth, onAuthStateChanged } from '@/lib/firebase';
import {
  nrGetCurrentUser, nrLogout, nrLoadFishList, nrSaveFishList,
  nrLoadSettings, nrSaveSettings, nrLogActivity,
} from '@/lib/firebase-data';
import type { Fish, AppSettings, UserProfile, FishSpecies, FishStage } from '@/types';
import { FR_DB, getFRData, SPECIES_LABEL, STAGE_LABEL } from '@/lib/fr-database';

/* ── Sub-components (inline for simplicity) ── */
import TopNav from '@/components/dashboard/TopNav';
import FishForm from '@/components/dashboard/FishForm';
import FishTable from '@/components/dashboard/FishTable';
import SummaryCards from '@/components/dashboard/SummaryCards';
import SchedulePanel from '@/components/dashboard/SchedulePanel';
import RefTablePanel from '@/components/dashboard/RefTablePanel';
import FcrSection from '@/components/dashboard/FcrSection';
import PondSection from '@/components/dashboard/PondSection';
import HistorySection from '@/components/dashboard/HistorySection';
import Protections from '@/components/dashboard/Protections';
import ProfileModal from '@/components/dashboard/ProfileModal';
import SettingsModal from '@/components/dashboard/SettingsModal';
import ActionBar from '@/components/dashboard/ActionBar';
import Bubbles from '@/components/login/Bubbles';
import Toast from '@/components/dashboard/Toast';

const DEFAULT_SETTINGS: AppSettings = {
  bubbles: true, wave: true, glass: true, lang: 'id',
  unit: 'kg', rownum: false, autosave: false,
  prot_rightclick: false, prot_select: false, prot_drag: false,
  prot_copy: false, prot_viewsource: false, prot_saveprint: false,
  prot_devtools: false, prot_devdetect: false, prot_watermark: false,
};

export default function DashboardPage() {
  const router = useRouter();
  const [user,        setUser]        = useState<UserProfile | null>(null);
  const [fishList,    setFishList]    = useState<Fish[]>([]);
  const [settings,    setSettings]    = useState<AppSettings>(DEFAULT_SETTINGS);
  const [toast,        setToast]        = useState('');
  const [showProfile,  setShowProfile]  = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lang,         setLang]         = useState<'id' | 'en'>('id');
  const [loading,     setLoading]     = useState(true);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  /* ── AUTH GUARD ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { router.push('/'); return; }
      const profile = await nrGetCurrentUser();
      setUser(profile);
      const uid = fbUser.uid;

      /* Load fish list */
      const fish = await nrLoadFishList(uid);
      setFishList(fish);

      /* Load settings */
      const saved = await nrLoadSettings(uid);
      if (saved) setSettings(saved);

      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  /* ── TOAST ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  /* ── SAVE FISH LIST ── */
  const saveFish = useCallback(async (list: Fish[]) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await nrSaveFishList(uid, list);
  }, []);

  const handleAddFish = useCallback((fish: Fish) => {
    setFishList((prev) => {
      const next = [...prev, fish];
      saveFish(next);
      return next;
    });
    showToast(`✓ ${fish.name} ditambahkan`);
  }, [saveFish, showToast]);

  const handleDeleteFish = useCallback((id: number) => {
    setFishList((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFish(next);
      return next;
    });
    showToast('Ikan dihapus');
  }, [saveFish, showToast]);

  const handleUpdateFish = useCallback((updated: Fish) => {
    setFishList((prev) => {
      const next = prev.map((f) => f.id === updated.id ? updated : f);
      saveFish(next);
      return next;
    });
    showToast('Data ikan diperbarui');
  }, [saveFish, showToast]);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Yakin ingin menghapus semua data ikan?')) return;
    setFishList([]);
    await saveFish([]);
    showToast('Semua data dihapus');
  }, [saveFish, showToast]);

  const handleLogout = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) await nrLogActivity(uid, 'logout', 'Keluar dari aplikasi');
    await nrLogout();
    router.push('/');
  };

  const handleSaveSettings = async (s: AppSettings) => {
    setSettings(s);
    setLang(s.lang);
    const uid = auth.currentUser?.uid;
    if (uid) await nrSaveSettings(uid, s);
    showToast('Pengaturan disimpan');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--deep)', color: 'var(--teal3)', fontFamily: "'DM Mono', monospace", fontSize: 14 }}>
        ⏳ Memuat data...
      </div>
    );
  }

  const totalBiomass = fishList.reduce((s, f) => s + f.biomass, 0);
  const totalPakan   = fishList.reduce((s, f) => s + f.pakanDay, 0);
  const totalCount   = fishList.reduce((s, f) => s + f.qty, 0);

  return (
    <div className={styles.pageBody}>
      <Protections settings={settings} />
      {settings.bubbles && <Bubbles />}

      {/* Top Nav */}
      <TopNav
        user={user}
        lang={lang}
        onToggleLang={() => setLang(lang === 'id' ? 'en' : 'id')}
        onOpenProfile={() => setShowProfile(true)}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettings(true)}
        showToast={showToast}
      />

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          showToast={showToast}
          onUpdate={async (updated) => {
            setUser(updated);
            showToast('Profil diperbarui');
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          showToast={showToast}
          fishList={fishList}
        />
      )}

      <div className={styles.wrapper}>
        {/* ── HEADER ── */}
        <header className={styles.header}>
          <button className={styles.langToggleBtn} onClick={() => setLang(lang === 'id' ? 'en' : 'id')}>
            {lang === 'id' ? '🇺🇸 EN' : '🇮🇩 ID'}
          </button>
          <div className={styles.logoMark}>🌿</div>
          <h1 className={styles.h1}>Natural Reserve</h1>
          <p className={styles.headerSub}>
            {lang === 'id'
              ? 'Kalkulator pakan ikan berbasis berat biomassa — akurat, cepat, dan mudah digunakan'
              : 'Fish farming feeding rate calculator based on biomass weight — accurate, fast, and easy to use'}
          </p>
        </header>

        {/* ── SUMMARY CARDS ── */}
        <SummaryCards
          totalBiomass={totalBiomass}
          totalPakan={totalPakan}
          totalCount={totalCount}
          lang={lang}
        />

        {/* ── MAIN GRID ── */}
        <div className={styles.mainGrid}>
          {/* Form Panel */}
          <FishForm
            lang={lang}
            onAdd={handleAddFish}
            fishCount={fishList.length}
          />

          {/* Fish Table Panel */}
          <FishTable
            fish={fishList}
            lang={lang}
            onDelete={handleDeleteFish}
            onUpdate={handleUpdateFish}
            showToast={showToast}
          />
        </div>

        {/* ── ACTION BAR ── */}
        <ActionBar
          fish={fishList}
          lang={lang}
          onClear={handleClearAll}
          showToast={showToast}
          user={user}
        />

        {/* ── SCHEDULE ── */}
        <SchedulePanel fish={fishList} lang={lang} />

        {/* ── REF TABLE ── */}
        <RefTablePanel lang={lang} />

        {/* ── FCR SECTION ── */}
        <FcrSection fish={fishList} lang={lang} />

        {/* ── POND SECTION ── */}
        <PondSection fish={fishList} lang={lang} />

        {/* ── HISTORY ── */}
        <HistorySection fish={fishList} lang={lang} showToast={showToast} user={user} />
      </div>

      {/* TOAST */}
      <Toast msg={toast} />
    </div>
  );
}
