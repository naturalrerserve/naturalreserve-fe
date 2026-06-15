'use client';
import { useState } from 'react';
import styles from '@/styles/dashboard.module.css';
import { FR_DB, getFRData, SPECIES_LABEL, STAGE_LABEL } from '@/lib/fr-database';
import type { Fish, FishSpecies, FishStage } from '@/types';

interface Props {
  lang: 'id' | 'en';
  onAdd: (fish: Fish) => void;
  fishCount: number;
}

const SPECIES_LIST: FishSpecies[] = ['lele','nila','mas','patin','gurame','bawal','udang','custom'];
const STAGE_LIST: FishStage[] = ['larva','pendederan','pembesaran1','pembesaran2','pembesaran3','induk'];

export default function FishForm({ lang, onAdd, fishCount }: Props) {
  const [name,      setName]      = useState('');
  const [species,   setSpecies]   = useState<FishSpecies>('lele');
  const [stage,     setStage]     = useState<FishStage>('pembesaran1');
  const [weight,    setWeight]    = useState('');
  const [qty,       setQty]       = useState('');
  const [customFR,  setCustomFR]  = useState('');

  const frData = getFRData(species, stage, Number(customFR));

  const handleAdd = () => {
    const w = parseFloat(weight);
    const q = parseFloat(qty) || 0;
    if (!name.trim() || !w || w <= 0) return;
    if (!(frData || (Number(customFR) > 0))) return;

    const fr = frData ? frData.fr : (Number(customFR) || 3);
    const biomass   = w * q;                   /* gram (weight g × qty ekor) */
    const pakanDay  = (biomass * fr) / 100;    /* gram/hari */

    const fish: Fish = {
      id:        Date.now(),
      name:      name.trim(),
      species,
      stage,
      weight:    w,
      qty:       Math.round(q),
      origQty:   Math.round(q),
      biomass,
      fr,
      frLabel:   frData?.label || `${fr} %`,
      pakanDay,
      freq:      frData?.freq || 3,
      deadLog:   [],
      note:      '',
    };

    onAdd(fish);
    setName(''); setWeight(''); setQty(''); setCustomFR('');
  };

  const id = lang === 'id';

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>
        {id ? '🐟 Data Ikan' : '🐟 Fish Data'}
      </div>

      {/* Name */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{id ? 'Nama / Label Kolam' : 'Name / Tank Label'}</label>
        <input
          className={styles.formInput}
          type="text"
          id="fishName"
          placeholder={id ? 'Contoh: Kolam A — Lele' : 'E.g., Tank A — Catfish'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
      </div>

      {/* Species */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{id ? 'Jenis Ikan' : 'Species'}</label>
        <select
          className={styles.formSelect}
          id="fishSpecies"
          value={species}
          onChange={(e) => setSpecies(e.target.value as FishSpecies)}
        >
          {SPECIES_LIST.map((s) => (
            <option key={s} value={s}>{SPECIES_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Stage */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{id ? 'Fase Budidaya' : 'Growth Stage'}</label>
        <select
          className={styles.formSelect}
          id="fishStage"
          value={stage}
          onChange={(e) => setStage(e.target.value as FishStage)}
        >
          {STAGE_LIST.map((s) => (
            <option key={s} value={s}>{STAGE_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {/* Custom FR */}
      {species === 'custom' && (
        <div className={styles.formRow}>
          <label className={styles.formLabel}>{id ? 'FR Custom (%)' : 'Custom FR (%)'}</label>
          <div className={styles.unitRow}>
            <input
              className={styles.formInput}
              type="number" min="0.1" max="30" step="0.1"
              placeholder="3.5"
              value={customFR}
              onChange={(e) => setCustomFR(e.target.value)}
            />
            <span className={styles.unitBadge}>%</span>
          </div>
        </div>
      )}

      {/* FR Preview */}
      {frData && (
        <div className={styles.frPreview}>
          FR: <strong style={{ color: 'var(--teal3)' }}>{frData.label}</strong>{' '}
          · Frekuensi: <strong style={{ color: '#e0f7f4' }}>{frData.freq}x/hari</strong>
        </div>
      )}

      {/* Weight */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{id ? 'Bobot Rata-rata' : 'Average Weight'}</label>
        <div className={styles.unitRow}>
          <input
            className={styles.formInput}
            type="number" min="0.1" step="0.1"
            id="fishWeight"
            placeholder={id ? 'Misal: 250' : 'E.g.: 250'}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <span className={styles.unitBadge}>gram</span>
        </div>
      </div>

      {/* Qty */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{id ? 'Jumlah Ekor' : 'Fish Count'}</label>
        <div className={styles.unitRow}>
          <input
            className={styles.formInput}
            type="number" min="1" step="1"
            id="fishQty"
            placeholder={id ? 'Misal: 500' : 'E.g.: 500'}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <span className={styles.unitBadge}>{id ? 'ekor' : 'fish'}</span>
        </div>
      </div>

      <button className={styles.btnAdd} onClick={handleAdd} id="btnAdd">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {id ? 'Tambah Ikan' : 'Add Fish'}
      </button>
    </div>
  );
}
