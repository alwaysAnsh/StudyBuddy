import axiosInstance from '../config/axios';

/**
 * URL for media: full `https://` URLs (e.g. Cloudinary) are returned as-is.
 * Relative `/uploads/...` is resolved against the API origin; in Vite dev, `/uploads` is proxied.
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
