'use client';
import { useState, useMemo, useEffect } from 'react';
import styles from '@/styles/dashboard.module.css';
import { PHASE_DEFS, getPhaseForDay } from '@/lib/fr-database';
import type { Fish, DailyRow } from '@/types';

interface Props {
  fish: Fish[];
  lang: 'id' | 'en';
}

const PAGE_SIZE = 10;

function buildDailyRows(totalBiomass0: number, totalCount: number, days: number, mortPct: number, fcrActual: number): DailyRow[] {
  const rows: DailyRow[] = [];
  const startDate = new Date();
  let cumFeed = 0; // gram
  let biomassNow = totalBiomass0;
  const avgWeightInit = totalCount > 0 ? totalBiomass0 / totalCount : 0;
  const mortTotal = Math.round(totalCount * mortPct / 100);
  const mortPerDay = mortTotal / days;
  let countNow = totalCount;

  for (let d = 1; d <= days; d++) {
    const phase = getPhaseForDay(d, days);
    const fr = phase.fr;
    const pakanToday = biomassNow * fr; // gram
    cumFeed += pakanToday;
    biomassNow += biomassNow * phase.growthRate; // simple daily growth
    countNow -= mortPerDay;
    const weightNow = countNow > 0 ? biomassNow / countNow : 0;
    const abw = weightNow - avgWeightInit; // absolute body weight gain
    const cumFeedKg = cumFeed / 1000;
    const biomassGainKg = (biomassNow - totalBiomass0) / 1000;
    const fcrCum = biomassGainKg > 0 ? cumFeedKg / biomassGainKg : 0;
    
    // If actual FCR is provided override theoretical at the end
    const fcrDisplay = (fcrActual > 0 && d === days) ? fcrActual : fcrCum;

    const dt = new Date(startDate);
    dt.setDate(dt.getDate() + d - 1);
    const dateStr = dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

    rows.push({
      day: d,
      dateStr,
      phase: phase.name,
      phaseColor: phase.color,
      biomass: biomassNow,
      fr: `${(fr * 100).toFixed(1)}%`,
      pakanToday,
      cumFeedKg,
      weightNow,
      abw,
      fcrCum: fcrCum.toFixed(3),
      fcrDisplay: fcrDisplay.toFixed(3),
    });
  }
  return rows;
}

function aggregateWeekly(rows: DailyRow[]): DailyRow[] {
  const weeks: Record<number, DailyRow> = {};
  rows.forEach(r => {
    const wk = Math.ceil((r.day as number) / 7);
    if (!weeks[wk]) {
      weeks[wk] = { ...r, day: `W${wk}`, dateStr: `Week ${wk}`, pakanToday: 0 };
    }
    weeks[wk].pakanToday += r.pakanToday;
    weeks[wk].cumFeedKg = r.cumFeedKg;
    weeks[wk].fcrCum = r.fcrCum;
    weeks[wk].fcrDisplay = r.fcrDisplay;
    weeks[wk].biomass = r.biomass;
    weeks[wk].weightNow = r.weightNow;
    weeks[wk].abw = r.abw;
    weeks[wk].fr = r.fr;
    weeks[wk].phase = r.phase;
    weeks[wk].phaseColor = r.phaseColor;
  });
  return Object.values(weeks);
}

export default function FcrSection({ fish, lang }: Props) {
  const [days, setDays] = useState(60);
  const [targetWeight, setTargetWeight] = useState(500);
  const [fcrActual, setFcrActual] = useState(0);
  const [mortPct, setMortPct] = useState(5);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [page, setPage] = useState(0);
  const [searchDay, setSearchDay] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  const id = lang === 'id';

  // ⚠️ Hooks must be called unconditionally — compute derived values first
  const totalBiomass = fish.reduce((s, f) => s + f.biomass, 0);
  const totalCount = fish.reduce((s, f) => s + f.qty, 0);
  const totalPakanDay = fish.reduce((s, f) => s + f.pakanDay, 0);

  const dailyRows = useMemo(() => {
    if (fish.length === 0) return [];
    return buildDailyRows(totalBiomass, totalCount, days, mortPct, fcrActual);
  }, [fish.length, totalBiomass, totalCount, days, mortPct, fcrActual]);

  const displayRows = useMemo(() => {
    return viewMode === 'weekly' ? aggregateWeekly(dailyRows) : dailyRows;
  }, [dailyRows, viewMode]);

  const filteredRows = useMemo(() => {
    return displayRows.filter(r => {
      const matchDay = !searchDay || String(r.day).toLowerCase().includes(searchDay.toLowerCase()) || r.dateStr.toLowerCase().includes(searchDay.toLowerCase());
      const matchPhase = !phaseFilter || r.phase === phaseFilter;
      return matchDay && matchPhase;
    });
  }, [displayRows, searchDay, phaseFilter]);

  // ⚠️ useEffect MUST also be before the early return
  useEffect(() => {
    const handleTrigger = () => {
      if (!dailyRows.length) {
        alert('⚠️ Generate data FCR dulu');
        return;
      }
      const header = 'Hari,Tanggal,Fase,Biomassa(g),FR(%),Pakan Hari Ini(g),Akum. Pakan(kg),Pertambahan Berat(g),FCR Akumulatif';
      const rows = dailyRows.map(r =>
        `${r.day},"${r.dateStr}","${r.phase}",${Math.round(r.biomass)},${r.fr},${r.pakanToday.toFixed(0)},${r.cumFeedKg.toFixed(3)},${r.abw.toFixed(2)},${r.fcrDisplay}`
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fcr-summary-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    window.addEventListener('triggerExportFCR', handleTrigger);
    return () => window.removeEventListener('triggerExportFCR', handleTrigger);
  }, [dailyRows]);

  // Early return AFTER ALL hooks (useState + useMemo + useEffect)
  if (fish.length === 0) return null;

  // Derived values (not hooks — safe after early return)
  const lastRow = dailyRows[dailyRows.length - 1];
  const totalFeedKg = lastRow ? lastRow.cumFeedKg : 0;
  const harvestBiomass = lastRow ? lastRow.biomass / 1000 : 0;
  const mortCount = Math.round(totalCount * mortPct / 100);
  const avgFeedDay = totalFeedKg > 0 ? (totalFeedKg * 1000 / days) : totalPakanDay;
  const fcrFinal = fcrActual > 0 ? fcrActual : (lastRow ? parseFloat(lastRow.fcrCum) : 0);

  let fcrStatusLabel = '✗ Poor';
  let fcrStatusClass = 'bad';
  if (fcrFinal < 1.4) { fcrStatusLabel = '✓ Excellent'; fcrStatusClass = 'good'; }
  else if (fcrFinal < 2) { fcrStatusLabel = '✓ Good'; fcrStatusClass = 'ok'; }
  else if (fcrFinal < 2.5) { fcrStatusLabel = '⚠ Fair'; fcrStatusClass = 'warn'; }

  const maxPakan = displayRows.length > 0 ? Math.max(...displayRows.map(r => r.pakanToday)) : 0;
  const maxFcrCum = displayRows.length > 0 ? Math.max(...displayRows.map(r => parseFloat(r.fcrCum))) : 0;

  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Phase timeline
  const phase1Days = Math.round(days * 0.15);
  const phase2Days = Math.round(days * 0.25);
  const phase3Days = Math.round(days * 0.35);
  const phase4Days = days - phase1Days - phase2Days - phase3Days;

  return (
    <div className={styles.fcrSection}>
      <div className={styles.fcrSectionTitle}>
        📈 {id ? 'Summary Harian & FCR Masa Budidaya' : 'FCR Projection & Daily Feed'}
      </div>

      {/* Config */}
      <div className={styles.fcrConfig}>
        <div className={styles.fcrConfigGroup}>
          <span className={styles.fcrConfigLabel}>🗓️ {id ? 'Durasi Budidaya (Hari)' : 'Duration (days)'}</span>
          <input
            className={styles.formInput}
            type="number" min="7" max="365" step="1"
            value={days}
            onChange={(e) => { setDays(parseInt(e.target.value) || 60); setPage(0); }}
            style={{ fontSize: 14, padding: '9px 12px', maxWidth: 120 }}
          />
        </div>
        <div className={styles.fcrConfigGroup}>
          <span className={styles.fcrConfigLabel}>📈 {id ? 'Target Harvest Weight (g/fish)' : 'Target Weight (g)'}</span>
          <input
            className={styles.formInput}
            type="number" min="1" step="1"
            value={targetWeight}
            onChange={(e) => setTargetWeight(parseInt(e.target.value) || 500)}
            style={{ fontSize: 14, padding: '9px 12px', maxWidth: 140 }}
          />
        </div>
        <div className={styles.fcrConfigGroup}>
          <span className={styles.fcrConfigLabel}>⚖️ {id ? 'FCR Aktual (input manual)' : 'Actual FCR (manual input)'}</span>
          <input
            className={styles.formInput}
            type="number" min="0" step="0.01"
            placeholder="e.g. 1.4"
            value={fcrActual || ''}
            onChange={(e) => setFcrActual(parseFloat(e.target.value) || 0)}
            style={{ fontSize: 14, padding: '9px 12px', maxWidth: 120 }}
          />
        </div>
        <div className={styles.fcrConfigGroup}>
          <span className={styles.fcrConfigLabel}>💀 {id ? 'Estimasi Mortalitas (%)' : 'Mortality Estimate (%)'}</span>
          <input
            className={styles.formInput}
            type="number" min="0" max="100" step="0.5"
            value={mortPct}
            onChange={(e) => setMortPct(parseFloat(e.target.value) || 0)}
            style={{ fontSize: 14, padding: '9px 12px', maxWidth: 120 }}
          />
        </div>
        <div className={styles.fcrConfigGroup}>
          <span className={styles.fcrConfigLabel}>📊 {id ? 'Tampilkan per' : 'View by'}</span>
          <select
            className={styles.formSelect}
            value={viewMode}
            onChange={(e) => { setViewMode(e.target.value as 'daily'|'weekly'); setPage(0); }}
            style={{ fontSize: 13, padding: '8px 12px', maxWidth: 150 }}
          >
            <option value="daily">{id ? 'Harian' : 'Daily'}</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.fcrKpiStrip}>
        <div className={`${styles.fcrKpi} ${styles.accentTeal}`} data-icon="🐟">
          <div className={styles.fcrKpiLabel}>{id ? 'Total Feed Masa Budidaya' : 'Total Feed'}</div>
          <div className={styles.fcrKpiValue}>{totalFeedKg.toFixed(2)}</div>
          <div className={styles.fcrKpiSub}>kilogram</div>
        </div>
        <div className={`${styles.fcrKpi} ${styles.accentAmber}`} data-icon="⚖️">
          <div className={styles.fcrKpiLabel}>FCR Estimasi</div>
          <div className={styles.fcrKpiValue}>{fcrFinal.toFixed(2)}</div>
          <div className={`${styles.fcrBadge} ${styles[fcrStatusClass]}`}>{fcrStatusLabel}</div>
        </div>
        <div className={`${styles.fcrKpi} ${styles.accentLime}`} data-icon="📈">
          <div className={styles.fcrKpiLabel}>{id ? 'Estimated Harvest Biomass' : 'Estimated Harvest Biomass'}</div>
          <div className={styles.fcrKpiValue}>{harvestBiomass.toFixed(2)}</div>
          <div className={styles.fcrKpiSub}>kilogram</div>
        </div>
        <div className={`${styles.fcrKpi} ${styles.accentCoral}`} data-icon="💀">
          <div className={styles.fcrKpiLabel}>{id ? 'Estimasi Mortalitas' : 'Mortality Estimate'}</div>
          <div className={styles.fcrKpiValue}>{mortCount.toLocaleString('id-ID')}</div>
          <div className={styles.fcrKpiSub}>fish</div>
        </div>
        <div className={`${styles.fcrKpi} ${styles.accentIndigo}`} data-icon="🗓️">
          <div className={styles.fcrKpiLabel}>{id ? 'Feed / Day (avg)' : 'Feed / Day (avg)'}</div>
          <div className={styles.fcrKpiValue}>{avgFeedDay.toFixed(1)}</div>
          <div className={styles.fcrKpiSub}>gram / day</div>
        </div>
      </div>



      {/* Daily Table */}
      <div className={styles.panel} style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className={styles.panelTitle} style={{ margin: 0 }}>
            {id ? 'Tabel Summary Per Hari' : 'Tabel Summary Per Hari'}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className={styles.formInput}
              type="text"
              placeholder="Search day..."
              value={searchDay}
              onChange={(e) => { setSearchDay(e.target.value); setPage(0); }}
              style={{ maxWidth: 130, fontSize: 12, padding: '6px 10px' }}
            />
            <select
              className={styles.formSelect}
              value={phaseFilter}
              onChange={(e) => { setPhaseFilter(e.target.value); setPage(0); }}
              style={{ maxWidth: 160, fontSize: 12, padding: '6px 10px' }}
            >
              <option value="">All Phases</option>
              <option value="Pendederan">Nursery</option>
              <option value="Pembesaran I">Growth I</option>
              <option value="Pembesaran II">Growth II</option>
              <option value="Pembesaran III">Growth III</option>
            </select>
          </div>
        </div>
        <div className={styles.dailyTableWrap}>
          <table className={styles.dailyTable}>
            <thead>
              <tr>
                <th>Hari ke-</th>
                <th>Tanggal</th>
                <th>Phase</th>
                <th>Biomass (g)</th>
                <th>FR (%)</th>
                <th>Feed Today</th>
                <th>Cum. Feed (kg)</th>
                <th>Weight Gain</th>
                <th>FCR Akumulatif</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--mist)', fontSize: 12 }}>No data to display.</td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const barPct = maxPakan > 0 ? (r.pakanToday / maxPakan * 100) : 0;
                  return (
                    <tr key={r.day}>
                      <td style={{ color: 'var(--teal3)', fontWeight: 600 }}>{r.day}</td>
                      <td style={{ color: 'var(--mist)' }}>{r.dateStr}</td>
                      <td>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${r.phaseColor}22`, color: r.phaseColor, border: `1px solid ${r.phaseColor}44` }}>
                          {r.phase}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1' }}>{Math.round(r.biomass).toLocaleString('en-US')}</td>
                      <td style={{ color: 'var(--teal3)' }}>{r.fr}</td>
                      <td>
                        <div className={styles.inlineBar}>
                          <div className={styles.inlineBarTrack}><div className={styles.inlineBarFill} style={{ width: `${barPct}%` }} /></div>
                          <span className={styles.inlineBarVal}>{(r.pakanToday/1000).toFixed(3)} kg</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--amber)', fontWeight: 500 }}>{r.cumFeedKg.toFixed(3)} kg</td>
                      <td style={{ color: '#a5b4fc' }}>+{r.abw.toFixed(1)} g</td>
                      <td style={{ color: parseFloat(r.fcrCum) < 2 ? 'var(--lime)' : 'var(--coral)', fontWeight: 600 }}>
                        {r.fcrDisplay}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className={styles.pagination}>
            <button className={`${styles.pgBtn}`} disabled={page === 0} onClick={() => setPage(0)}>«</button>
            <button className={`${styles.pgBtn}`} disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
            {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
              const pg = Math.max(0, Math.min(pageCount - 5, page - 2)) + i;
              return (
                <button key={pg} className={`${styles.pgBtn} ${pg === page ? styles.active : ''}`} onClick={() => setPage(pg)}>
                  {pg + 1}
                </button>
              );
            })}
            <button className={`${styles.pgBtn}`} disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>›</button>
            <button className={`${styles.pgBtn}`} disabled={page >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>»</button>
            <span className={styles.pgInfo}>{id ? `Halaman ${page + 1} dari ${pageCount}` : `Page ${page + 1} of ${pageCount}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
