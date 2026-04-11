import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../config/axios';
import ActivityCard from './ActivityCard';
import './PublicActivity.css';

const apiOrigin = () => axiosInstance.defaults.baseURL?.replace(/\/api\/?$/i, '') || '';

const PublicActivity = () => {
  const { code } = useParams();
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setActivity(null);
    setError(null);
    const url = `${apiOrigin()}/api/public/activities/${encodeURIComponent(code || '')}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('notfound');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch(() => {
        if (!cancelled) setError('notfound');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="public-activity-page">
        <header className="public-activity-top">
          <Link to="/" className="public-activity-brand">
            GeekBuddy
          </Link>
        </header>
        <div className="public-activity-center">
          <p className="public-activity-msg">This activity is not available.</p>
          <Link to="/" className="public-activity-home-link">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="public-activity-page">
        <header className="public-activity-top">
          <Link to="/" className="public-activity-brand">
            GeekBuddy
          </Link>
        </header>
        <div className="public-activity-center">
          <p className="public-activity-msg muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-activity-page">
      <header className="public-activity-top">
        <Link to="/" className="public-activity-brand">
          GeekBuddy
        </Link>
        <Link to="/login" className="public-activity-signin">
          Sign in
        </Link>
      </header>
      <main className="public-activity-main">
        <ActivityCard activity={activity} />
        <p className="public-activity-footnote">Shared post · Open the app to post and support activities.</p>
      </main>
    </div>
  );
};

export default PublicActivity;
