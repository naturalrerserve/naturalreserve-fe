'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
import styles from '@/styles/dashboard.module.css';
import type { Fish, HistoryEntry, UserProfile } from '@/types';
import { auth } from '@/lib/firebase';
import { nrSaveHistoryEntry, nrLoadHistory, nrDeleteAllHistory } from '@/lib/firebase-data';

interface Props {
  fish: Fish[];
  lang: 'id' | 'en';
  showToast: (msg: string) => void;
  user: UserProfile | null;
}

type Period = 'today' | 'yesterday' | '3d' | '1w' | '2w' | '1m' | 'all';

export default function HistorySection({ fish, lang, showToast, user }: Props) {
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({});
  const [loaded, setLoaded] = useState(false);
  const [chip, setChip] = useState<Period>('today');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const id = lang === 'id';

  const loadHistory = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const hist = await nrLoadHistory(uid);
    setHistory(hist);
    setLoaded(true);
  }, []);

  // Auto-load riwayat saat pertama kali komponen mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveLog = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || fish.length === 0) { showToast(id ? '⚠ Tambahkan ikan terlebih dahulu' : '⚠ Add fish first'); return; }
    const dateKey = new Date().toISOString().split('T')[0];
    const entry: HistoryEntry = {
      fish,
      totalBiomass: fish.reduce((s, f) => s + f.biomass, 0),
      totalPakan: fish.reduce((s, f) => s + f.pakanDay, 0),
      totalCount: fish.reduce((s, f) => s + f.qty, 0),
      savedAt: new Date().toISOString(),
    };
    await nrSaveHistoryEntry(uid, dateKey, entry);
    showToast(`✓ ${id ? 'Log tersimpan' : 'Log saved'}: ${dateKey}`);
    await loadHistory();
  }, [fish, id, showToast, loadHistory]);

  useEffect(() => {
    const handleTrigger = () => saveLog();
    window.addEventListener('triggerSaveHistory', handleTrigger);
    return () => window.removeEventListener('triggerSaveHistory', handleTrigger);
  }, [saveLog]);

  const handleCustomSearch = () => {
    if (!dateFrom || !dateTo) {
      showToast('⚠️ Masukkan rentang tanggal');
      return;
    }
    setChip('all'); // custom search overrides chip
  };

  const filteredKeys = useMemo(() => {
    let keys = Object.keys(history).sort((a, b) => b.localeCompare(a));
    const now = new Date();
    
    // Custom Date Range filter
    if (dateFrom && dateTo && chip === 'all') {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime();
      keys = keys.filter(k => {
        const t = new Date(k).getTime();
        return t >= from && t <= to;
      });
      return keys;
    }

    // Chip filter
    keys = keys.filter(k => {
      const entryDate = new Date(k);
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
      switch(chip) {
        case 'today': return diffDays === 0;
        case 'yesterday': return diffDays === 1;
        case '3d': return diffDays <= 3;
        case '1w': return diffDays <= 7;
        case '2w': return diffDays <= 14;
        case '1m': return diffDays <= 30;
        case 'all': return true;
        default: return true;
      }
    });
    return keys;
  }, [history, chip, dateFrom, dateTo]);

  return (
    <div className={styles.histSection}>
      <div className={styles.histSectionTitle}>
        📅 {id ? 'Riwayat & Summary Periode' : 'History & Period Summary'}
      </div>

      <div className={styles.histChips}>
        {(['today', 'yesterday', '3d', '1w', '2w', '1m', 'all'] as Period[]).map((p) => {
          const labels: Record<Period, string> = {
            today: 'Today', yesterday: 'Yesterday', '3d': '3 Days', 
            '1w': '1 Week', '2w': '2 Weeks', '1m': '1 Month', all: 'All'
          };
          return (
            <button 
              key={p} 
              className={`${styles.histChip} ${chip === p && !(dateFrom && dateTo && p === 'all') ? styles.active : ''}`} 
              onClick={() => { setChip(p); setDateFrom(''); setDateTo(''); }}
            >
              {labels[p]}
            </button>
          );
        })}
      </div>

      <div className={styles.histDateRow}>
        <span style={{ fontSize: 11, color: 'var(--mist)', fontWeight: 600 }}>Pilih Tanggal:</span>
        <input 
          className={styles.formInput} 
          type="date" 
          value={dateFrom} 
          onChange={(e) => setDateFrom(e.target.value)} 
          style={{ maxWidth: 160, fontSize: 13, padding: '8px 10px' }} 
        />
        <span style={{ fontSize: 12, color: 'var(--mist)' }}>s/d</span>
        <input 
          className={styles.formInput} 
          type="date" 
          value={dateTo} 
          onChange={(e) => setDateTo(e.target.value)} 
          style={{ maxWidth: 160, fontSize: 13, padding: '8px 10px' }} 
        />
        <button className={styles.btnPeriod} onClick={handleCustomSearch}>🔍 Cari</button>
        <span className={styles.histRangeBadge}>{filteredKeys.length} {id ? 'data' : 'records'}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={styles.btnSaveLog} onClick={saveLog}>
          💾 {id ? "Save Today's Data" : "Save Today's Data"}
        </button>
        {!loaded && (
          <button className={styles.btnPeriod} onClick={loadHistory}>📂 {id ? 'Muat Riwayat' : 'Load History'}</button>
        )}
        <span style={{ fontSize: 11, color: 'var(--mist)' }}>Auto-save active • Data stored in local browser storage (localStorage)</span>
      </div>

      {!loaded ? (
        <div className={styles.histEmpty}>
          <span className={styles.histEmptyIcon}>📂</span>
          {id ? 'Klik "Muat Riwayat" untuk melihat data historis' : 'Click "Load History" to view historical data'}
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className={styles.histEmpty}>
          <span className={styles.histEmptyIcon}>📋</span>
          {id ? `Pilih rentang waktu di atas untuk melihat riwayat.` : `Select a time range above to view history.`}
        </div>
      ) : (
        <div id="histBody">
          {filteredKeys.map((k) => {
            const entry = history[k];
            if (!entry) return null;
            const dateLabel = new Date(k).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            return (
              <div key={k} className={styles.histDayCard}>
                <div className={styles.histDayHeader}>
                  <div className={styles.histDayDate}>📅 {dateLabel}</div>
                  <span className={styles.histDayBadge}>{entry.fish.length} {id ? 'kolam' : 'tanks'}</span>
                </div>
                <div className={styles.histKpiRow}>
                  <div className={styles.histKpi}>
                    <div className={styles.histKpiVal}>
                      {entry.totalBiomass >= 1000
                        ? `${(entry.totalBiomass / 1000).toFixed(2)} kg`
                        : `${entry.totalBiomass.toFixed(0)} g`}
                    </div>
                    <div className={styles.histKpiLbl}>{id ? 'Biomassa' : 'Biomass'}</div>
                  </div>
                  <div className={styles.histKpi}>
                    <div className={styles.histKpiVal}>
                      {entry.totalPakan >= 1000
                        ? `${(entry.totalPakan / 1000).toFixed(2)} kg`
                        : `${entry.totalPakan.toFixed(0)} g`}/hari
                    </div>
                    <div className={styles.histKpiLbl}>{id ? 'Pakan/Hari' : 'Feed/Day'}</div>
                  </div>
                  <div className={styles.histKpi}>
                    <div className={styles.histKpiVal}>{entry.totalCount.toLocaleString('id-ID')}</div>
                    <div className={styles.histKpiLbl}>{id ? 'Jumlah Ikan' : 'Fish Count'}</div>
                  </div>
                </div>
                <div className={styles.histFishList}>
                  {entry.fish.slice(0, 6).map((f, i) => (
                    <span key={i} className={styles.histFishTag}>{f.name} ({f.weight}g)</span>
                  ))}
                  {entry.fish.length > 6 && (
                    <span className={styles.histFishTag}>+{entry.fish.length - 6} {id ? 'lagi' : 'more'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
