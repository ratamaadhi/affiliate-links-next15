'use client';

import { useCallback, useContext } from 'react';
import { LinkPageDispatchContext } from '@/context/link-page-context';

export function useTriggerPreviewReload() {
  const dispatch = useContext(LinkPageDispatchContext);

  const triggerReload = useCallback(() => {
    dispatch?.({ type: 'trigger-reload' });
  }, [dispatch]);

  return triggerReload;
}
