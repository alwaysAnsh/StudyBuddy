import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchMyStudyGroups,
  fetchStudyGroupInvites,
  createStudyGroup,
  acceptStudyRoomInvite,
  declineStudyRoomInvite,
} from '../redux/slices/studyRoomSlice';
import { markScopeRead } from '../redux/slices/notificationSlice';
import { notify } from '../utils/notify';
import AppPageHeader from './AppPageHeader';
import './StudyRooms.css';

const GOAL_TYPES = [
  { value: 'exam', label: 'Exam / certification' },
  { value: 'skill', label: 'Skill building' },
  { value: 'interview_prep', label: 'Interview prep' },
  { value: 'subject', label: 'Subject / course' },
  { value: 'custom', label: 'Custom goal' },
];

function goalTypeLabel(value) {
  return GOAL_TYPES.find((g) => g.value === value)?.label || value;
}

function roomGoalSummary(g) {
  const text = (g.studyGoalText || '').trim();
  if (g.studyGoalType === 'custom') {
    return text || 'Custom goal';
  }
  const lab = goalTypeLabel(g.studyGoalType);
  return text ? `${lab} · ${text}` : lab;
}

const StudyRooms = () => {
  const dispatch = useDispatch();
  const { groups, invites, isLoading } = useSelector((s) => s.studyRooms);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxMembers: 8,
    studyGoalType: 'subject',
    studyGoalText: '',
  });

  useEffect(() => {
    dispatch(fetchMyStudyGroups());
    dispatch(fetchStudyGroupInvites());
    dispatch(markScopeRead('study_rooms'));
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notify({ type: 'error', message: 'Please name your study room.' });
      return;
    }
    if (form.studyGoalType === 'custom' && !form.studyGoalText.trim()) {
      notify({
        type: 'error',
        message: 'Please describe your custom study goal in goal details.',
      });
      return;
    }
    try {
      await dispatch(
        createStudyGroup({
          name: form.name.trim(),
          description: form.description.trim(),
          maxMembers: Number(form.maxMembers),
          studyGoalType: form.studyGoalType,
          studyGoalText: form.studyGoalText.trim(),
        })
      ).unwrap();
      notify({ type: 'success', message: 'Study room created. Invite buddies when you are ready.' });
      setShowCreate(false);
      setForm({
        name: '',
        description: '',
        maxMembers: 8,
        studyGoalType: 'subject',
        studyGoalText: '',
      });
    } catch (err) {
      notify({ type: 'error', message: err || 'Could not create room' });
    }
  };

  return (
    <div className="study-rooms-page">
      <AppPageHeader />
      <div className="study-rooms-hero">
        <h1>Study rooms</h1>
        <p>
          Quiet spaces for shared goals with your buddies: tasks, notes, and time-bound
          challenges. No live chat — just structure, accountability, and XP for showing up
          consistently (not for competing on a leaderboard).
        </p>
      </div>

      <div className="study-rooms-actions">
        <button type="button" className="study-rooms-btn primary" onClick={() => setShowCreate(true)}>
          Create study room
        </button>
      </div>

      {invites.length > 0 && (
        <section className="study-rooms-invites" aria-label="Pending invitations">
          <h2>Invitations</h2>
          {invites.map((inv) => (
            <div key={inv._id} className="invite-row">
              <span>
                <strong>{inv.inviter?.name}</strong> invited you to{' '}
                <strong>{inv.group?.name || 'a study room'}</strong>
              </span>
              <button
                type="button"
                className="study-rooms-btn primary"
                onClick={async () => {
                  try {
                    await dispatch(acceptStudyRoomInvite(inv._id)).unwrap();
                    notify({ type: 'success', message: 'You joined the study room.' });
                    dispatch(fetchMyStudyGroups());
                  } catch (err) {
                    notify({ type: 'error', message: err || 'Could not accept' });
                  }
                }}
              >
                Accept
              </button>
              <button
                type="button"
                className="study-rooms-btn"
                onClick={async () => {
                  try {
                    await dispatch(declineStudyRoomInvite(inv._id)).unwrap();
                  } catch (err) {
                    notify({ type: 'error', message: err || 'Could not decline' });
                  }
                }}
              >
                Decline
              </button>
            </div>
          ))}
        </section>
      )}

      {isLoading && groups.length === 0 ? (
        <p className="study-rooms-loading">Loading…</p>
      ) : groups.length === 0 ? (
        <div className="empty-rooms">
          You are not in any study rooms yet. Create one and invite buddies (max 16 people per
          room).
        </div>
      ) : (
        groups.map((g) => (
          <Link key={g._id} to={`/study-rooms/${g._id}`} className="room-card">
            <h3>{g.name}</h3>
            <div className="room-card-meta">
              {roomGoalSummary(g)} · {g.members?.length || 0} / {g.maxMembers} members
            </div>
          </Link>
        ))
      )}

      {showCreate && (
        <div
          className="modal-overlay sr-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sr-create-title"
          onClick={() => setShowCreate(false)}
        >
          <div className="sr-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 id="sr-create-title">New study room</h2>
            <form onSubmit={handleCreate}>
              <div className="sr-form-group">
                <label htmlFor="sr-name">Room name</label>
                <input
                  id="sr-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={120}
                />
              </div>
              <div className="sr-form-group">
                <label htmlFor="sr-max">Max members (2–16, editable later)</label>
                <input
                  id="sr-max"
                  type="number"
                  min={2}
                  max={16}
                  value={form.maxMembers}
                  onChange={(e) =>
                    setForm({ ...form, maxMembers: Math.min(16, Math.max(2, +e.target.value || 2)) })
                  }
                />
              </div>
              <div className="sr-form-group">
                <label htmlFor="sr-goal-type">Shared study goal</label>
                <select
                  id="sr-goal-type"
                  value={form.studyGoalType}
                  onChange={(e) => setForm({ ...form, studyGoalType: e.target.value })}
                >
                  {GOAL_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sr-form-group">
                <label htmlFor="sr-goal-text">
                  {form.studyGoalType === 'custom'
                    ? 'Describe your custom goal (required)'
                    : 'Goal details (optional)'}
                </label>
                <textarea
                  id="sr-goal-text"
                  rows={3}
                  value={form.studyGoalText}
                  onChange={(e) => setForm({ ...form, studyGoalText: e.target.value })}
                  placeholder={
                    form.studyGoalType === 'custom'
                      ? 'e.g. Pair interview practice — Tuesdays, focus on communication'
                      : 'e.g. AWS SAA — March sitting'
                  }
                  maxLength={500}
                />
                {form.studyGoalType === 'custom' && (
                  <p className="sr-form-hint">
                    Pick &quot;Custom goal&quot; above, then write what this room is for. Everyone
                    will see this text.
                  </p>
                )}
              </div>
              <div className="sr-form-group">
                <label htmlFor="sr-desc">Room notes (optional)</label>
                <textarea
                  id="sr-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="How you want to use this room — habits, meeting rhythm, etc."
                />
              </div>
              <div className="sr-form-actions">
                <button type="button" className="study-rooms-btn" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="study-rooms-btn primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyRooms;
