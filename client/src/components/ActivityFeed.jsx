import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getActivitiesPage } from '../redux/slices/activitySlice';
import ActivityCard from './ActivityCard';
import PostActivity from './PostActivity';
import { hashtagSearchToTagsParam } from '../utils/activityHashtags';
import './ActivityFeed.css';

const ActivityFeed = ({ onXPGained }) => {
  const dispatch = useDispatch();
  const { activities, isLoading, isLoadingMore, hasMore, error } = useSelector((state) => state.activities);
  const [showPostModal, setShowPostModal] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [debouncedTags, setDebouncedTags] = useState('');
  const sentinelRef = useRef(null);
  const appendLockRef = useRef(false);
  const loadMoreRef = useRef(() => {});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTags(hashtagSearchToTagsParam(tagSearch)), 350);
    return () => clearTimeout(t);
  }, [tagSearch]);

  useEffect(() => {
    dispatch(getActivitiesPage({ skip: 0, append: false, tags: debouncedTags }));
  }, [dispatch, debouncedTags]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || appendLockRef.current) return;
    appendLockRef.current = true;
    dispatch(
      getActivitiesPage({
        skip: activities.length,
        append: true,
        tags: debouncedTags,
      })
    ).finally(() => {
      appendLockRef.current = false;
    });
  }, [dispatch, activities.length, debouncedTags, hasMore, isLoading, isLoadingMore]);

  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMoreRef.current();
        }
      },
      { root: null, rootMargin: '240px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [debouncedTags, isLoading]);

  const showEmpty = !isLoading && activities.length === 0;
  const tagActive = Boolean(debouncedTags);

  return (
    <div className="activity-feed-container-pro">
      <div className="activity-feed-header-pro">
        <div className="activity-header-content-pro">
          <h2>Activity Feed</h2>
          <p>Share what you have accomplished and discover what others are doing.</p>
        </div>
        <button
          type="button"
          className="create-activity-btn-pro activity-feed-post-desktop-pro"
          onClick={() => setShowPostModal(true)}
        >
          Post Activity
        </button>
      </div>

      <div className="activity-hashtag-search-pro">
        <label htmlFor="activity-tag-search" className="activity-hashtag-label-pro">
          Search by hashtag
        </label>
        <input
          id="activity-tag-search"
          type="search"
          className="activity-hashtag-input-pro"
          placeholder="e.g. leetcode, dailygrind (no # needed)"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="activity-feed-content-pro">
        {error && (
          <div className="activity-feed-error-pro" role="alert">
            {error}
          </div>
        )}
        {isLoading && activities.length === 0 ? (
          <div className="loading-pro">Loading activities…</div>
        ) : showEmpty ? (
          <div className="empty-state-pro">
            <p>{tagActive ? 'No activities match your search.' : 'No activities yet.'}</p>
            <p className="empty-subtitle-pro">
              {tagActive
                ? 'Try another hashtag or clear the search.'
                : 'Post something with hashtags so others can find it.'}
            </p>
          </div>
        ) : (
          <>
            <div className="activity-feed-stack-pro">
              {activities.map((activity) => (
                <ActivityCard key={activity._id} activity={activity} onXPGained={onXPGained} />
              ))}
            </div>
            <div ref={sentinelRef} className="activity-feed-sentinel-pro" aria-hidden />
            {isLoadingMore && <div className="activity-feed-loading-more-pro">Loading more…</div>}
            {!hasMore && activities.length > 0 && (
              <p className="activity-feed-end-pro">You&apos;re all caught up.</p>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="activity-feed-fab-pro"
        onClick={() => setShowPostModal(true)}
        aria-label="Post activity"
      >
        <span className="activity-feed-fab-icon-pro" aria-hidden>
          +
        </span>
      </button>

      {showPostModal && <PostActivity onClose={() => setShowPostModal(false)} onXPGained={onXPGained} />}
    </div>
  );
};

export default ActivityFeed;
