export const notify = ({ type = 'info', message }) => {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(
    new CustomEvent('app-notify', {
      detail: { type, message: String(message) },
    })
  );
};
