import { auth, triggerAuthChange } from './firebase';
import { api, setToken, removeToken } from './api';
import type { UserProfile, ActivityLog, Fish, AppSettings, HistoryEntry, AccessCode, AccessRequest } from '@/types';

/* ── Username → email mapping ── */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@naturalreserve.local`;
}

/* ── Wait for auth state ── */
export async function nrAuthReady(): Promise<any> {
  return auth.currentUser;
}

/* ── REGISTER (For manual registrations) ── */
export async function nrRegister({
  username, password, email, firstName, lastName, role,
}: {
  username: string; password: string; email?: string;
  firstName?: string; lastName?: string; role?: string;
}): Promise<any> {
  const result = await api.post('access-codes/generate', {
    username,
    email: email || '',
    name: firstName || username,
    code: password,
  });
  return { uid: username, ...result };
}

/* ── LOGIN ── */
export async function nrLogin(username: string, password: string): Promise<any> {
  const data = await api.post('auth/login', {
    username,
    password,
  });

  if (data.requiresOtp) {
    return data;
  }

  if (data.access_token) {
    setToken(data.access_token);
    triggerAuthChange();
  }

  return { uid: data.user.id, email: data.user.email };
}

export async function nrVerifyLoginOtp(username: string, otp: string): Promise<any> {
  const data = await api.post('auth/login-verify', {
    username,
    otp,
  });

  if (data.access_token) {
    setToken(data.access_token);
    triggerAuthChange();
  }

  return { uid: data.user.id, email: data.user.email };
}

export async function nrGoogleLogin(credential: string): Promise<any> {
  const data = await api.post('auth/google', { credential });

  if (data.access_token) {
    setToken(data.access_token);
    triggerAuthChange();
  }

  return { uid: data.user.id, email: data.user.email };
}

/* ── ADMIN LOGIN ── */
export async function nrAdminLogin(username: string, password: string): Promise<any> {
  const data = await api.post('auth/admin/login', {
    username,
    password,
  });

  if (data.access_token) {
    setToken(data.access_token);
    triggerAuthChange();
  }

  return data.user;
}

/* ── LOGOUT ── */
export async function nrLogout(): Promise<void> {
  removeToken();
  triggerAuthChange();
}

/* ── GET CURRENT USER PROFILE ── */
export async function nrGetCurrentUser(): Promise<UserProfile | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const data = await api.get('users/me');
    return {
      uid:        data.id || user.uid,
      username:   data.username,
      firstName:  data.firstName || '',
      lastName:   data.lastName || '',
      email:      data.email || '',
      phone:      data.phone || '',
      location:   data.location || '',
      bio:        data.bio || '',
      role:       data.role || 'Operator',
      avatar:     data.avatar || null,
      joinDate:   data.joinDate || new Date().toISOString(),
      loginCount: data.loginCount || 0,
    };
  } catch (e) {
    return null;
  }
}

/* ── SAVE PROFILE ── */
export async function nrSaveProfile(uid: string, fields: Partial<UserProfile>): Promise<void> {
  await api.put('users/me', {
    firstName: fields.firstName,
    lastName: fields.lastName,
    phone: fields.phone,
    location: fields.location,
    bio: fields.bio,
  });
}

/* ── AVATAR ── */
export async function nrSaveAvatar(uid: string, dataUrl: string): Promise<void> {
  await api.put('users/me/avatar', { avatar: dataUrl });
}

/* ── CHANGE PASSWORD ── */
export async function nrChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('users/me/password', { currentPassword, newPassword });
}

/* ── ACTIVITY LOG ── */
export async function nrLogActivity(uid: string, type: string, desc: string): Promise<void> {
  await api.post('users/me/activity', { type, description: desc });
}

export async function nrGetActivity(uid: string): Promise<ActivityLog[]> {
  const data = await api.get('users/me/activity');
  return data.map((d: any) => ({
    type: d.type,
    desc: d.description,
    time: d.timestamp,
  }));
}

/* ── HISTORY ── */
export async function nrSaveHistoryEntry(uid: string, dateKey: string, entry: HistoryEntry): Promise<void> {
  await api.post(`users/me/history/${dateKey}`, entry);
}

export async function nrLoadHistory(uid: string): Promise<Record<string, HistoryEntry>> {
  return api.get('users/me/history');
}

export async function nrDeleteAllHistory(uid: string): Promise<void> {
  await api.delete('users/me/history');
}

export async function nrDeleteAllActivity(uid: string): Promise<void> {
  await api.delete('users/me/activity');
}

/* ── FISH LIST ── */
export async function nrSaveFishList(uid: string, fishList: Fish[]): Promise<void> {
  await api.put('users/me/fish', { fish: fishList });
}

export async function nrLoadFishList(uid: string): Promise<Fish[]> {
  return api.get('users/me/fish');
}

/* ── SETTINGS ── */
export async function nrSaveSettings(uid: string, settings: AppSettings): Promise<void> {
  await api.put('users/me/settings', settings);
}

export async function nrLoadSettings(uid: string): Promise<AppSettings | null> {
  return api.get('users/me/settings');
}

/* ── ACCESS REQUESTS ── */
export async function nrCreateAccessRequest(
  name: string, email: string, username: string, password: string, reason: string
): Promise<any> {
  return await api.post('access-requests', { name, email, username, password, reason });
}

export async function nrVerifyOtp(username: string, otp: string): Promise<any> {
  return api.post('access-requests/verify-otp', { username, otp });
}

export async function nrGetAccessRequests(): Promise<AccessRequest[]> {
  const data = await api.get('access-requests');
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    username: d.username,
    reason: d.reason,
    status: d.status.toLowerCase(), // 'pending', 'approved', 'rejected'
    createdAt: d.createdAt,
  }));
}

export async function nrApproveAccessRequest(id: string): Promise<any> {
  return api.put(`access-requests/${id}/approve`);
}

export async function nrRejectAccessRequest(id: string): Promise<any> {
  return api.put(`access-requests/${id}/reject`);
}

/* ── ACCESS CODES ── */
export async function nrGetAccessCodes(): Promise<AccessCode[]> {
  const data = await api.get('access-codes');
  return data.map((d: any) => ({
    id: d.id,
    username: d.username,
    name: d.name,
    email: d.email,
    code: d.plainCode || '••••••••', // Show plainCode if available, otherwise masked
    status: d.status.toLowerCase(), // 'active', 'revoked'
    createdAt: d.createdAt,
  }));
}

export async function nrRevokeAccessCode(id: string): Promise<void> {
  await api.put(`access-codes/${id}/revoke`);
}

export async function nrVerifyAccessCode(username: string, code: string): Promise<boolean> {
  // Verify logic will now be handled inside auth/login endpoint.
  // We can return true here as login handles validation, but we can verify it via manual check if needed.
  try {
    const data = await api.post('auth/login', { username, accessCode: code });
    return !!data.access_token;
  } catch {
    return false;
  }
}

/* ── ADMIN MANAGEMENT ── */
export async function nrCreateAdmin(name: string, email: string, username: string, password: string): Promise<any> {
  return api.post('users/admins', { name, email, username, password });
}

export async function nrListAdmins(): Promise<any[]> {
  return api.get('users/admins');
}

export async function nrDeleteAdmin(id: string): Promise<any> {
  return api.delete(`users/admins/${id}`);
}

