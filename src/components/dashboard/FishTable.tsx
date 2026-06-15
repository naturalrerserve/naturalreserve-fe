'use client';
import { useState } from 'react';
import styles from '@/styles/dashboard.module.css';
import { SPECIES_LABEL, STAGE_LABEL } from '@/lib/fr-database';
import type { Fish, DeadLogEntry } from '@/types';

interface Props {
  fish: Fish[];
  lang: 'id' | 'en';
  onDelete: (id: number) => void;
  onUpdate: (fish: Fish) => void;
  showToast: (msg: string) => void;
}

function frClass(fr: number, s: Record<string, string>) {
  if (fr >= 6)   return s.frHigh;
  if (fr >= 2.5) return s.frMid;
  return s.frLow;
}

function fmtGram(g: number): string {
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(2)} ton`;
  if (g >= 1_000)     return `${(g / 1_000).toFixed(2)} kg`;
  return `${g.toFixed(0)} g`;
}

function fmtDate(iso: string, lang: 'id' | 'en'): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function FishTable({ fish, lang, onDelete, onUpdate, showToast }: Props) {
  /* ── Edit modal state ── */
  const [editFish,    setEditFish]    = useState<Fish | null>(null);
  const [editName,    setEditName]    = useState('');
  const [editWeight,  setEditWeight]  = useState('');
  const [editFR,      setEditFR]      = useState('');
  const [editNote,    setEditNote]    = useState('');
  const [tempDead,    setTempDead]    = useState<DeadLogEntry[]>([]);
  const [deadCount,   setDeadCount]   = useState('');
  const [deadDate,    setDeadDate]    = useState(new Date().toISOString().split('T')[0]);

  /* ── Tank Stats modal state ── */
  const [statsFish, setStatsFish] = useState<Fish | null>(null);

  const id = lang === 'id';

  /* ── Open edit ── */
  const openEdit = (f: Fish) => {
    if (!f.origQty) f = { ...f, origQty: f.qty + (f.deadLog || []).reduce((s, d) => s + d.count, 0) };
    setEditFish(f);
    setEditName(f.name);
    setEditWeight(String(f.weight));
    setEditFR(String(f.fr));
    setEditNote(f.note || '');
    setTempDead([...(f.deadLog || [])]);
    setDeadCount('');
    setDeadDate(new Date().toISOString().split('T')[0]);
  };

  const closeEdit = () => { setEditFish(null); setTempDead([]); };

  /* ── Add dead entry ── */
  const addDead = () => {
    const cnt = parseInt(deadCount);
    if (!cnt || cnt < 1) { showToast('⚠️ ' + (id ? 'Jumlah kematian tidak valid' : 'Invalid death count')); return; }
    setTempDead(prev => [...prev, { count: cnt, date: deadDate }]);
    setDeadCount('');
    showToast(id ? '💀 Entri kematian ditambahkan' : '💀 Mortality entry added');
  };

  const removeDead = (idx: number) => setTempDead(prev => prev.filter((_, i) => i !== idx));

  /* ── Save edit ── */
  const saveEdit = () => {
    if (!editFish) return;
    const newName   = editName.trim();
    const newWeight = parseFloat(editWeight);
    const newFR     = parseFloat(editFR);
    if (!newName)             { showToast('⚠️ ' + (id ? 'Nama tidak boleh kosong' : 'Name cannot be empty')); return; }
    if (!newWeight || newWeight <= 0) { showToast('⚠️ ' + (id ? 'Berat tidak valid' : 'Invalid weight')); return; }

    const origQty   = editFish.origQty || editFish.qty;
    const totalDead = tempDead.reduce((s, d) => s + d.count, 0);
    const newQty    = Math.max(0, origQty - totalDead);
    const fr        = (!isNaN(newFR) && newFR > 0) ? newFR : editFish.fr;
    const biomass   = newWeight * newQty;          /* gram */
    const pakanDay  = (biomass * fr) / 100;        /* gram/hari */

    const updated: Fish = {
      ...editFish,
      name: newName, weight: newWeight, qty: newQty,
      fr, frLabel: `${fr} %`, biomass, pakanDay,
      deadLog: tempDead,
      note: editNote.trim(),
    };
    onUpdate(updated);
    closeEdit();
    showToast(id ? '✅ Data ikan diperbarui' : '✅ Fish data updated');
  };

  /* ── Derived dead totals for edit modal ── */
  const editOrigQty   = editFish ? (editFish.origQty || editFish.qty) : 0;
  const editTotalDead = tempDead.reduce((s, d) => s + d.count, 0);
  const editLiveQty   = Math.max(0, editOrigQty - editTotalDead);

  return (
    <>
      {/* ═══════════════ FISH TABLE ═══════════════ */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          📋 {id ? 'Daftar Ikan' : 'Fish List'}
        </div>

        {fish.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>🐟</span>
            {id ? 'Belum ada data ikan. Tambahkan ikan di panel kiri.' : 'No fish data yet. Add fish in the left panel.'}
          </div>
        ) : (
          <div className={styles.fishTableWrap}>
            <table className={styles.fishTable}>
              <thead>
                <tr>
                  <th>{id ? 'Nama / Kolam' : 'Name / Tank'}</th>
                  <th>{id ? 'Berat & Biomassa' : 'Weight & Biomass'}</th>
                  <th>FR</th>
                  <th>{id ? 'Pakan/Hari' : 'Feed/Day'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fish.map((f) => {
                  const deadTotal = (f.deadLog || []).reduce((s, d) => s + d.count, 0);
                  return (
                    <tr key={f.id}>
                      <td>
                        <button
                          className={styles.tdTankLink}
                          onClick={() => setStatsFish(f)}
                          title={id ? 'Lihat statistik tank' : 'View tank stats'}
                        >
                          {f.name}
                        </button>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--mist)' }}>
                          {SPECIES_LABEL[f.species]} · {STAGE_LABEL[f.stage]}
                        </span>
                        {deadTotal > 0 && (
                          <> &nbsp;<span className={styles.deadLogBadge}>💀 {deadTotal} mati</span></>
                        )}
                        {f.note && (
                          <><br /><span style={{ fontSize: 9, color: 'var(--mist)', fontStyle: 'italic' }}>{f.note}</span></>
                        )}
                      </td>
                      <td className={styles.tdWeight}>
                        {f.weight}g / ekor<br />
                        <span style={{ fontSize: 10, color: 'var(--mist)' }}>
                          {f.qty.toLocaleString('id-ID')} {id ? 'ekor' : 'fish'} · {fmtGram(f.biomass)} total
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.tdFr} ${frClass(f.fr, styles)}`}>{f.frLabel}</span>
                        <br />
                        <span style={{ fontSize: 9, color: 'var(--mist)' }}>{STAGE_LABEL[f.stage]}</span>
                      </td>
                      <td className={styles.tdPakan}>
                        {fmtGram(f.pakanDay)}
                        <br />
                        <span style={{ fontSize: 9, color: 'var(--mist)' }}>{f.freq}x/{id ? 'hari' : 'day'}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className={styles.tdEdit} onClick={() => openEdit(f)} title="Edit">✏</button>
                        <button className={styles.tdDel} onClick={() => onDelete(f.id)} title={id ? 'Hapus' : 'Delete'}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════ EDIT MODAL ═══════════════ */}
      {editFish && (
        <div
          className={`${styles.editModalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className={styles.editModal}>
            <div className={styles.editModalTitle}>
              ✏ {id ? 'Edit Data Ikan' : 'Edit Fish Data'}
              <button className={styles.editModalClose} onClick={closeEdit}>✕</button>
            </div>

            {/* Name */}
            <div className={styles.editSection}>
              <div className={styles.editSectionTitle}>{id ? 'Nama / Label Kolam' : 'Name / Tank Label'}</div>
              <input
                className={styles.editInput}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={id ? 'Nama kolam...' : 'Tank name...'}
              />
            </div>

            {/* Weight & FR */}
            <div className={styles.editSection}>
              <div className={styles.editSectionTitle}>{id ? 'Bobot & Feeding Rate' : 'Weight & Feeding Rate'}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--mist)', marginBottom: 4 }}>
                    {id ? 'Bobot rata-rata (gram)' : 'Avg weight (gram)'}
                  </div>
                  <input
                    className={styles.editInput}
                    type="number" min="0.1" step="0.1"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--mist)', marginBottom: 4 }}>
                    {id ? 'Feeding Rate (%)' : 'Feeding Rate (%)'}
                  </div>
                  <input
                    className={styles.editInput}
                    type="number" min="0.1" max="30" step="0.1"
                    value={editFR}
                    onChange={(e) => setEditFR(e.target.value)}
                  />
                </div>
              </div>
              {/* Live count display */}
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(13,148,136,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--mist)', display: 'flex', gap: 16 }}>
                <span>🐟 <b style={{ color: 'var(--lime)' }}>{editLiveQty.toLocaleString('id-ID')}</b> {id ? 'hidup' : 'alive'}</span>
                <span>💀 <b style={{ color: 'var(--coral)' }}>{editTotalDead}</b> {id ? 'mati' : 'dead'}</span>
                <span>📊 {id ? 'Awal' : 'Initial'}: <b>{editOrigQty.toLocaleString('id-ID')}</b></span>
              </div>
            </div>

            {/* Dead Log */}
            <div className={styles.editSection}>
              <div className={styles.editSectionTitle}>💀 {id ? 'Catat Kematian' : 'Log Mortality'}</div>

              {/* Existing dead entries */}
              {tempDead.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--mist)', textAlign: 'center', padding: '8px', marginBottom: 8 }}>
                  {id ? 'Belum ada catatan kematian' : 'No mortality records yet'}
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  {tempDead.map((d, i) => (
                    <div key={i} className={styles.deadFishRow}>
                      <span className={styles.deadCountBadge}>💀 {d.count} {id ? 'ekor' : 'fish'}</span>
                      <span style={{ fontSize: 11, color: 'var(--mist)', flex: 1 }}>{fmtDate(d.date, lang)}</span>
                      <button
                        onClick={() => removeDead(i)}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new dead entry */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--mist)', marginBottom: 4 }}>{id ? 'Jumlah mati' : 'Count'}</div>
                  <input
                    className={styles.editInput}
                    type="number" min="1" step="1"
                    placeholder="0"
                    value={deadCount}
                    onChange={(e) => setDeadCount(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--mist)', marginBottom: 4 }}>{id ? 'Tanggal' : 'Date'}</div>
                  <input
                    className={styles.editInput}
                    type="date"
                    value={deadDate}
                    onChange={(e) => setDeadDate(e.target.value)}
                  />
                </div>
                <button
                  onClick={addDead}
                  style={{ padding: '9px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, color: '#f43f5e', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  + {id ? 'Tambah' : 'Add'}
                </button>
              </div>
            </div>

            {/* Note */}
            <div className={styles.editSection}>
              <div className={styles.editSectionTitle}>{id ? 'Catatan' : 'Notes'}</div>
              <textarea
                className={styles.editInput}
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                placeholder={id ? 'Catatan tambahan...' : 'Additional notes...'}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            <div className={styles.editBtnRow}>
              <button className={`${styles.editBtn} ${styles.editBtnCancel}`} onClick={closeEdit}>
                {id ? 'Batal' : 'Cancel'}
              </button>
              <button className={`${styles.editBtn} ${styles.editBtnSave}`} onClick={saveEdit}>
                💾 {id ? 'Simpan' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TANK STATS MODAL ═══════════════ */}
      {statsFish && (
        <div
          className={`${styles.editModalOverlay} ${styles.open}`}
          onClick={(e) => { if (e.target === e.currentTarget) setStatsFish(null); }}
          style={{ zIndex: 1010 }}
        >
          <div className={styles.editModal} style={{ maxWidth: 560 }}>
            <div className={styles.editModalTitle}>
              🐟 {statsFish.name}
              <button className={styles.editModalClose} onClick={() => setStatsFish(null)}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--teal3)', marginBottom: 16 }}>
              {SPECIES_LABEL[statsFish.species]} · {STAGE_LABEL[statsFish.stage]} · FR {statsFish.fr}%
            </div>

            {/* Survival bar */}
            {(() => {
              const origQty     = statsFish.origQty || statsFish.qty;
              const liveQty     = statsFish.qty;
              const totalDead   = (statsFish.deadLog || []).reduce((s, d) => s + d.count, 0);
              const survPct     = origQty > 0 ? Math.max(0, (liveQty / origQty) * 100) : 100;
              const mortPct     = 100 - survPct;
              const pakanMinggu = statsFish.pakanDay * 7;
              const pakanBulan  = statsFish.pakanDay * 30;

              return (
                <>
                  {/* Survival bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--mist)' }}>Survival Rate</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--lime)', fontWeight: 600 }}>{survPct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${survPct}%`, background: 'linear-gradient(to right, var(--teal), var(--lime))', borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--mist)' }}>
                      <span>💀 {id ? 'Mati' : 'Dead'}: {totalDead.toLocaleString('id-ID')} ({mortPct.toFixed(1)}%)</span>
                      <span>🐟 {id ? 'Hidup' : 'Alive'}: {liveQty.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* KPI Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { lbl: id ? 'Ikan Hidup' : 'Alive Fish', val: liveQty.toLocaleString('id-ID'), sub: `dari ${origQty.toLocaleString('id-ID')} awal`, color: 'var(--lime)' },
                      { lbl: id ? 'Total Mati' : 'Total Deaths', val: totalDead.toLocaleString('id-ID'), sub: 'ekor', color: 'var(--coral)' },
                      { lbl: id ? 'Berat/Ekor' : 'Weight/Fish', val: `${statsFish.weight}`, sub: 'gram', color: 'var(--teal3)' },
                      { lbl: 'Total Biomassa', val: fmtGram(statsFish.biomass), sub: 'berat hidup', color: 'var(--teal3)' },
                      { lbl: id ? 'Pakan/Hari' : 'Feed/Day', val: fmtGram(statsFish.pakanDay), sub: `FR ${statsFish.fr}%`, color: 'var(--amber)' },
                      { lbl: id ? 'Pakan/Minggu' : 'Feed/Week', val: fmtGram(pakanMinggu), sub: 'proyeksi', color: 'var(--amber)' },
                      { lbl: id ? 'Pakan/Bulan' : 'Feed/Month', val: fmtGram(pakanBulan), sub: 'proyeksi', color: '#a5b4fc' },
                      { lbl: 'Avg FR', val: `${statsFish.fr}`, sub: '% / hari', color: 'var(--mist)' },
                    ].map((kpi, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--mist)', marginBottom: 4 }}>{kpi.lbl}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: kpi.color }}>{kpi.val}</div>
                        <div style={{ fontSize: 9, color: 'var(--mist)', marginTop: 2 }}>{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Death history */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal3)', marginBottom: 8 }}>
                    {id ? 'Riwayat Kematian' : 'Death History'}
                  </div>
                  {(statsFish.deadLog || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'var(--mist)', fontSize: 12 }}>✅ {id ? 'Tidak ada catatan kematian' : 'No death records'}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                      {(statsFish.deadLog || []).map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'rgba(244,63,94,0.05)', borderRadius: 8, border: '1px solid rgba(244,63,94,0.15)' }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", color: '#f43f5e', fontWeight: 700 }}>💀 {d.count}</span>
                          <span style={{ fontSize: 11, color: 'var(--mist)' }}>{fmtDate(d.date, lang)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {statsFish.note && (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal3)', marginBottom: 6, marginTop: 12 }}>{id ? 'Catatan' : 'Notes'}</div>
                      <div style={{ padding: '10px 14px', background: 'rgba(13,148,136,0.06)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                        {statsFish.note}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                className={`${styles.editBtn} ${styles.editBtnCancel}`}
                onClick={() => setStatsFish(null)}
              >
                {id ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
