/* ══════════════════════════════════════════════════════════
   Natural Reserve — Mock Firebase Library for NestJS Migration
   Replaces actual Firebase SDK imports to avoid client-side SDK.
   Retrieves auth status dynamically from JWT token.
   ══════════════════════════════════════════════════════════ */

export const auth = {
  get currentUser() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('nr_token');
    if (!token) return null;
    try {
      // Decode JWT token payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));
      return {
        uid: payload.sub, // User ID in PostgreSQL
        email: payload.username, // Username/email depending on payload
      };
    } catch (e) {
      return null;
    }
  },
  signOut: async () => {
    localStorage.removeItem('nr_token');
    triggerAuthChange();
  }
};

// Dispatch a custom event to notify auth state listeners of changes
export function triggerAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('nr-auth-change'));
  }
}

// Mock onAuthStateChanged
export function onAuthStateChanged(
  _authInstance: any,
  callback: (user: { uid: string; email?: string } | null) => void,
) {
  if (typeof window === 'undefined') return () => {};
  
  // Call callback immediately with the current user
  callback(auth.currentUser);

  // Set up event listeners for storage or manual triggers
  const handler = () => {
    callback(auth.currentUser);
  };

  window.addEventListener('storage', handler);
  window.addEventListener('nr-auth-change', handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('nr-auth-change', handler);
  };
}

// Stub for Firestore database to prevent compilation errors
export const db = {};
