'use client';
import styles from '@/styles/dashboard.module.css';
import type { Fish, UserProfile } from '@/types';

interface Props {
  fish: Fish[];
  lang: 'id' | 'en';
  onClear: () => void;
  showToast: (msg: string) => void;
  user: UserProfile | null;
}

export default function ActionBar({ fish, lang, onClear, showToast }: Props) {
  const id = lang === 'id';
  if (fish.length === 0) return null;

  const handlePrint = () => {
    window.print();
    showToast(id ? 'Membuka dialog cetak…' : 'Opening print dialog…');
  };

  const handleExport = () => {
    const totalBiomass = fish.reduce((s, f) => s + f.biomass, 0);
    const totalPakan   = fish.reduce((s, f) => s + f.pakanDay, 0);

    /* biomass & pakanDay tersimpan dalam gram → tampilkan kg = /1000 */
    let csv = 'Nama,Jenis,Fase,Berat (g),Jumlah,Biomassa (kg),FR (%),Pakan/Hari (kg)\n';
    fish.forEach((f) => {
      csv += `"${f.name}",${f.species},${f.stage},${f.weight},${f.qty},${(f.biomass/1000).toFixed(3)},${f.fr},${(f.pakanDay/1000).toFixed(3)}\n`;
    });
    csv += `\nTotal,,,,,${(totalBiomass/1000).toFixed(3)},,${(totalPakan/1000).toFixed(3)}\n`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `natural-reserve-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast(id ? '📄 CSV berhasil diunduh' : '📄 CSV downloaded');
  };

  const handleSaveHistory = () => {
    window.dispatchEvent(new Event('triggerSaveHistory'));
  };

  const handleExportFCR = () => {
    window.dispatchEvent(new Event('triggerExportFCR'));
  };

  return (
    <div className={styles.actionsBar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
      <button 
        className={styles.btnPrimary} 
        onClick={handleSaveHistory} 
        style={{ padding: '9px 16px', fontSize: 14, boxShadow: '0 4px 12px rgba(20,184,166,0.3)', border: 'none', borderRadius: 8, background: 'linear-gradient(to right, var(--teal), var(--teal2))', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
      >
        💾 {id ? 'Saved ke Riwayat' : 'Save to History'}
      </button>
      <button className={styles.btnOutline} onClick={handleExport} style={{ padding: '9px 16px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
        📊 {id ? 'Export CSV' : 'Export CSV'}
      </button>
      <button className={styles.btnOutline} onClick={handleExportFCR} style={{ padding: '9px 16px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
        📈 {id ? 'Export FCR CSV' : 'Export FCR CSV'}
      </button>
      <button className={styles.btnOutline} onClick={handlePrint} style={{ padding: '9px 16px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}>
        🖨️ {id ? 'Print Laporan' : 'Print Report'}
      </button>
      <button className={`${styles.btnOutline} ${styles.btnDanger}`} onClick={onClear} style={{ marginLeft: 'auto', padding: '9px 16px', fontSize: 14, border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, background: 'rgba(244,63,94,0.05)', color: '#f43f5e', cursor: 'pointer', fontWeight: 500 }}>
        🗑️ {id ? 'Clear All' : 'Clear All'}
      </button>
    </div>
  );
}
