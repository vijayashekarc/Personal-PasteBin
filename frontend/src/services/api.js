import { getDeviceId, getDeviceName } from '../utils/device';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://personal-paste-bin.vercel.app');

function getHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi({ password, forceRevokeDeviceId }) {
  const deviceId = getDeviceId();
  const deviceName = getDeviceName();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, deviceId, deviceName, forceRevokeDeviceId }),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Login failed');
    error.status = res.status;
    error.limitReached = data.limitReached;
    error.activeSessions = data.activeSessions;
    throw error;
  }
  return data;
}

export async function getSessionsApi(token) {
  const res = await fetch(`${API_BASE}/auth/sessions`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch sessions');
  }
  return res.json();
}

export async function deleteSessionApi(deviceId, token) {
  const res = await fetch(`${API_BASE}/auth/sessions/${deviceId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to revoke session');
  }
  return res.json();
}

export async function logoutApi(token) {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(token),
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
}

export async function getNotesApi({ q, tag }, token) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);

  const url = `${API_BASE}/api/notes${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || 'Failed to fetch notes');
    error.status = res.status;
    error.sessionRevoked = err.sessionRevoked;
    throw error;
  }
  return res.json();
}

export async function createNoteApi(noteData, token) {
  const res = await fetch(`${API_BASE}/api/notes`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save note');
  }
  return res.json();
}

export async function updateNoteApi(id, noteData, token) {
  const res = await fetch(`${API_BASE}/api/notes/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(noteData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update note');
  }
  return res.json();
}

export async function togglePinApi(id, token) {
  const res = await fetch(`${API_BASE}/api/notes/${id}/pin`, {
    method: 'PATCH',
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to toggle pin');
  }
  return res.json();
}

export async function deleteNoteApi(id, token) {
  const res = await fetch(`${API_BASE}/api/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete note');
  }
  return res.json();
}
