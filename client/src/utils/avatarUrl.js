import { resolveMediaUrl } from './resolveMediaUrl';

/** Fallback bitmap when `/avatars/...` or custom URL fails to load */
export function uiAvatarsFallback(name, size = 128) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4f46e5&color=fff&size=${size}`;
}

/**
 * Primary avatar URL for a user-like object (numeric preset, upload path, or fallback).
 */
export function resolveUserAvatarUrl(user) {
  const u = user || {};
  const n = u.avatar;
  if (typeof n === 'string' && n.trim() !== '') {
    return resolveMediaUrl(n);
  }
  if (n != null && n !== '') {
    return `/avatars/avatar-${n}.png`;
  }
  return uiAvatarsFallback(u.name || u.username || 'User');
}
