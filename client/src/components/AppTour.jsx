import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './AppTour.css';

const TOUR_DONE_KEY = 'karya_tour_completed_v1';
export const APP_TOUR_EVENT = 'karya:start-tour';

const TOUR_STEPS = [
  {
    path: '/dashboard',
    title: 'Welcome to GeekBuddy',
    description: 'This dashboard is your base: tasks, notes, activity, and your XP progress.',
    tip: 'For best experience, use GeekBuddy on a large screen (laptop/desktop).',
  },
  {
    path: '/dashboard',
    title: 'Tabs and Daily Workflow',
    description: 'Switch tabs to manage My Tasks, Assigned by Me, Shared Notes, and Activity Feed.',
  },
  {
    path: '/dashboard',
    title: 'Profile and Progress',
    description:
      'Left sidebar shows level, XP, streak, and stats. Tap "View all levels" to see the full progression ladder.',
  },
  {
    path: '/buddies',
    title: 'Buddies',
    description: 'Find people, send buddy requests, and manage incoming or sent requests.',
  },
  {
    path: '/study-rooms',
    title: 'Study Rooms',
    description:
      'Create focused rooms with buddies, then collaborate using tasks, notes, and challenges.',
  },
  {
    path: '/notifications',
    title: 'Notifications',
    description: 'All updates from buddies, study rooms, and task activity appear here.',
  },
];

const AppTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      return;
    }
    const done = localStorage.getItem(TOUR_DONE_KEY) === 'true';
    if (!done) setOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    const onStartTour = () => {
      if (!isAuthenticated) return;
      setStepIndex(0);
      setOpen(true);
      localStorage.removeItem(TOUR_DONE_KEY);
    };
    window.addEventListener(APP_TOUR_EVENT, onStartTour);
    return () => window.removeEventListener(APP_TOUR_EVENT, onStartTour);
  }, [isAuthenticated]);

  const step = TOUR_STEPS[stepIndex];
  const progressText = useMemo(
    () => `${stepIndex + 1} / ${TOUR_STEPS.length}`,
    [stepIndex]
  );

  useEffect(() => {
    if (!open || !step) return;
    if (location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [open, step, location.pathname, navigate]);

  const closeTour = () => {
    localStorage.setItem(TOUR_DONE_KEY, 'true');
    setOpen(false);
  };

  const onNext = () => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      closeTour();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const onBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  };

  if (!isAuthenticated || !open || !step) return null;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Application tour">
      <div className="tour-card">
        <div className="tour-progress">{progressText}</div>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        {step.tip ? <p className="tour-tip">{step.tip}</p> : null}
        <div className="tour-actions">
          <button type="button" className="tour-btn" onClick={onBack} disabled={stepIndex === 0}>
            Back
          </button>
          <button type="button" className="tour-btn danger" onClick={closeTour}>
            Skip all
          </button>
          <button type="button" className="tour-btn primary" onClick={onNext}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
