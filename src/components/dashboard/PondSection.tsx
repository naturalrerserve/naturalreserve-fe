'use client';
import { useState } from 'react';
import styles from '@/styles/dashboard.module.css';
import type { Fish } from '@/types';

interface Props { fish: Fish[]; lang: 'id' | 'en'; }

const POND_PRESETS = [
  { label: 'Outdoor Ø7.4m × 48', type: 'Outdoor', diam: 7.4, height: 1, count: 48 },
  { label: 'Indoor Ø2m × 20',    type: 'Indoor',  diam: 2.0, height: 1, count: 20 },
  { label: 'Indoor Ø5.3m × 1',   type: 'Indoor',  diam: 5.3, height: 1, count: 1  },
];

const FISH_RECO = [
  { stage: 'Larva / Fry',  weightMin: 0.01, weightMax: 1,    densityIdeal: 50, frNote: 'High FR 10-15%, micro feed' },
  { stage: 'Nursery',      weightMin: 1,    weightMax: 10,   densityIdeal: 40, frNote: 'FR 5-10%, close monitoring' },
  { stage: 'Growth I',     weightMin: 10,   weightMax: 50,   densityIdeal: 35, frNote: 'FR 3-5%, adequate aeration' },
  { stage: 'Growth II',    weightMin: 50,   weightMax: 200,  densityIdeal: 30, frNote: 'FR 2-3%, intensive standard' },
  { stage: 'Growth III',   weightMin: 200,  weightMax: 500,  densityIdeal: 20, frNote: 'FR 1-2%, needs more space' },
  { stage: 'Market Size',  weightMin: 500,  weightMax: 1500, densityIdeal: 15, frNote: 'FR 1-1.5%, ready to harvest' },
];

function calcVol(diam: number, height: number) {
  return Math.PI * Math.pow(diam / 2, 2) * height;
}

export default function PondSection({ fish, lang }: Props) {
  const [preset, setPreset] = useState<number | null>(0);
  const [diam,       setDiam]       = useState(String(POND_PRESETS[0].diam));
  const [height,     setHeight]     = useState(String(POND_PRESETS[0].height));
  const [count,      setCount]      = useState(String(POND_PRESETS[0].count));
  const [density,    setDensity]    = useState('30');
  const [manualFish, setManualFish] = useState('');
  const [pondType,   setPondType]   = useState(POND_PRESETS[0].type);

  const id = lang === 'id';

  /* ── All hooks called before early return ── */
  const dNum   = parseFloat(diam)   || 0;
  const hNum   = parseFloat(height) || 0;
  const cNum   = parseInt(count)    || 1;
  const denNum = parseInt(density)  || 30;
  const vol    = calcVol(dNum, hNum);
  const mFish  = manualFish ? parseInt(manualFish) : null;
  const cap    = (mFish && mFish > 0) ? mFish : Math.floor(vol * denNum);
  const totVol  = vol  * cNum;
  const totFish = cap  * cNum;

  if (fish.length === 0) return null;

  const applyPreset = (i: number | null) => {
    setPreset(i);
    if (i !== null) {
      const p = POND_PRESETS[i];
      setDiam(String(p.diam));
      setHeight(String(p.height));
      setCount(String(p.count));
      setPondType(p.type);
    }
  };

  const inputStyle: React.CSSProperties = { fontSize: 14, padding: '9px 12px', width: '100%', boxSizing: 'border-box' };
  const unitBadge: React.CSSProperties = {
    background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)',
    borderLeft: 'none', borderRadius: '0 8px 8px 0', padding: '0 12px',
    color: 'var(--teal3)', fontSize: 12, fontFamily: "'Syne', sans-serif",
    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  };
  const inputWithUnit = (
    val: string,
    onChange: (v: string) => void,
    unit: string,
    type = 'number',
    placeholder = '',
  ) => (
    <div style={{ display: 'flex' }}>
      <input
        className={styles.formInput}
        type={type}
        step="any"
        value={val}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, borderRadius: '8px 0 0 8px', borderRight: 'none', flex: 1 }}
      />
      <span style={unitBadge}>{unit}</span>
    </div>
  );

  return (
    <div className={styles.pondSection}>
      {/* Section Title */}
      <div className={styles.pondSectionTitle}>
        🌊 {id ? 'Pond Calculator & Fish Density' : 'Pond Calculator & Fish Density'}
      </div>

      {/* Preset Chips Bar */}
      <div className={styles.pondPresetBar}>
        <span style={{ fontSize: 11, color: 'var(--mist)', fontFamily: "'Syne',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {id ? 'Pond preset:' : 'Pond preset:'}
        </span>
        {POND_PRESETS.map((p, i) => (
          <button
            key={i}
            className={`${styles.pondPresetChip} ${preset === i ? styles.active : ''}`}
            onClick={() => applyPreset(i)}
          >
            {i === 0 ? '🌿' : '🏠'} {p.label}
          </button>
        ))}
        <button
          className={`${styles.pondPresetChip} ${preset === null ? styles.active : ''}`}
          onClick={() => applyPreset(null)}
        >
          ✏️ {id ? 'Kustom' : 'Custom'}
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className={styles.pondMainGrid}>

        {/* ── LEFT COLUMN: Form ── */}
        <div className={styles.pondFormCol}>
          <div className={styles.panelTitle} style={{ fontSize: 12, marginBottom: 14 }}>
            📋 {id ? 'Pond Parameters' : 'Pond Parameters'}
          </div>

          {/* Pond Type */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>{id ? 'Tipe Kolam' : 'Pond Type'}</label>
            <select
              className={styles.formSelect}
              value={pondType}
              onChange={(e) => { setPondType(e.target.value); setPreset(null); }}
              style={{ ...inputStyle }}
            >
              <option value="Outdoor">🌿 Outdoor</option>
              <option value="Indoor">🏠 Indoor</option>
            </select>
          </div>

          {/* Diameter */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>{id ? 'Diameter (m)' : 'Diameter (m)'}</label>
            {inputWithUnit(diam, (v) => { setDiam(v); setPreset(null); }, 'm')}
          </div>

          {/* Water Depth */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>{id ? 'Kedalaman Air (m)' : 'Water Depth (m)'}</label>
            {inputWithUnit(height, (v) => { setHeight(v); setPreset(null); }, 'm')}
          </div>

          {/* Number of Ponds */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>{id ? 'Jumlah Kolam' : 'Number of Ponds'}</label>
            {inputWithUnit(count, (v) => { setCount(v); setPreset(null); }, id ? 'kolam' : 'ponds')}
          </div>

          {/* Stocking Density */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>{id ? 'Kepadatan Tebar (ekor/m³)' : 'Stocking Density (fish/m³)'}</label>
            {inputWithUnit(density, setDensity, 'fish/m³')}
            <div style={{ fontSize: 10, color: 'var(--mist)', marginTop: 5, lineHeight: 1.5 }}>
              💡 Standard: 30 fish/m³. Reduce 20% if aeration is limited. Circle pond = Volume: π × (r²) × h
            </div>
          </div>

          {/* Fish per Pond Manual Override */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              🐟 {id ? 'Fish per Pond (manual override)' : 'Fish per Pond (manual override)'}
            </label>
            {inputWithUnit(manualFish, setManualFish, 'fish', 'number', 'Leave empty for auto')}
            <div style={{ fontSize: 10, color: 'var(--mist)', marginTop: 4 }}>
              {id ? 'Kosongkan untuk kalkulasi otomatis.' : 'Leave blank to use automatic calculation.'}
            </div>
          </div>

          {/* Auto Fish Count Summary */}
          <div className={styles.pondFishAuto}>
            <div className={styles.pondFishAutoTitle}>⚡ Auto Fish Count</div>
            <div className={styles.pondFishAutoRow}>
              <span>Pond Volume</span>
              <span className={styles.pondFishAutoVal}>{vol.toFixed(2)} m³</span>
            </div>
            <div className={styles.pondFishAutoRow}>
              <span>Capacity / Pond</span>
              <span className={styles.pondFishAutoVal}>{cap.toLocaleString('en-US')} fish</span>
            </div>
            <div className={styles.pondFishAutoRow} style={{ borderBottom: 'none' }}>
              <span style={{ fontWeight: 600, color: '#e0f7f4' }}>Total Fish All Ponds</span>
              <span className={styles.pondFishAutoVal} style={{ fontSize: 16, fontWeight: 700 }}>
                {totFish.toLocaleString('en-US')} fish
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: KPIs + Recommendations ── */}
        <div className={styles.pondRightCol}>
          {/* KPI Cards */}
          <div className={styles.pondResultGrid}>
            <div className={`${styles.pondKpi} ${styles.pTeal}`}>
              <div className={styles.pondKpiLabel}>Volume / Pond</div>
              <div className={styles.pondKpiValue}>{vol.toFixed(2)}</div>
              <div className={styles.pondKpiSub}>m³</div>
            </div>
            <div className={`${styles.pondKpi} ${styles.pAmber}`}>
              <div className={styles.pondKpiLabel}>Capacity / Pond</div>
              <div className={styles.pondKpiValue}>{cap.toLocaleString('en-US')}</div>
              <div className={styles.pondKpiSub}>fish</div>
            </div>
            <div className={`${styles.pondKpi} ${styles.pIndigo}`}>
              <div className={styles.pondKpiLabel}>Total All Ponds</div>
              <div className={styles.pondKpiValue}>{totFish.toLocaleString('en-US')}</div>
              <div className={styles.pondKpiSub}>fish</div>
            </div>
            <div className={`${styles.pondKpi} ${styles.pLime}`}>
              <div className={styles.pondKpiLabel}>Total Volume</div>
              <div className={styles.pondKpiValue}>{totVol.toFixed(2)}</div>
              <div className={styles.pondKpiSub}>m³</div>
            </div>
          </div>

          {/* Fish Weight Recommendations */}
          {vol > 0 && cap > 0 && (
            <div className={styles.pondRecoPanel}>
              <div className={styles.panelTitle} style={{ fontSize: 12, marginBottom: 10 }}>
                🐠 {id ? 'Rekomendasi Berat Ikan' : 'Fish Weight Recommendations'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--mist)', marginBottom: 10 }}>
                Volume: <b style={{ color: 'var(--teal3)' }}>{vol.toFixed(2)} m³</b>
                {' '}| Capacity: <b style={{ color: 'var(--amber)' }}>{cap.toLocaleString('en-US')} fish</b>
                {' '}| Density: <b style={{ color: 'var(--lime)' }}>{denNum} fish/m³</b>
              </div>
              <div className={styles.pondRecoList}>
                {FISH_RECO.map((r, i) => {
                  const isIdeal = denNum <= r.densityIdeal;
                  const bMin = (cap * r.weightMin / 1000).toFixed(1);
                  const bMax = (cap * r.weightMax / 1000).toFixed(1);
                  return (
                    <div key={i} className={styles.recoRow}>
                      <div>
                        <div className={styles.recoStage}>{r.stage}</div>
                        <div style={{ fontSize: 10, color: 'var(--mist)', marginTop: 2 }}>{r.frNote}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className={styles.recoWeight}>{r.weightMin}–{r.weightMax} g/fish</div>
                        <div className={styles.recoPakan}>Biomass: {bMin}–{bMax} kg</div>
                        <div style={{ marginTop: 3 }}>
                          {isIdeal
                            ? <span className={`${styles.recoBadge} ${styles.ok}`}>✓ Ideal</span>
                            : <span className={`${styles.recoBadge} ${styles.warn}`}>⚠ Padat</span>
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ALL POND SUMMARY TABLE ── */}
      <div className={styles.pondSummarySection}>
        <div className={styles.panelTitle} style={{ fontSize: 12, marginBottom: 12 }}>
          ⚡ {id ? 'All Pond Summary (Your Aquaculture Facility)' : 'All Pond Summary (Your Aquaculture Facility)'}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.dailyTable}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Diameter</th>
                <th>Depth</th>
                <th>Vol/Pond</th>
                <th>Ponds</th>
                <th>Cap/Pond</th>
                <th>Total Fish</th>
                <th>Total Volume</th>
              </tr>
            </thead>
            <tbody>
              {POND_PRESETS.map((p, i) => {
                const pVol   = calcVol(p.diam, p.height);
                const pCap   = Math.floor(pVol * denNum);
                const pTFish = pCap * p.count;
                const pTVol  = pVol * p.count;
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--teal3)' }}>
                      {p.type === 'Outdoor' ? '🌿 Outdoor' : '🏠 Indoor'}
                    </td>
                    <td className={styles.refHighlight}>Ø{p.diam} m</td>
                    <td>{p.height} m</td>
                    <td className={styles.refHighlight}>{pVol.toFixed(2)} m³</td>
                    <td>{p.count}</td>
                    <td style={{ color: 'var(--amber)' }}>{pCap.toLocaleString('en-US')} fish</td>
                    <td style={{ color: 'var(--lime)', fontWeight: 600 }}>{pTFish.toLocaleString('en-US')} fish</td>
                    <td style={{ color: 'var(--mist)' }}>{pTVol.toFixed(1)} m³</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
