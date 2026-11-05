import { t } from '../lib/i18n';
/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import * as searches from '../lib/searches';
import { wishlistTick } from '../lib/wishlist';
import { urlBase } from '../config';

export default function WishlistWorker({ connected }) {
  useEffect(() => {
    if (!connected) return undefined;
    const owner = uuid();
    let stopped = false, working = false;
    const tick = async () => {
      if (working || stopped) return;
      working = true;
      try {
        await wishlistTick({ api: searches, makeId: uuid, owner, active: () => !stopped,
          notify: (message, id, result) => toast.info(<Link to={`${urlBase}/searches/${id}`}>{t("{0} · View results", [result?t("{0}: {1} files found",[result.query,result.count]):message])}</Link>, { autoClose: 12000 }) });
      } catch (error) { console.debug('Wishlist paused:', error.message); }
      finally { working = false; }
    };
    tick();
    const timer = window.setInterval(tick, 15000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [connected]);
  return null;
}
