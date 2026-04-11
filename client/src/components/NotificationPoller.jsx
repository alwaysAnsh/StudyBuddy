import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotificationCounts } from '../redux/slices/notificationSlice';

const NotificationPoller = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    dispatch(fetchNotificationCounts());
    const t = setInterval(() => dispatch(fetchNotificationCounts()), 40000);
    const onFocus = () => dispatch(fetchNotificationCounts());
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, dispatch]);

  return null;
};

export default NotificationPoller;
