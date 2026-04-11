import axiosInstance from '../config/axios';

/** Absolute URL for paths like `/uploads/...` from the API host. */
export function resolveMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (axiosInstance.defaults.baseURL || '').replace(/\/api\/?$/i, '') || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
