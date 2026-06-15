/* ══════════════════════════════════════════════════════════
   Natural Reserve — Feeding Rate Database
   Sources: SNI Budidaya, BBPBAT, FAO
   Port dari FR_DB object di index.html
══════════════════════════════════════════════════════════ */
import type { FishSpecies, FishStage, FRData } from '@/types';

export const FR_DB: Record<FishSpecies, Record<FishStage, FRData | null>> = {
  lele: {
    larva:       { fr: 12.5, label: '10 – 15 %', freq: 5 },
    pendederan:  { fr: 7.5,  label: '5 – 10 %',  freq: 4 },
    pembesaran1: { fr: 4.0,  label: '3 – 5 %',   freq: 3 },
    pembesaran2: { fr: 2.5,  label: '2 – 3 %',   freq: 3 },
    pembesaran3: { fr: 1.5,  label: '1 – 2 %',   freq: 2 },
    induk:       { fr: 1.25, label: '1 – 1.5 %', freq: 2 },
  },
  nila: {
    larva:       { fr: 11.0, label: '10 – 12 %', freq: 5 },
    pendederan:  { fr: 6.5,  label: '5 – 8 %',   freq: 4 },
    pembesaran1: { fr: 4.0,  label: '3 – 5 %',   freq: 3 },
    pembesaran2: { fr: 2.5,  label: '2 – 3 %',   freq: 3 },
    pembesaran3: { fr: 1.5,  label: '1 – 2 %',   freq: 2 },
    induk:       { fr: 1.5,  label: '1 – 2 %',   freq: 2 },
  },
  mas: {
    larva:       { fr: 12.5, label: '10 – 15 %', freq: 5 },
    pendederan:  { fr: 6.5,  label: '5 – 8 %',   freq: 4 },
    pembesaran1: { fr: 3.5,  label: '3 – 4 %',   freq: 3 },
    pembesaran2: { fr: 2.5,  label: '2 – 3 %',   freq: 3 },
    pembesaran3: { fr: 1.75, label: '1.5 – 2 %', freq: 2 },
    induk:       { fr: 1.25, label: '1 – 1.5 %', freq: 2 },
  },
  patin: {
    larva:       { fr: 12.0, label: '10 – 14 %',   freq: 5 },
    pendederan:  { fr: 7.0,  label: '5 – 9 %',     freq: 4 },
    pembesaran1: { fr: 3.5,  label: '3 – 4 %',     freq: 3 },
    pembesaran2: { fr: 2.5,  label: '2 – 3 %',     freq: 3 },
    pembesaran3: { fr: 1.5,  label: '1 – 2 %',     freq: 2 },
    induk:       { fr: 1.0,  label: '0.8 – 1.2 %', freq: 2 },
  },
  gurame: {
    larva:       { fr: 10.0, label: '8 – 12 %',    freq: 4 },
    pendederan:  { fr: 6.0,  label: '5 – 7 %',     freq: 3 },
    pembesaran1: { fr: 3.5,  label: '3 – 4 %',     freq: 3 },
    pembesaran2: { fr: 2.0,  label: '1.5 – 2.5 %', freq: 2 },
    pembesaran3: { fr: 1.25, label: '1 – 1.5 %',   freq: 2 },
    induk:       { fr: 1.0,  label: '0.8 – 1.2 %', freq: 2 },
  },
  bawal: {
    larva:       { fr: 12.0, label: '10 – 14 %',   freq: 5 },
    pendederan:  { fr: 7.0,  label: '5 – 9 %',     freq: 4 },
    pembesaran1: { fr: 4.0,  label: '3 – 5 %',     freq: 3 },
    pembesaran2: { fr: 2.5,  label: '2 – 3 %',     freq: 3 },
    pembesaran3: { fr: 1.5,  label: '1 – 2 %',     freq: 2 },
    induk:       { fr: 1.0,  label: '0.8 – 1.2 %', freq: 2 },
  },
  udang: {
    larva:       { fr: 20.0, label: '15 – 25 %',   freq: 6 },
    pendederan:  { fr: 12.0, label: '10 – 15 %',   freq: 5 },
    pembesaran1: { fr: 7.0,  label: '5 – 9 %',     freq: 4 },
    pembesaran2: { fr: 4.5,  label: '3.5 – 5.5 %', freq: 4 },
    pembesaran3: { fr: 3.0,  label: '2 – 4 %',     freq: 3 },
    induk:       { fr: 2.0,  label: '1.5 – 2.5 %', freq: 3 },
  },
  custom: {
    larva: null, pendederan: null, pembesaran1: null,
    pembesaran2: null, pembesaran3: null, induk: null,
  },
};

export const SPECIES_LABEL: Record<FishSpecies, string> = {
  lele:   'Catfish',
  nila:   'Tilapia',
  mas:    'Common Carp',
  patin:  'Pangasius',
  gurame: 'Gourami',
  bawal:  'Pomfret',
  udang:  'Shrimp',
  custom: 'Custom',
};

export const STAGE_LABEL: Record<FishStage, string> = {
  larva:       'Larva',
  pendederan:  'Nursery',
  pembesaran1: 'Growth I',
  pembesaran2: 'Growth II',
  pembesaran3: 'Growth III',
  induk:       'Broodstock',
};

export function getFRData(
  species: FishSpecies,
  stage: FishStage,
  customFR?: number
): FRData | null {
  if (species === 'custom') {
    if (customFR && customFR > 0) return { fr: customFR, label: `${customFR} %`, freq: 3 };
    return null;
  }
  return FR_DB[species]?.[stage] || null;
}

/* ── FCR Phase Definitions ── */
export const PHASE_DEFS = [
  { name: 'Nursery',    color: '#5eead4', fr: 0.065, growthRate: 0.04  },
  { name: 'Growth I',   color: '#14b8a6', fr: 0.04,  growthRate: 0.025 },
  { name: 'Growth II',  color: '#0d9488', fr: 0.025, growthRate: 0.015 },
  { name: 'Growth III', color: '#0a7c72', fr: 0.015, growthRate: 0.008 },
];

export function getPhaseForDay(day: number, totalDays: number) {
  const pct = day / totalDays;
  if (pct < 0.15) return PHASE_DEFS[0];
  if (pct < 0.40) return PHASE_DEFS[1];
  if (pct < 0.75) return PHASE_DEFS[2];
  return PHASE_DEFS[3];
}

/* ── Random Code Generator (Admin) ── */
export function genRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/* ── Escape HTML helper ── */
export function escHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
