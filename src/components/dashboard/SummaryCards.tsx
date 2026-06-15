'use client';
import styles from '@/styles/dashboard.module.css';

interface Props {
  totalBiomass: number;
  totalPakan: number;
  totalCount: number;
  lang: 'id' | 'en';
}

export default function SummaryCards({ totalBiomass, totalPakan, totalCount, lang }: Props) {
  /* n masuk dalam gram → tampilkan sebagai g / kg / ton */
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} ton`;
    if (n >= 1_000)    return `${(n / 1_000).toFixed(2)} kg`;
    return `${n.toFixed(1)} g`;
  };

  return (
    <div className={styles.summaryGrid}>
      <div className={styles.sumCard}>
        <div className={styles.sumLabel}>
          {lang === 'id' ? 'Total Biomassa' : 'Total Biomass'}
        </div>
        <div className={`${styles.sumValue} ${totalBiomass ? styles.pulse : ''}`} id="sumBiomass">
          {fmt(totalBiomass)}
        </div>
        <div className={styles.sumUnit}>
          {lang === 'id' ? 'berat total ikan' : 'total fish weight'}
        </div>
      </div>
      <div className={styles.sumCard}>
        <div className={styles.sumLabel}>
          {lang === 'id' ? 'Total Pakan/Hari' : 'Feed/Day'}
        </div>
        <div className={`${styles.sumValue} ${totalPakan ? styles.pulse : ''}`} id="sumPakan">
          {fmt(totalPakan)}
        </div>
        <div className={styles.sumUnit}>
          {lang === 'id' ? 'kebutuhan pakan harian' : 'daily feed requirement'}
        </div>
      </div>
      <div className={styles.sumCard}>
        <div className={styles.sumLabel}>
          {lang === 'id' ? 'Jumlah Ikan' : 'Fish Count'}
        </div>
        <div className={`${styles.sumValue} ${totalCount ? styles.pulse : ''}`} id="sumCount">
          {totalCount.toLocaleString('id-ID')}
        </div>
        <div className={styles.sumUnit}>
          {lang === 'id' ? 'ekor total' : 'total fish'}
        </div>
      </div>
    </div>
  );
}
