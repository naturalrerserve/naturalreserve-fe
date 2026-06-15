'use client';
import styles from '@/styles/dashboard.module.css';
import type { Fish } from '@/types';

interface Props {
  fish: Fish[];
  lang: 'id' | 'en';
}

const MEAL_TIMES_ID = ['06:00', '10:00', '14:00', '17:00', '20:00', '23:00'];
const MEAL_TIMES_EN = ['06:00 AM', '10:00 AM', '02:00 PM', '05:00 PM', '08:00 PM', '11:00 PM'];
const MEAL_NAMES_ID = ['Pagi I', 'Pagi II', 'Siang', 'Sore', 'Malam', 'Dini Hari'];
const MEAL_NAMES_EN = ['Morning I', 'Morning II', 'Noon', 'Afternoon', 'Evening', 'Night'];

export default function SchedulePanel({ fish, lang }: Props) {
  const id = lang === 'id';

  if (fish.length === 0) return null;

  /* Use max freq across all fish */
  const maxFreq = Math.min(6, Math.max(...fish.map((f) => f.freq || 3)));
  const totalPakan = fish.reduce((s, f) => s + f.pakanDay, 0);
  const dose = totalPakan / maxFreq;

  const times = id ? MEAL_TIMES_ID : MEAL_TIMES_EN;
  const names = id ? MEAL_NAMES_ID : MEAL_NAMES_EN;

  return (
    <div className={`${styles.panel} ${styles.schedulePanel}`} style={{ marginTop: 24 }}>
      <div className={styles.panelTitle}>
        🕐 {id ? 'Jadwal Pemberian Pakan' : 'Feeding Schedule'}
      </div>
      <div className={styles.scheduleGrid}>
        {Array.from({ length: maxFreq }).map((_, i) => (
          <div key={i} className={styles.schedCard}>
            <div className={styles.schedTime}>{times[i]}</div>
            <div className={styles.schedDose}>
              {dose >= 1000 ? `${(dose / 1000).toFixed(2)} kg` : `${dose.toFixed(0)} g`}
            </div>
            <div className={styles.schedMeal}>{names[i]}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--mist)', marginTop: 10, fontFamily: "'DM Mono', monospace" }}>
        {id
          ? `Total ${maxFreq}x pemberian · ${totalPakan >= 1000 ? (totalPakan/1000).toFixed(2)+' kg' : totalPakan.toFixed(0)+' g'}/hari`
          : `Total ${maxFreq}x daily feedings · ${totalPakan >= 1000 ? (totalPakan/1000).toFixed(2)+' kg' : totalPakan.toFixed(0)+' g'}/day`}
      </div>
    </div>
  );
}
