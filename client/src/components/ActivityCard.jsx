import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteActivity, toggleSupport } from '../redux/slices/activitySlice';
import { getCurrentUser } from '../redux/slices/authSlice';
import './ActivityCard.css';
import { useConfirm } from '../context/ConfirmContext';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
import { resolveUserAvatarUrl, uiAvatarsFallback } from '../utils/avatarUrl';
import { notify } from '../utils/notify';

const uid = (u) => String(u?._id || u?.id || '');

const XP_SUPPORT = 3;

const ActivityCard = ({ activity, onXPGained }) => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const supporters = activity.supportedBy || [];
  const supported = supporters.some((u) => uid(u) === uid(user));
  const supportCount = supporters.length;
  const isCreator = uid(activity.createdBy) === uid(user);

  const sharePath = useMemo(() => {
    const code = activity.shareCode || activity._id;
    return `${window.location.origin}/p/${code}`;
  }, [activity.shareCode, activity._id]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this activity?',
      message: 'This removes the activity for everyone in the feed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    dispatch(deleteActivity(activity._id));
  };

  const handleSupport = async () => {
    const wasSupported = supported;
    try {
      const updated = await dispatch(toggleSupport(activity._id)).unwrap();
      await dispatch(getCurrentUser()).unwrap();
      const nowSupported = (updated.supportedBy || []).some((u) => uid(u) === uid(user));
      if (!wasSupported && nowSupported && !isCreator && onXPGained) {
        onXPGained(XP_SUPPORT);
      }
    } catch {
      notify({ type: 'error', message: 'Could not update support.' });
    }
  };

  const handleShare = useCallback(async () => {
    const text = sharePath;
    try {
      if (navigator.share) {
        await navigator.share({ title: activity.title, text: activity.description?.slice(0, 200), url: text });
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }
    try {
      await navigator.clipboard.writeText(text);
      notify({ type: 'success', message: 'Link copied to clipboard.' });
    } catch {
      notify({ type: 'error', message: 'Could not copy link.' });
    }
  }, [sharePath, activity.title, activity.description]);

  const formatDate = (date) =>
    new Date(date).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const imgUrl = activity.imageUrl ? resolveMediaUrl(activity.imageUrl) : '';

  return (
    <article className="ig-activity-card">
      <header className="ig-activity-head">
        <div className="ig-activity-user">
          <img
            className="ig-activity-avatar"
            src={resolveUserAvatarUrl(activity.createdBy)}
            alt=""
            onError={(e) => {
              e.target.src = uiAvatarsFallback(activity.createdBy?.name || '?', 128);
            }}
          />
          <div className="ig-activity-names">
            <span className="ig-activity-display-name">{activity.createdBy?.name || 'Member'}</span>
            <span className="ig-activity-handle">@{activity.createdBy?.username || 'user'}</span>
          </div>
        </div>
        <div className="ig-activity-head-actions">
          {isCreator && (
            <button type="button" className="ig-activity-icon-btn" onClick={handleDelete} title="Delete" aria-label="Delete">
              🗑
            </button>
          )}
        </div>
      </header>

      {imgUrl ? (
        <div className="ig-activity-media">
          <img src={imgUrl} alt="" className="ig-activity-image" />
        </div>
      ) : null}

      <div className="ig-activity-actions">
        {isAuthenticated ? (
        <button
          type="button"
          className={`ig-activity-action ig-support ${supported ? 'active' : ''}`}
          onClick={handleSupport}
          aria-pressed={supported}
          aria-label={supported ? 'Remove support' : 'Support'}
        >
          <span className="ig-support-icon" aria-hidden>
            ◎
          </span>
          <span className="ig-support-label">Support</span>
          {supportCount > 0 && <span className="ig-support-count">{supportCount}</span>}
        </button>
        ) : supportCount > 0 ? (
          <span className="ig-support-readonly" aria-label={`${supportCount} supports`}>
            <span className="ig-support-icon" aria-hidden>◎</span>
            <span className="ig-support-count">{supportCount}</span>
          </span>
        ) : null}
        <button type="button" className="ig-activity-action ig-share" onClick={handleShare} aria-label="Share link">
          <span aria-hidden>↗</span>
          <span>Share</span>
        </button>
      </div>

      <div className="ig-activity-body">
        <h3 className="ig-activity-title">{activity.title}</h3>
        <p className="ig-activity-desc">{activity.description}</p>
        {(activity.hashtags || []).length > 0 && (
          <p className="ig-activity-tags">
            {activity.hashtags.map((t) => (
              <span key={t} className="ig-tag">
                #{t}
              </span>
            ))}
          </p>
        )}
        {activity.link ? (
          <a href={activity.link} target="_blank" rel="noopener noreferrer" className="ig-activity-link">
            {activity.link.replace(/^https?:\/\//, '').slice(0, 48)}
            {activity.link.length > 52 ? '…' : ''}
          </a>
        ) : null}
        <time className="ig-activity-time" dateTime={activity.createdAt}>
          {formatDate(activity.createdAt)}
        </time>
      </div>
    </article>
  );
};

export default ActivityCard;
