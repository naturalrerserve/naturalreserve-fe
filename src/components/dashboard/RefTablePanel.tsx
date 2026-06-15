'use client';
import styles from '@/styles/dashboard.module.css';
import { FR_DB, SPECIES_LABEL, STAGE_LABEL } from '@/lib/fr-database';
import type { FishSpecies, FishStage } from '@/types';

interface Props { lang: 'id' | 'en'; }

const SPECIES_LIST: FishSpecies[] = ['lele', 'nila', 'mas', 'patin', 'gurame', 'bawal', 'udang'];
const STAGE_LIST:   FishStage[]   = ['larva', 'pendederan', 'pembesaran1', 'pembesaran2', 'pembesaran3', 'induk'];

export default function RefTablePanel({ lang }: Props) {
  const id = lang === 'id';

  return (
    <div className={`${styles.panel} ${styles.refPanel}`} style={{ marginTop: 24 }}>
      <div className={styles.panelTitle}>
        📊 {id ? 'Tabel FR Referensi (SNI/FAO)' : 'FR Reference Table (SNI/FAO)'}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.refTable}>
          <thead>
            <tr>
              <th>{id ? 'Jenis Ikan' : 'Species'}</th>
              {STAGE_LIST.map((s) => (
                <th key={s}>{STAGE_LABEL[s]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPECIES_LIST.map((sp) => (
              <tr key={sp}>
                <td className={styles.refHighlight}>{SPECIES_LABEL[sp]}</td>
                {STAGE_LIST.map((st) => {
                  const d = FR_DB[sp][st];
                  return (
                    <td key={st} className={styles.refHighlight}>
                      {d ? d.label : '–'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(148,163,184,.35)', marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
        Sumber: SNI Budidaya, BBPBAT, FAO Fisheries Guidelines
      </div>
    </div>
  );
}
