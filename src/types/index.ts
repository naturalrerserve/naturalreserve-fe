// ══════════════════════════════════════════════════════════
//  Natural Reserve — TypeScript Type Definitions
// ══════════════════════════════════════════════════════════

export type FishSpecies =
  | 'lele' | 'nila' | 'mas' | 'patin'
  | 'gurame' | 'bawal' | 'udang' | 'custom';

export type FishStage =
  | 'larva' | 'pendederan' | 'pembesaran1'
  | 'pembesaran2' | 'pembesaran3' | 'induk';

export type Lang = 'id' | 'en';

export interface DeadLogEntry {
  count: number;
  date: string;
  note?: string;
}

export interface Fish {
  id: number;
  name: string;
  species: FishSpecies;
  weight: number;
  qty: number;
  origQty: number;
  stage: FishStage;
  biomass: number;
  fr: number;
  frLabel: string;
  pakanDay: number;
  freq: number;
  deadLog?: DeadLogEntry[];
  note?: string;
}

export interface FRData {
  fr: number;
  label: string;
  freq: number;
}

export interface DailyRow {
  day: number | string;
  dateStr: string;
  phase: string;
  phaseColor: string;
  biomass: number;
  fr: string;
  pakanToday: number;
  cumFeedKg: number;
  weightNow: number;
  abw: number;
  fcrCum: string;
  fcrDisplay: string;
}

export interface HistoryEntry {
  fish: Fish[];
  totalBiomass: number;
  totalPakan: number;
  totalCount: number;
  savedAt: string;
}

export interface AppSettings {
  bubbles: boolean;
  wave: boolean;
  glass: boolean;
  lang: Lang;
  unit: 'gram' | 'kg';
  rownum: boolean;
  autosave: boolean;
  prot_rightclick: boolean;
  prot_select: boolean;
  prot_drag: boolean;
  prot_copy: boolean;
  prot_viewsource: boolean;
  prot_saveprint: boolean;
  prot_devtools: boolean;
  prot_devdetect: boolean;
  prot_watermark: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  role: string;
  avatar: string | null;
  joinDate: string;
  loginCount: number;
}

export interface ActivityLog {
  type: string;
  desc: string;
  time: string;
}

// Admin types
export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  username: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

export interface AccessCode {
  id: string;
  username: string;
  name: string;
  email: string;
  code: string;
  status: 'active' | 'revoked';
  requestId?: string;
  createdAt: string;
}

// Modal types
export type ModalType =
  | 'profile' | 'settings' | 'editFish'
  | 'tankStats' | null;

export type ProfileTab = 'info' | 'security' | 'activity';
export type SettingsTab = 'tampilan' | 'proteksi' | 'data' | 'tentang';
export type AdminSection = 'requests' | 'codes' | 'generate' | 'admins';
