import React, { useEffect, useRef, useState } from 'react';
import './ToastHost.css';

const AUTO_DISMISS_MS = 3200;

const ToastHost = () => {
  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotify = (event) => {
      const { type = 'info', message = '' } = event.detail || {};
      if (!message) return;
      const id = toastIdRef.current + 1;
      toastIdRef.current = id;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, AUTO_DISMISS_MS);
    };

    window.addEventListener('app-notify', handleNotify);
    return () => window.removeEventListener('app-notify', handleNotify);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
