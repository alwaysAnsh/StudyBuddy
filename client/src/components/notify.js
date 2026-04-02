export const notify = ({ type = 'info', message }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app-notify', {
      detail: { type, message }
    })
  );
};
