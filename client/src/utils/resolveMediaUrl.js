import axiosInstance from '../config/axios';

/**
 * URL for media paths like `/uploads/...`.
 * In Vite dev, `/uploads` is proxied to the API server so use a same-origin path (avoids broken img when API host differs).
 */
export function resolveMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (import.meta.env.DEV && typeof path === 'string' && path.startsWith('/uploads/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const base = (axiosInstance.defaults.baseURL || '').replace(/\/api\/?$/i, '') || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
