'use client';
import styles from '@/styles/dashboard.module.css';

interface Props {
  msg: string;
}

export default function Toast({ msg }: Props) {
  return (
    <div className={`${styles.toast} ${msg ? styles.show : ''}`}>
      {msg}
    </div>
  );
}
