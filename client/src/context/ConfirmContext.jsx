import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setOpts({
        title: config.title ?? 'Confirm',
        message: config.message ?? config.body ?? null,
        confirmLabel: config.confirmLabel ?? 'Confirm',
        cancelLabel: config.cancelLabel ?? 'Cancel',
        variant: config.variant ?? 'danger',
      });
    });
  }, []);

  const finish = (value) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setOpts(null);
    r?.(value);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        open={!!opts}
        title={opts?.title ?? ''}
        confirmLabel={opts?.confirmLabel}
        cancelLabel={opts?.cancelLabel}
        variant={opts?.variant}
        onClose={() => finish(false)}
        onConfirm={() => finish(true)}
      >
        {typeof opts?.message === 'string' ? <p style={{ margin: 0 }}>{opts.message}</p> : opts?.message}
      </ConfirmModal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
