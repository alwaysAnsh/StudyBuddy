import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Quill from 'quill';
import DOMPurify from 'dompurify';
import 'quill/dist/quill.snow.css';
import AppPageHeader from './AppPageHeader';
import { useConfirm } from '../context/ConfirmContext';
import {
  loadStudyRoom,
  clearStudyRoomDetail,
  updateStudyGroup,
  deleteStudyGroup,
  leaveStudyGroup,
  inviteBuddyToRoom,
  createRoomTask,
  updateRoomTaskProgress,
  deleteRoomTask,
  createRoomNote,
  deleteRoomNote,
  createRoomChallenge,
  completeRoomChallenge,
} from '../redux/slices/studyRoomSlice';
import { getBuddies } from '../redux/slices/buddySlice';
import { markScopeRead } from '../redux/slices/notificationSlice';
import axiosInstance from '../config/axios';
import { notify } from '../utils/notify';
import './StudyRoomDetail.css';

const GOAL_LABELS = {
  exam: 'Exam / certification',
  skill: 'Skill building',
  interview_prep: 'Interview prep',
  subject: 'Subject / course',
  custom: 'Custom goal',
};

function formatRoomGoalLine(group) {
  if (!group) return '';
  const text = (group.studyGoalText || '').trim();
  if (group.studyGoalType === 'custom') {
    return text || GOAL_LABELS.custom;
  }
  const label = GOAL_LABELS[group.studyGoalType] || group.studyGoalType;
  return text ? `${label} — ${text}` : label;
}

const STATUS_OPTIONS = [
  { value: 'not completed', label: 'Not started' },
  { value: 'completed', label: 'Completed' },
  { value: 'mark as read', label: 'Read' },
  { value: 'need revision', label: 'Need revision' },
];

const uidStr = (u) => String(u?._id || u?.id || '');

const uploadsOrigin = () => {
  const base = axiosInstance.defaults.baseURL || '';
  return base.replace(/\/api\/?$/i, '') || '';
};

const publicFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${uploadsOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Start of today (local) for datetime-local `min` — disables past calendar days. */
function localTodayDatetimeLocalMin() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00`;
}

function isBeforeStartOfToday(value) {
  if (!value) return false;
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t < start;
}

function RoomRichTextEditor({ resetKey, onHtmlChange, placeholder }) {
  const mountRef = useRef(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const host = document.createElement('div');
    mount.appendChild(host);
    const quill = new Quill(host, {
      theme: 'snow',
      placeholder: placeholder || '',
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block', 'link'],
          ['clean'],
        ],
      },
    });
    const handler = () => onHtmlChange(quill.root.innerHTML);
    quill.on('text-change', handler);
    return () => {
      quill.off('text-change', handler);
      mount.innerHTML = '';
    };
  }, [resetKey, onHtmlChange, placeholder]);
  return <div ref={mountRef} className="srd-quill-host" />;
}

const StudyRoomDetail = () => {
  const { groupId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { detail, isLoading } = useSelector((s) => s.studyRooms);
  const buddies = useSelector((s) => s.buddies.buddies);
  const [tab, setTab] = useState('overview');
  const { confirm } = useConfirm();

  const group = detail.group;
  const tasks = detail.tasks || [];
  const notes = detail.notes || [];
  const challenges = detail.challenges || [];
  const progress = detail.progress;

  const memberIds = useMemo(
    () => new Set((group?.members || []).map((m) => String(m._id))),
    [group]
  );

  const inviteCandidates = useMemo(
    () => (buddies || []).filter((b) => !memberIds.has(String(b._id))),
    [buddies, memberIds]
  );

  useEffect(() => {
    if (!groupId) return undefined;
    dispatch(loadStudyRoom(groupId));
    dispatch(getBuddies());
    dispatch(markScopeRead('study_rooms'));
    return () => {
      dispatch(clearStudyRoomDetail());
    };
  }, [dispatch, groupId]);

  const isCreator =
    group && uidStr(group.createdBy) === uidStr(user);
  const isMember = group && (group.members || []).some((m) => uidStr(m) === uidStr(user));

  const myProgressRow = (task) =>
    (task.progress || []).find((p) => uidStr(p.user) === uidStr(user));

  const handleInvite = async (buddyId) => {
    try {
      await dispatch(inviteBuddyToRoom({ groupId, buddyUserId: buddyId })).unwrap();
      await dispatch(loadStudyRoom(groupId)).unwrap();
      notify({ type: 'success', message: 'Invitation sent.' });
    } catch (e) {
      notify({ type: 'error', message: e || 'Invite failed' });
    }
  };

  const handleLeaveOrDeleteClick = async () => {
    if (isCreator) {
      const ok = await confirm({
        title: 'Delete this study room?',
        message:
          'This removes the room and all tasks, notes, and challenges. This cannot be undone.',
        confirmLabel: 'Delete room',
        variant: 'danger',
      });
      if (!ok) return;
      try {
        await dispatch(deleteStudyGroup(groupId)).unwrap();
        notify({ type: 'success', message: 'Study room removed.' });
        navigate('/study-rooms');
      } catch (e) {
        notify({ type: 'error', message: e || 'Delete failed' });
      }
    } else {
      const ok = await confirm({
        title: 'Leave this study room?',
        message: 'You can rejoin only if someone invites you again.',
        confirmLabel: 'Leave room',
        variant: 'primary',
      });
      if (!ok) return;
      try {
        await dispatch(leaveStudyGroup(groupId)).unwrap();
        notify({ type: 'success', message: 'You left the room.' });
        navigate('/study-rooms');
      } catch (e) {
        notify({ type: 'error', message: e || 'Could not leave' });
      }
    }
  };

  const handleDeleteTaskRequest = async (task) => {
    const ok = await confirm({
      title: 'Delete this task?',
      message: (
        <p style={{ margin: 0 }}>
          Remove <strong>{task.title}</strong> from this room?
        </p>
      ),
      confirmLabel: 'Delete task',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await dispatch(deleteRoomTask({ groupId, taskId: task._id })).unwrap();
      await dispatch(loadStudyRoom(groupId)).unwrap();
      notify({ type: 'success', message: 'Task removed.' });
    } catch (e) {
      notify({ type: 'error', message: e || 'Delete failed' });
    }
  };

  const handleDeleteNoteRequest = async (noteId) => {
    const ok = await confirm({
      title: 'Delete this note?',
      message: 'This note will be removed for everyone in the room.',
      confirmLabel: 'Delete note',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await dispatch(deleteRoomNote({ groupId, noteId })).unwrap();
      await dispatch(loadStudyRoom(groupId)).unwrap();
      notify({ type: 'success', message: 'Note removed.' });
    } catch (e) {
      notify({ type: 'error', message: e || 'Failed' });
    }
  };

  if (!group && isLoading) {
    return (
      <div className="srd-page">
        <p>Loading study room…</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="srd-page">
        <p>Room not found or you do not have access.</p>
        <Link to="/study-rooms" className="srd-back">
          ← Study rooms
        </Link>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="srd-page">
        <p>You are not a member of this room.</p>
        <Link to="/study-rooms" className="srd-back">
          ← Study rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="srd-page">
      <AppPageHeader />
      <Link to="/study-rooms" className="srd-back">
        ← All study rooms
      </Link>
      <header className="srd-header">
        <div>
          <h1>{group.name}</h1>
          <p className="srd-sub">
            {formatRoomGoalLine(group)} · {group.members?.length} / {group.maxMembers} members ·
            structured focus, no live chat
          </p>
        </div>
        <div className="srd-row-actions">
          <button type="button" className="srd-btn danger" onClick={handleLeaveOrDeleteClick}>
            {isCreator ? 'Delete room' : 'Leave room'}
          </button>
        </div>
      </header>

      <nav className="srd-tabs" aria-label="Study room sections">
        {['overview', 'tasks', 'progress', 'notes', 'challenges'].map((t) => (
          <button
            key={t}
            type="button"
            className={`srd-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'progress' ? 'Member progress' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <OverviewPanel
          group={group}
          groupId={groupId}
          isCreator={isCreator}
          inviteCandidates={inviteCandidates}
          onInvite={handleInvite}
          dispatch={dispatch}
        />
      )}
      {tab === 'tasks' && (
        <TasksPanel
          groupId={groupId}
          tasks={tasks}
          members={group.members}
          user={user}
          myProgressRow={myProgressRow}
          dispatch={dispatch}
          refresh={() => dispatch(loadStudyRoom(groupId))}
          onRequestDeleteTask={handleDeleteTaskRequest}
        />
      )}
      {tab === 'progress' && (
        <div className="srd-panel">
          <h2>Progress (supportive view)</h2>
          <p className="srd-muted" style={{ marginBottom: '1rem' }}>
            Sorted alphabetically — celebrate consistency, not rankings. Ratios are based on room
            tasks where this member has a row.
          </p>
          {(progress?.members || []).map((row) => (
            <div key={row.user._id} className="srd-progress-card">
              <h4>{row.user.name}</h4>
              <p className="srd-muted" style={{ margin: 0 }}>
                {row.completedTasks} / {row.applicableTasks || '—'} tasks completed
                {row.completionRatio != null ? ` (${row.completionRatio}%)` : ''}
              </p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{row.encouragement}</p>
            </div>
          ))}
        </div>
      )}
      {tab === 'notes' && (
        <NotesPanel
          groupId={groupId}
          notes={notes}
          user={user}
          dispatch={dispatch}
          refresh={() => dispatch(loadStudyRoom(groupId))}
          onRequestDeleteNote={handleDeleteNoteRequest}
        />
      )}
      {tab === 'challenges' && (
        <ChallengesPanel
          groupId={groupId}
          challenges={challenges}
          user={user}
          dispatch={dispatch}
          refresh={() => dispatch(loadStudyRoom(groupId))}
        />
      )}
    </div>
  );
};

function OverviewPanel({ group, groupId, isCreator, inviteCandidates, onInvite, dispatch }) {
  const pendingInviteeIds = useMemo(
    () => new Set((group.outgoingPendingInvites || []).map((inv) => uidStr(inv.invitee))),
    [group.outgoingPendingInvites]
  );
  const [edit, setEdit] = useState({
    name: group.name,
    description: group.description || '',
    studyGoalType: group.studyGoalType,
    studyGoalText: group.studyGoalText || '',
    maxMembers: group.maxMembers,
  });

  useEffect(() => {
    setEdit({
      name: group.name,
      description: group.description || '',
      studyGoalType: group.studyGoalType,
      studyGoalText: group.studyGoalText || '',
      maxMembers: group.maxMembers,
    });
  }, [group]);

  const save = async (e) => {
    e.preventDefault();
    if (!isCreator) return;
    if (edit.studyGoalType === 'custom' && !edit.studyGoalText.trim()) {
      notify({ type: 'error', message: 'Describe your custom goal in goal details.' });
      return;
    }
    try {
      const payload = {
        groupId,
        name: edit.name,
        description: edit.description,
        studyGoalType: edit.studyGoalType,
        studyGoalText: edit.studyGoalText,
        maxMembers: Number(edit.maxMembers),
      };
      await dispatch(updateStudyGroup(payload)).unwrap();
      notify({ type: 'success', message: 'Room updated.' });
      dispatch(loadStudyRoom(groupId));
    } catch (err) {
      notify({ type: 'error', message: err || 'Update failed' });
    }
  };

  return (
    <div className="srd-panel">
      <h2>Room purpose & settings</h2>
      {isCreator ? (
        <p className="srd-muted">
          You are the creator — you can update the room name, goal, description, and member cap
          (cannot go below current headcount).
        </p>
      ) : (
        <p className="srd-muted">Only the room creator can change these details.</p>
      )}
      {isCreator ? (
        <form onSubmit={save} className="srd-inline-form">
          <label>
            Name
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              required
            />
          </label>
          <label>
            Member cap
            <input
              type="number"
              min={Math.max(2, group.members?.length || 2)}
              max={16}
              value={edit.maxMembers}
              onChange={(e) => setEdit({ ...edit, maxMembers: +e.target.value })}
            />
          </label>
          <label>
            Goal type
            <select
              value={edit.studyGoalType}
              onChange={(e) => setEdit({ ...edit, studyGoalType: e.target.value })}
            >
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            {edit.studyGoalType === 'custom' ? 'Describe your custom goal (required)' : 'Goal details'}
            <textarea
              rows={2}
              value={edit.studyGoalText}
              onChange={(e) => setEdit({ ...edit, studyGoalText: e.target.value })}
              placeholder={
                edit.studyGoalType === 'custom'
                  ? 'e.g. Weekly system-design deep dives with rotating presenters'
                  : 'e.g. AWS SAA — March sitting'
              }
            />
          </label>
          <label>
            Room notes
            <textarea
              rows={2}
              value={edit.description}
              onChange={(e) => setEdit({ ...edit, description: e.target.value })}
            />
          </label>
          <button type="submit" className="srd-btn primary">
            Save changes
          </button>
        </form>
      ) : (
        <dl className="srd-room-readonly">
          <dt>Name</dt>
          <dd>{group.name}</dd>
          <dt>Members</dt>
          <dd>
            {group.members?.length} / {group.maxMembers}
          </dd>
          <dt>Goal</dt>
          <dd>{formatRoomGoalLine(group)}</dd>
          <dt>Room notes</dt>
          <dd>{group.description || '—'}</dd>
        </dl>
      )}

      <h3 style={{ marginTop: '1.5rem', fontSize: '1rem' }}>Invite a buddy</h3>
      <p className="srd-muted">Only people you are already buddies with can join.</p>
      {group.members?.length >= group.maxMembers ? (
        <p className="srd-muted">Room is full.</p>
      ) : inviteCandidates.length === 0 ? (
        <p className="srd-muted">No buddies left to invite, or everyone is already here.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {inviteCandidates.map((b) => {
            const sent = pendingInviteeIds.has(uidStr(b._id));
            return (
              <li key={b._id} style={{ marginBottom: '0.35rem' }}>
                {b.name} (@{b.username}){' '}
                {sent ? (
                  <span className="srd-invite-sent">Invitation sent</span>
                ) : (
                  <button type="button" className="srd-btn primary" onClick={() => onInvite(b._id)}>
                    Invite
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TasksPanel({ groupId, tasks, members, user, myProgressRow, dispatch, refresh, onRequestDeleteTask }) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [scope, setScope] = useState('group');
  const [assignedTo, setAssignedTo] = useState('');
  const [due, setDue] = useState('');

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (due && isBeforeStartOfToday(due)) {
      notify({ type: 'error', message: 'Due date cannot be before today.' });
      return;
    }
    try {
      await dispatch(
        createRoomTask({
          groupId,
          title: title.trim(),
          link: link.trim(),
          scope,
          assignedTo: scope === 'individual' ? assignedTo : undefined,
          dueDate: due || undefined,
        })
      ).unwrap();
      setTitle('');
      setLink('');
      refresh();
      notify({ type: 'success', message: 'Room task added.' });
    } catch (err) {
      notify({ type: 'error', message: err || 'Could not add task' });
    }
  };

  const setStatus = async (task, status) => {
    const row = myProgressRow(task);
    if (!row) {
      notify({ type: 'error', message: 'No assignment row for you on this task.' });
      return;
    }
    try {
      const res = await dispatch(
        updateRoomTaskProgress({
          groupId,
          taskId: task._id,
          status,
          personalNotes: row.personalNotes,
        })
      ).unwrap();
      refresh();
      const xp = res.task?.xpEarned ?? res.xpEarned;
      if (xp > 0) {
        notify({
          type: 'success',
          message: `Marked complete — +${xp} XP for consistency.`,
        });
      }
    } catch (err) {
      notify({ type: 'error', message: err || 'Update failed' });
    }
  };

  return (
    <div>
      <div className="srd-panel">
        <h2>Add a study task</h2>
        <p className="srd-muted">
          Group tasks give every member their own status row. Individual tasks target one member.
          Deadlines are optional.
        </p>
        <form onSubmit={addTask} className="srd-inline-form">
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="group">Everyone (group task)</option>
            <option value="individual">One member (individual)</option>
          </select>
          {scope === 'individual' && (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required={scope === 'individual'}
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="datetime-local"
            value={due}
            min={localTodayDatetimeLocalMin()}
            onChange={(e) => setDue(e.target.value)}
          />
          <button type="submit" className="srd-btn primary">
            Add task
          </button>
        </form>
      </div>

      <div className="srd-task-list">
        {tasks.map((task) => {
          const mine = myProgressRow(task);
          const dueStr = task.dueDate
            ? new Date(task.dueDate).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : null;
          const addedStr = task.createdAt
            ? new Date(task.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : null;
          const canDelete = uidStr(task.assignedBy) === uidStr(user);
          return (
            <article key={task._id} className="srd-task-card">
              <div className="srd-task-card__head">
                <h3 className="srd-task-card__title">{task.title}</h3>
                {canDelete && (
                  <button
                    type="button"
                    className="srd-btn srd-btn-ghost-danger"
                    onClick={() => onRequestDeleteTask(task)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="srd-task-card__pills">
                <span className="srd-pill srd-pill-accent">
                  {task.scope === 'group' ? 'Group task' : 'Individual'}
                </span>
                {task.scope === 'individual' && task.assignedTo && (
                  <span className="srd-pill">Assigned to {task.assignedTo.name}</span>
                )}
                {dueStr ? <span className="srd-pill srd-pill-due">Due {dueStr}</span> : <span className="srd-pill srd-pill-muted">No due date</span>}
              </div>
              <p className="srd-task-card__byline">
                <span className="srd-byline-label">Added by</span>{' '}
                <strong>{task.assignedBy?.name || 'Member'}</strong>
                {addedStr ? (
                  <>
                    {' '}
                    <span className="srd-byline-sep">·</span> {addedStr}
                  </>
                ) : null}
              </p>
              {task.link ? (
                <a className="srd-link-out" href={task.link} target="_blank" rel="noreferrer">
                  Open resource link
                </a>
              ) : null}
              <div className="srd-task-card__status">
                {mine ? (
                  <>
                    <span className="srd-status-label">Your status</span>
                    <div className="srd-status-row">
                      {STATUS_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`srd-status-btn ${mine.status === o.value ? 'active' : ''}`}
                          onClick={() => setStatus(task, o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="srd-muted srd-task-card__no-row">You do not have a progress row on this task.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {tasks.length === 0 && <p className="srd-muted srd-empty-hint">No tasks yet.</p>}
    </div>
  );
}

function NotesPanel({ groupId, notes, user, dispatch, refresh, onRequestDeleteNote }) {
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [editorReset, setEditorReset] = useState(0);
  const [url, setUrl] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const uploadResource = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${uploadsOrigin()}/api/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || res.statusText || 'Upload failed');
      }
      setAttachments((prev) =>
        [...prev, { url: data.url, originalName: data.originalName || file.name }].slice(0, 8)
      );
      notify({ type: 'success', message: 'File attached.' });
    } catch (err) {
      notify({ type: 'error', message: err?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await dispatch(
        createRoomNote({
          groupId,
          title: title.trim(),
          contentHtml,
          resourceUrl: url,
          attachments,
        })
      ).unwrap();
      setTitle('');
      setContentHtml('');
      setEditorReset((k) => k + 1);
      setUrl('');
      setAttachments([]);
      refresh();
      notify({ type: 'success', message: 'Note added.' });
    } catch (err) {
      notify({ type: 'error', message: err || 'Failed' });
    }
  };

  return (
    <div>
      <div className="srd-panel">
        <h2>Share a note or resource</h2>
        <p className="srd-muted">Rich text, optional link, and up to eight file attachments (8 MB each).</p>
        <form onSubmit={add} className="srd-note-form">
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label className="srd-label">Body</label>
          <div className="srd-quill-wrap">
            <RoomRichTextEditor
              resetKey={editorReset}
              onHtmlChange={setContentHtml}
              placeholder="Write something for the room…"
            />
          </div>
          <input placeholder="Resource URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div className="srd-file-row">
            <label className="srd-file-label">
              <input
                type="file"
                disabled={uploading || attachments.length >= 8}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) uploadResource(f);
                }}
              />
              <span>{uploading ? 'Uploading…' : 'Attach file'}</span>
            </label>
            {attachments.length > 0 && (
              <ul className="srd-attach-list">
                {attachments.map((a) => (
                  <li key={a.url}>
                    <a href={publicFileUrl(a.url)} target="_blank" rel="noreferrer">
                      {a.originalName || 'File'}
                    </a>
                    <button
                      type="button"
                      className="srd-btn danger srd-btn-tiny"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.url !== a.url))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="srd-btn primary" disabled={uploading}>
            Post
          </button>
        </form>
      </div>
      <div className="srd-panel srd-panel-flush">
        <h2 className="srd-panel-title">Room notes</h2>
        <div className="srd-note-list">
          {notes.map((n) => {
            const posted = n.createdAt
              ? new Date(n.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : null;
            return (
              <article key={n._id} className="srd-note-card">
                <div className="srd-note-card__head">
                  <h3 className="srd-note-card__title">{n.title}</h3>
                  {uidStr(n.createdBy) === uidStr(user) && (
                    <button
                      type="button"
                      className="srd-btn srd-btn-ghost-danger"
                      onClick={() => onRequestDeleteNote(n._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="srd-note-card__byline">
                  <span className="srd-byline-label">Posted by</span> <strong>{n.createdBy?.name || 'Member'}</strong>
                  {posted ? (
                    <>
                      {' '}
                      <span className="srd-byline-sep">·</span> {posted}
                    </>
                  ) : null}
                </p>
                {n.contentHtml ? (
                  <div
                    className="srd-note-html"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.contentHtml) }}
                  />
                ) : (
                  <p className="srd-note-plain">{n.content}</p>
                )}
                {n.resourceUrl ? (
                  <a className="srd-link-out" href={n.resourceUrl} target="_blank" rel="noreferrer">
                    Resource link
                  </a>
                ) : null}
                {(n.attachments || []).length > 0 && (
                  <ul className="srd-note-files">
                    {n.attachments.map((a) => (
                      <li key={a.url}>
                        <a href={publicFileUrl(a.url)} target="_blank" rel="noreferrer">
                          {a.originalName || 'Download'}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
        {notes.length === 0 && <p className="srd-muted srd-empty-hint">No notes yet.</p>}
      </div>
    </div>
  );
}

function ChallengesPanel({ groupId, challenges, user, dispatch, refresh }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cadence, setCadence] = useState('weekly');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [xpReward, setXpReward] = useState(5);

  const todayMin = localTodayDatetimeLocalMin();

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) {
      notify({ type: 'error', message: 'Title and start/end times are required.' });
      return;
    }
    if (isBeforeStartOfToday(startsAt) || isBeforeStartOfToday(endsAt)) {
      notify({ type: 'error', message: 'Start and end cannot be before today.' });
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      notify({ type: 'error', message: 'End time must be after start time.' });
      return;
    }
    try {
      await dispatch(
        createRoomChallenge({
          groupId,
          title: title.trim(),
          description,
          cadence,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          xpReward: Number(xpReward),
        })
      ).unwrap();
      setTitle('');
      setDescription('');
      refresh();
      notify({ type: 'success', message: 'Challenge created.' });
    } catch (err) {
      notify({ type: 'error', message: err || 'Failed' });
    }
  };

  const complete = async (c) => {
    try {
      const res = await dispatch(completeRoomChallenge({ groupId, challengeId: c._id })).unwrap();
      refresh();
      if (res.xpEarned) {
        notify({ type: 'success', message: `Challenge logged — +${res.xpEarned} XP.` });
      } else {
        notify({ type: 'success', message: 'Challenge marked complete.' });
      }
    } catch (err) {
      notify({ type: 'error', message: err || 'Not available' });
    }
  };

  const now = Date.now();
  const myPart = (c) =>
    (c.participations || []).find((p) => uidStr(p.user) === uidStr(user));

  return (
    <div>
      <div className="srd-panel">
        <h2>New time-bound challenge</h2>
        <p className="srd-muted">
          Daily, weekly, or sprint-style windows. XP rewards showing up, not beating others.
        </p>
        <form onSubmit={add} className="srd-inline-form">
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          <select value={cadence} onChange={(e) => setCadence(e.target.value)}>
            <option value="daily">Daily window</option>
            <option value="weekly">Weekly window</option>
            <option value="sprint">Sprint window</option>
          </select>
          <label className="srd-muted">
            Starts
            <input
              type="datetime-local"
              value={startsAt}
              min={todayMin}
              onChange={(e) => {
                const v = e.target.value;
                setStartsAt(v);
                if (endsAt && v && endsAt < v) setEndsAt(v);
              }}
            />
          </label>
          <label className="srd-muted">
            Ends
            <input
              type="datetime-local"
              value={endsAt}
              min={
                startsAt && startsAt >= todayMin ? startsAt : todayMin
              }
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
          <label className="srd-muted">
            XP reward (0–50)
            <input
              type="number"
              min={0}
              max={50}
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
            />
          </label>
          <button type="submit" className="srd-btn primary">
            Create challenge
          </button>
        </form>
      </div>

      {challenges.map((c) => {
        const start = new Date(c.startsAt).getTime();
        const end = new Date(c.endsAt).getTime();
        const active = now >= start && now <= end;
        const part = myPart(c);
        const done = !!part?.completedAt;
        return (
          <div key={c._id} className="srd-challenge">
            <strong>{c.title}</strong>
            <span className="srd-muted"> · {c.cadence}</span>
            <p className="srd-muted" style={{ margin: '0.35rem 0' }}>
              {new Date(c.startsAt).toLocaleString()} — {new Date(c.endsAt).toLocaleString()}
            </p>
            {c.description && <p>{c.description}</p>}
            {active && !done && (
              <button type="button" className="srd-btn primary" onClick={() => complete(c)}>
                I completed this challenge window
              </button>
            )}
            {done && <p className="srd-muted">You logged this challenge ✓</p>}
            {!active && !done && <p className="srd-muted">Outside the active window.</p>}
          </div>
        );
      })}
      {challenges.length === 0 && <p className="srd-muted">No challenges yet.</p>}
    </div>
  );
}

export default StudyRoomDetail;
