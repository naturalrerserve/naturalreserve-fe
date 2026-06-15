'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/dashboard.module.css';
import type { AppSettings, Fish, HistoryEntry } from '@/types';
import { auth } from '@/lib/firebase';
import {
  nrSaveSettings,
  nrLoadHistory,
  nrGetActivity,
  nrDeleteAllActivity,
  nrDeleteAllHistory,
} from '@/lib/firebase-data';

interface Props {
  settings: AppSettings;
  onClose: () => void;
  onSave: (s: AppSettings) => void;
  showToast: (msg: string) => void;
  fishList: Fish[];
}

type StTab = 'tampilan' | 'proteksi' | 'data' | 'tentang';

export default function SettingsModal({ settings: initialSettings, onClose, onSave, showToast, fishList }: Props) {
  const [tab, setTab] = useState<StTab>('tampilan');
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const lang = settings.lang;

  // Data summary stats
  const [logsCount, setLogsCount] = useState<number | string>('⏳');
  const [histCount, setHistCount] = useState<number | string>('⏳');
  const [sizeEst, setSizeEst] = useState<string>('⏳');
  const [browserInfo, setBrowserInfo] = useState('');
  const [screenInfo, setScreenInfo] = useState('');
  const [tzInfo, setTzInfo] = useState('');

  useEffect(() => {
    // Populate environment data
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        setBrowserInfo('IE ' + (tem[1] || ''));
      } else if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) setBrowserInfo(tem.slice(1).join(' ').replace('OPR', 'Opera'));
      } else {
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        setBrowserInfo(M.join(' '));
      }

      setScreenInfo(`${window.screen.width} x ${window.screen.height}`);
      setTzInfo(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }

    // Fetch stats
    const fetchStats = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const logs = await nrGetActivity(uid);
        setLogsCount(logs.length);
        const hist = await nrLoadHistory(uid);
        const histLength = Object.keys(hist).length;
        setHistCount(histLength);

        // Estimate local storage size
        const rawJson = JSON.stringify(fishList) + JSON.stringify(hist) + JSON.stringify(settings);
        const bytes = new Blob([rawJson]).size;
        if (bytes < 1024) {
          setSizeEst(`${bytes} B`);
        } else {
          setSizeEst(`${(bytes / 1024).toFixed(2)} KB`);
        }
      } catch (err) {
        setLogsCount('–');
        setHistCount('–');
        setSizeEst('–');
      }
    };
    fetchStats();
  }, [fishList, settings]);

  const handleToggle = (key: keyof AppSettings) => {
    const next = { ...settings, [key]: !settings[key] } as AppSettings;
    setSettings(next);
    onSave(next);
  };

  const handleSelectChange = (key: 'lang' | 'unit', val: string) => {
    const next = { ...settings, [key]: val } as AppSettings;
    setSettings(next);
    onSave(next);
  };

  const downloadFile = (data: unknown, filename: string) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(lang === 'id' ? '✓ File berhasil diunduh' : '✓ File downloaded successfully');
  };

  const exportFish = () => {
    downloadFile(fishList, 'nr_fish_export.json');
  };

  const exportHistory = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const hist = await nrLoadHistory(uid);
    downloadFile(hist, 'nr_history_export.json');
  };

  const exportSettings = () => {
    downloadFile(settings, 'nr_settings_export.json');
  };

  const handleDanger = async (action: 'clearLogs' | 'clearHist' | 'resetAll') => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    if (action === 'clearLogs') {
      if (!confirm(lang === 'id' ? 'Hapus semua log aktivitas?' : 'Clear all activity logs?')) return;
      await nrDeleteAllActivity(uid);
      setLogsCount(0);
      showToast(lang === 'id' ? 'Log aktivitas dihapus' : 'Activity logs cleared');
    } else if (action === 'clearHist') {
      if (!confirm(lang === 'id' ? 'Hapus semua riwayat harian?' : 'Clear all daily history?')) return;
      await nrDeleteAllHistory(uid);
      setHistCount(0);
      showToast(lang === 'id' ? 'Riwayat harian dihapus' : 'Daily history cleared');
    } else if (action === 'resetAll') {
      if (!confirm(lang === 'id' ? 'Reset semua pengaturan ke default?' : 'Reset all settings to default?')) return;
      const DEFAULT_SETTINGS: AppSettings = {
        bubbles: true, wave: true, glass: true, lang: 'id',
        unit: 'kg', rownum: false, autosave: false,
        prot_rightclick: false, prot_select: false, prot_drag: false,
        prot_copy: false, prot_viewsource: false, prot_saveprint: false,
        prot_devtools: false, prot_devdetect: false, prot_watermark: false,
      };
      setSettings(DEFAULT_SETTINGS);
      onSave(DEFAULT_SETTINGS);
      showToast(lang === 'id' ? 'Pengaturan di-reset' : 'Settings reset to default');
    }
  };

  const protections = [
    { id: 'prot_rightclick', name: lang === 'id' ? 'Klik Kanan' : 'Right Click', icon: '🖱️' },
    { id: 'prot_select', name: lang === 'id' ? 'Seleksi Teks' : 'Text Selection', icon: '🔤' },
    { id: 'prot_drag', name: lang === 'id' ? 'Drag & Drop' : 'Drag & Drop', icon: '🫳' },
    { id: 'prot_copy', name: lang === 'id' ? 'Ctrl+C/X' : 'Ctrl+C/X', icon: '📋' },
    { id: 'prot_viewsource', name: lang === 'id' ? 'View Source' : 'View Source', icon: '💻' },
    { id: 'prot_saveprint', name: lang === 'id' ? 'Save / Print' : 'Save / Print', icon: '💾' },
    { id: 'prot_devtools', name: lang === 'id' ? 'DevTools Key' : 'DevTools Key', icon: '🔧' },
    { id: 'prot_devdetect', name: lang === 'id' ? 'Detect DevTools' : 'Detect DevTools', icon: '👁️' },
    { id: 'prot_watermark', name: lang === 'id' ? 'Watermark' : 'Watermark', icon: '💧' },
  ] as const;

  return (
    <div className={`${styles.stOverlay} ${styles.open}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.stModal}>
        
        {/* Header */}
        <div className={styles.stHeader}>
          <div className={styles.stHeaderLeft}>
            <div className={styles.stHeaderIcon}>⚙️</div>
            <div className={styles.stTitle}>{lang === 'id' ? 'Pengaturan' : 'Settings'}</div>
          </div>
          <button className={styles.stClose} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.stTabs}>
          {(['tampilan', 'proteksi', 'data', 'tentang'] as const).map((t) => (
            <button
              key={t}
              className={`${styles.stTab} ${tab === t ? styles.active : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'tampilan' ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  {lang === 'id' ? 'Tampilan' : 'Display'}
                </>
              ) : t === 'proteksi' ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {lang === 'id' ? 'Proteksi' : 'Protection'}
                </>
              ) : t === 'data' ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  Data
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {lang === 'id' ? 'Tentang' : 'About'}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={styles.stBody}>

          {/* ── TAMPILAN PANEL ── */}
          {tab === 'tampilan' && (
            <div className={`${styles.stPanel} ${styles.active}`}>
              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Animasi & Efek' : 'Animation & Effects'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Gelembung Latar' : 'Background Bubbles'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Animasi gelembung naik di background' : 'Bubbles animation in the background'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.bubbles} onChange={() => handleToggle('bubbles')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Gelombang Latar' : 'Background Waves'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Pola gelombang bergerak di background' : 'Moving wave patterns in the background'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.wave} onChange={() => handleToggle('wave')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Efek Glassmorphism' : 'Glassmorphism Effect'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Blur transparan pada panel dan card' : 'Transparent blur on panels and cards'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.glass} onChange={() => handleToggle('glass')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Bahasa & Satuan' : 'Language & Units'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Bahasa Antarmuka' : 'Interface Language'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Ubah bahasa teks di seluruh aplikasi' : 'Change interface language'}</div>
                  </div>
                  <select
                    className={styles.stSelect}
                    value={settings.lang}
                    onChange={(e) => handleSelectChange('lang', e.target.value)}
                  >
                    <option value="id">🇮🇩 Indonesia</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Satuan Berat Default' : 'Default Weight Unit'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Satuan dipakai saat input berat ikan' : 'Weight unit for fish inputs'}</div>
                  </div>
                  <select
                    className={styles.stSelect}
                    value={settings.unit}
                    onChange={(e) => handleSelectChange('unit', e.target.value)}
                  >
                    <option value="gram">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Tabel Data' : 'Data Table'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Tampilkan Nomor Baris' : 'Show Row Numbers'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Nomor urut di tabel daftar ikan' : 'Index number in fish list table'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.rownum} onChange={() => handleToggle('rownum')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Simpan Otomatis (Auto-Save)' : 'Auto-Save Data'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Simpan data ikan otomatis setiap kali ada perubahan' : 'Save fish list changes automatically'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.autosave} onChange={() => handleToggle('autosave')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── PROTEKSI PANEL ── */}
          {tab === 'proteksi' && (
            <div className={`${styles.stPanel} ${styles.active}`}>
              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Status Proteksi Aktif' : 'Active Protection Status'}</div>
                <div className={styles.stProtGrid}>
                  {protections.map((p) => (
                    <div key={p.id} className={`${styles.stProtChip} ${settings[p.id] ? styles.on : styles.off}`}>
                      <div className={styles.stProtDot} />
                      <span>{p.icon} {p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Perlindungan Mouse' : 'Mouse Protection'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Klik Kanan' : 'Block Right Click'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah context menu (Inspect, Save Image, dll)' : 'Prevent developer context menu'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_rightclick} onChange={() => handleToggle('prot_rightclick')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Seleksi Teks' : 'Block Text Selection'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah pengguna menyorot / menyalin teks' : 'Prevent highlighted copy selections'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_select} onChange={() => handleToggle('prot_select')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Drag & Drop' : 'Block Drag & Drop'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah konten diseret ke luar halaman' : 'Prevent dragging images/text outside browser'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_drag} onChange={() => handleToggle('prot_drag')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Perlindungan Keyboard' : 'Keyboard Protection'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Ctrl+C / Ctrl+X' : 'Block Copy & Cut'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah shortcut salin dan potong teks' : 'Disable Ctrl+C and Ctrl+X actions'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_copy} onChange={() => handleToggle('prot_copy')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Ctrl+U (View Source)' : 'Block View Source'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah pembukaan kode sumber halaman' : 'Disable browser source inspect shortcut'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_viewsource} onChange={() => handleToggle('prot_viewsource')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir Ctrl+S / Ctrl+P' : 'Block Save / Print'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah simpan dan cetak halaman' : 'Disable webpage saving/printing'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_saveprint} onChange={() => handleToggle('prot_saveprint')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Blokir F12 & DevTools' : 'Block F12 & DevTools Key'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Cegah pembukaan Developer Tools browser' : 'Disable keyboard developer console keys'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_devtools} onChange={() => handleToggle('prot_devtools')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Deteksi & Watermark' : 'Detection & Watermark'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Deteksi DevTools Terbuka' : 'Detect Open DevTools'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Tampilkan halaman blokir jika DevTools aktif' : 'Lock browser window if dev console opens'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_devdetect} onChange={() => handleToggle('prot_devdetect')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Watermark Transparan' : 'Transparent Watermark'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Pola watermark tidak terlihat di atas halaman' : 'Enable overlay brand markings'}</div>
                  </div>
                  <label className={styles.stToggle}>
                    <input type="checkbox" checked={settings.prot_watermark} onChange={() => handleToggle('prot_watermark')} />
                    <span className={styles.stTrack}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── DATA PANEL ── */}
          {tab === 'data' && (
            <div className={`${styles.stPanel} ${styles.active}`}>
              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Ringkasan Penyimpanan' : 'Storage Summary'}</div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Data Ikan Tersimpan' : 'Saved Fish Entries'}</span>
                  <span className={styles.stAboutVal}>{fishList.length} {lang === 'id' ? 'baris' : 'rows'}</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Log Aktivitas' : 'Activity Logs'}</span>
                  <span className={styles.stAboutVal}>{logsCount} {lang === 'id' ? 'log' : 'logs'}</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Riwayat Harian' : 'Daily History'}</span>
                  <span className={styles.stAboutVal}>{histCount} {lang === 'id' ? 'hari' : 'days'}</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Estimasi Ukuran' : 'Estimated JSON Size'}</span>
                  <span className={styles.stAboutVal}>{sizeEst}</span>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Ekspor Data' : 'Export Data'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Ekspor Data Ikan (JSON)' : 'Export Fish Data (JSON)'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Unduh semua data ikan sebagai file JSON' : 'Download fish logs as JSON'}</div>
                  </div>
                  <button className={styles.stBtnOutline} onClick={exportFish}>
                    ⬇ {lang === 'id' ? 'Ekspor' : 'Export'}
                  </button>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Ekspor Riwayat Harian' : 'Export Daily History'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Unduh histori harian sebagai file JSON' : 'Download history metrics as JSON'}</div>
                  </div>
                  <button className={styles.stBtnOutline} onClick={exportHistory}>
                    ⬇ {lang === 'id' ? 'Ekspor' : 'Export'}
                  </button>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Ekspor Pengaturan' : 'Export Settings'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Unduh konfigurasi pengaturan saat ini' : 'Download settings backup as JSON'}</div>
                  </div>
                  <button className={styles.stBtnOutline} onClick={exportSettings}>
                    ⬇ {lang === 'id' ? 'Ekspor' : 'Export'}
                  </button>
                </div>
              </div>

              <div className={`${styles.stSection} ${styles.danger}`}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Zona Berbahaya' : 'Danger Zone'}</div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Hapus Log Aktivitas' : 'Clear Activity Logs'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Bersihkan semua riwayat aktivitas akun' : 'Delete all log trails permanently'}</div>
                  </div>
                  <button className={styles.stBtnDanger} onClick={() => handleDanger('clearLogs')}>{lang === 'id' ? '🗑 Hapus' : '🗑 Delete'}</button>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Hapus Riwayat Harian' : 'Clear Daily History'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Bersihkan semua data historis tersimpan' : 'Delete all custom day projections'}</div>
                  </div>
                  <button className={styles.stBtnDanger} onClick={() => handleDanger('clearHist')}>{lang === 'id' ? '🗑 Hapus' : '🗑 Delete'}</button>
                </div>
                <div className={styles.stRow}>
                  <div className={styles.stRowInfo}>
                    <div className={styles.stRowLabel}>{lang === 'id' ? 'Reset Semua Pengaturan' : 'Reset All Settings'}</div>
                    <div className={styles.stRowDesc}>{lang === 'id' ? 'Restore all settings to default' : 'Revert display & protection toggles'}</div>
                  </div>
                  <button className={styles.stBtnDanger} onClick={() => handleDanger('resetAll')}>{lang === 'id' ? '↺ Reset' : '↺ Reset'}</button>
                </div>
              </div>
            </div>
          )}

          {/* ── TENTANG PANEL ── */}
          {tab === 'tentang' && (
            <div className={`${styles.stPanel} ${styles.active}`}>
              <div className={styles.stSection}>
                <div className={styles.stAboutLogo}>
                  <div className={styles.stAboutIcon}>🌿</div>
                  <div className={styles.stAboutName}>Natural Reserve</div>
                  <div className={styles.stAboutVer}>Fish Feeding Calculator • v2.0.0</div>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Versi' : 'Version'}</span>
                  <span className={styles.stAboutVal}>2.0.0 (Stable Next.js)</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>Platform</span>
                  <span className={styles.stAboutVal}>Next.js 14 / React / TS</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Penyimpanan' : 'Storage'}</span>
                  <span className={styles.stAboutVal}>Cloud Firestore & Auth</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>Browser</span>
                  <span className={styles.stAboutVal}>{browserInfo || '—'}</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Resolusi Layar' : 'Screen Resolution'}</span>
                  <span className={styles.stAboutVal}>{screenInfo || '—'}</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey}>{lang === 'id' ? 'Zona Waktu' : 'Time Zone'}</span>
                  <span className={styles.stAboutVal}>{tzInfo || '—'}</span>
                </div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Teknologi' : 'Technologies'}</div>
                <div className={styles.stAboutRow}><span className={styles.stAboutKey}>Font</span><span className={styles.stAboutVal}>Syne, DM Sans, DM Mono</span></div>
                <div className={styles.stAboutRow}><span className={styles.stAboutKey}>{lang === 'id' ? 'Animasi' : 'Animation'}</span><span className={styles.stAboutVal}>CSS Keyframes</span></div>
                <div className={styles.stAboutRow}><span className={styles.stAboutKey}>{lang === 'id' ? 'Ikon' : 'Icons'}</span><span className={styles.stAboutVal}>Inline SVG (Lucide)</span></div>
                <div className={styles.stAboutRow}><span className={styles.stAboutKey}>Framework</span><span className={styles.stAboutVal}>React 18 & NextJS App Router</span></div>
              </div>

              <div className={styles.stSection}>
                <div className={styles.stSectionTitle}>{lang === 'id' ? 'Riwayat Versi' : 'Version History'}</div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey} style={{ color: 'var(--teal3)', fontFamily: "'DM Mono',monospace" }}>v2.0.0</span>
                  <span className={styles.stAboutVal} style={{ color: 'var(--mist)' }}>Migrated to Next.js + Settings & Protection Modal</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey} style={{ color: 'var(--mist)', fontFamily: "'DM Mono',monospace" }}>v1.5.0</span>
                  <span className={styles.stAboutVal} style={{ color: 'var(--mist)' }}>Profil akun, aktivitas, ganti password</span>
                </div>
                <div className={styles.stAboutRow}>
                  <span className={styles.stAboutKey} style={{ color: 'var(--mist)', fontFamily: "'DM Mono',monospace" }}>v1.0.0</span>
                  <span className={styles.stAboutVal} style={{ color: 'var(--mist)' }}>Rilis perdana: kalkulator pakan & FCR</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.stFooter}>
          <div className={styles.stFooterNote}>{lang === 'id' ? 'Perubahan disimpan otomatis' : 'Changes saved automatically'}</div>
          <button className={styles.stBtnPrimary} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {lang === 'id' ? 'Selesai' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
}
