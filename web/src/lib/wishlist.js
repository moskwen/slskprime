/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import { getWishes, updateWish } from './studio';

export const wishIsDue = (wish, now = Date.now()) => {
  if (![30, 60, 180].includes(wish.intervalMinutes)) return false;
  const last = Math.max(Date.parse(wish.lastAttemptAt) || 0, Date.parse(wish.lastRunAt) || 0);
  return now - last >= wish.intervalMinutes * 60000;
};

// A short settling period lets other tabs observe the lease before any search is sent.
// Persist the attempt before sending, so reloads and API errors cannot cause a retry loop.
export async function wishlistTick({ api, makeId, owner, notify = () => {}, active = () => true,
  now = () => Date.now(), settle = () => new Promise(resolve => setTimeout(resolve, 250)) }) {
  const key = 'slskprime-wishlist-lease-v1';
  let lease;
  try { lease = JSON.parse(localStorage.getItem(key)); } catch {}
  if (!active() || (lease?.expires > now())) return;
  const claim = `${owner}:${makeId()}`;
  localStorage.setItem(key, JSON.stringify({ claim, expires: now() + 120000 }));
  try {
    await settle();
    if (!active() || JSON.parse(localStorage.getItem(key) || 'null')?.claim !== claim) return;
    const wishes = getWishes();
    // Only check searches started by this scheduler, one status request per tick.
    const pending = wishes.filter(w => w.pendingSearchId).sort((a,b) => (Date.parse(a.statusCheckedAt)||0)-(Date.parse(b.statusCheckedAt)||0))[0];
    if (pending) {
      updateWish(pending.query, { statusCheckedAt: new Date(now()).toISOString() });
      try {
        const status = await api.getStatus({ id: pending.pendingSearchId, timeout: 20000 });
        if (status.isComplete) {
          const count = Number(status.fileCount) || 0;
          updateWish(pending.query, { pendingSearchId: null, resultCount: count,
            resultCheckedAt: new Date(now()).toISOString(), lastError: null });
          if (count > 0 && active()) notify(`${pending.query}: ${count} files found`, pending.pendingSearchId, {query:pending.query,count});
        }
      } catch (error) {
        if (error.response?.status === 404) updateWish(pending.query, { pendingSearchId: null, lastError: 'Results expired. The next scheduled search will run normally.' });
        else return;
      }
    }
    if (!active()) return;
    const wish = getWishes().find(w => !w.pendingSearchId && wishIsDue(w, now()));
    if (!wish) return;
    const id = makeId();
    updateWish(wish.query, { lastAttemptAt: new Date(now()).toISOString(), lastError: null });
    try {
      await api.create({ id, searchText: wish.query, timeout: 20000 });
      updateWish(wish.query, { lastRunAt: new Date(now()).toISOString(), lastSearchId: id, pendingSearchId: id });
    } catch (error) {
      updateWish(wish.query, { lastError: `Search failed. Next attempt in ${wish.intervalMinutes} minutes.` });
    }
  } finally {
    try { if (JSON.parse(localStorage.getItem(key) || 'null')?.claim === claim) localStorage.removeItem(key); } catch {}
  }
}
