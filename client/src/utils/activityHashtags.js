/** Parse #tags and comma/space-separated tags from text + explicit list */
export function collectHashtags(title, description, extraRaw) {
  const set = new Set();
  const text = `${title || ''} ${description || ''}`;
  const re = /#([a-zA-Z0-9_]{2,40})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    set.add(m[1].toLowerCase());
  }
  if (extraRaw) {
    String(extraRaw)
      .split(/[\s,]+/)
      .forEach((p) => {
        const t = p.replace(/^#+/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (t.length >= 2 && t.length <= 40) set.add(t);
      });
  }
  return [...set].slice(0, 20);
}

/** Build `tags` query string for GET /activities (comma-separated, normalized). */
export function hashtagSearchToTagsParam(raw) {
  return String(raw || '')
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))
    .filter((t) => t.length > 0)
    .slice(0, 10)
    .join(',');
}

export function activityMatchesHashtagQuery(activity, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const terms = q
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter(Boolean);
  if (!terms.length) return true;
  const tags = (activity.hashtags || []).map((t) => String(t).toLowerCase());
  return terms.every((term) => tags.some((tag) => tag === term || tag.includes(term)));
}
