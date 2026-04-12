import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { notifyUser } from './notifications.js';

function sanitizeRich(html = '') {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'span', 'u']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
  });
}

const STUDY_GOAL_TYPES = ['exam', 'skill', 'interview_prep', 'subject', 'custom'];
const ROOM_TASK_STATUSES = [
  'completed',
  'mark as read',
  'not completed',
  'need revision',
];

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  maxMembers: { type: Number, min: 2, max: 16, default: 8 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  studyGoalType: {
    type: String,
    enum: STUDY_GOAL_TYPES,
    default: 'subject',
  },
  studyGoalText: { type: String, default: '', maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

studyGroupSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const studyGroupInviteSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

studyGroupInviteSchema.index(
  { group: 1, invitee: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

const progressEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ROOM_TASK_STATUSES,
      default: 'not completed',
    },
    personalNotes: { type: String, default: '' },
    xpAwarded: { type: Boolean, default: false },
    firstCompletedAt: { type: Date, default: null },
    completionCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studyRoomTaskSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  link: { type: String, default: '' },
  scope: { type: String, enum: ['individual', 'group'], required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: { type: Date, default: null },
  progress: [progressEntrySchema],
  createdAt: { type: Date, default: Date.now },
});

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, default: '' },
  },
  { _id: false }
);

const studyRoomNoteSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  contentHtml: { type: String, default: '' },
  resourceUrl: { type: String, default: '' },
  attachments: [attachmentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const participationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
    xpGranted: { type: Boolean, default: false },
  },
  { _id: false }
);

const studyRoomChallengeSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cadence: { type: String, enum: ['daily', 'weekly', 'sprint'], required: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  xpReward: { type: Number, default: 5, min: 0, max: 50 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participations: [participationSchema],
  createdAt: { type: Date, default: Date.now },
});

export const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);
export const StudyGroupInvite = mongoose.model(
  'StudyGroupInvite',
  studyGroupInviteSchema
);
export const StudyRoomTask = mongoose.model('StudyRoomTask', studyRoomTaskSchema);
export const StudyRoomNote = mongoose.model('StudyRoomNote', studyRoomNoteSchema);
export const StudyRoomChallenge = mongoose.model(
  'StudyRoomChallenge',
  studyRoomChallengeSchema
);

const ROOM_TASK_XP = 5;

/** ObjectId or populated subdoc `{ _id, ... }` — never use raw `.toString()` on populated users. */
function refId(ref) {
  if (ref == null) return '';
  if (typeof ref === 'object' && ref._id != null) return ref._id.toString();
  return ref.toString();
}

const isMember = (group, userId) => {
  const uid = String(userId ?? '');
  return (group.members || []).some((m) => refId(m) === uid);
};

const isBuddyOf = (userDoc, otherId) => {
  const oid = String(otherId ?? '');
  return (userDoc.buddies || []).some((b) => refId(b) === oid);
};

function rewardConsistencyStreak(userDoc) {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastActive = new Date(userDoc.lastActiveDate).setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  if (daysDiff === 1) userDoc.streak += 1;
  else if (daysDiff > 1) userDoc.streak = 1;
  userDoc.lastActiveDate = new Date();
}

async function addProgressForNewMember(groupId, newUserId) {
  const tasks = await StudyRoomTask.find({ group: groupId, scope: 'group' });
  for (const t of tasks) {
    const has = t.progress.some((p) => refId(p.user) === String(newUserId));
    if (!has) {
      t.progress.push({
        user: newUserId,
        status: 'not completed',
        personalNotes: '',
        xpAwarded: false,
        completionCount: 0,
        updatedAt: new Date(),
      });
      await t.save();
    }
  }
  const challenges = await StudyRoomChallenge.find({
    group: groupId,
    endsAt: { $gte: new Date() },
  });
  for (const c of challenges) {
    const has = c.participations.some((p) => refId(p.user) === String(newUserId));
    if (!has) {
      c.participations.push({ user: newUserId, completedAt: null, xpGranted: false });
      await c.save();
    }
  }
}

export function attachStudyRoomRoutes(app, { authenticateToken, User }) {
  const memberSelect = 'username name avatar level streak';

  // Create study room (creator only; starts with self)
  app.post('/api/study-groups', authenticateToken, async (req, res) => {
    try {
      const {
        name,
        description = '',
        maxMembers = 8,
        studyGoalType = 'subject',
        studyGoalText = '',
      } = req.body;

      if (!name || !String(name).trim()) {
        return res.status(400).json({ message: 'Room name is required' });
      }
      const cap = Math.min(16, Math.max(2, parseInt(maxMembers, 10) || 8));
      if (!STUDY_GOAL_TYPES.includes(studyGoalType)) {
        return res.status(400).json({ message: 'Invalid study goal type' });
      }
      const goalTextTrim = String(studyGoalText).trim();
      if (studyGoalType === 'custom' && !goalTextTrim) {
        return res.status(400).json({
          message: 'Please describe your custom study goal in goal details.',
        });
      }

      const group = new StudyGroup({
        name: name.trim(),
        description: String(description).trim(),
        createdBy: req.user.id,
        maxMembers: cap,
        members: [req.user.id],
        studyGoalType,
        studyGoalText: goalTextTrim,
        updatedAt: new Date(),
      });
      await group.save();
      const populated = await StudyGroup.findById(group._id)
        .populate('members', memberSelect)
        .populate('createdBy', memberSelect);
      res.status(201).json(populated);
    } catch (e) {
      console.error('create study group', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/study-groups/mine', authenticateToken, async (req, res) => {
    try {
      const groups = await StudyGroup.find({ members: req.user.id })
        .populate('members', memberSelect)
        .populate('createdBy', memberSelect)
        .sort({ updatedAt: -1 });
      res.json(groups);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/study-groups/invites/received', authenticateToken, async (req, res) => {
    try {
      const invites = await StudyGroupInvite.find({
        invitee: req.user.id,
        status: 'pending',
      })
        .populate('group')
        .populate('inviter', memberSelect);
      res.json(invites);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/study-groups/:groupId', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId)
        .populate('members', memberSelect)
        .populate('createdBy', memberSelect);
      if (!group) return res.status(404).json({ message: 'Study room not found' });
      if (!isMember(group, req.user.id)) {
        return res.status(403).json({ message: 'Not a member of this room' });
      }

      const outgoingPending = await StudyGroupInvite.find({
        group: group._id,
        inviter: req.user.id,
        status: 'pending',
      }).populate('invitee', memberSelect);

      const obj = group.toObject();
      obj.outgoingPendingInvites = outgoingPending.map((inv) => ({
        _id: inv._id,
        invitee: inv.invitee,
      }));
      res.json(obj);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/study-groups/:groupId', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Study room not found' });
      if (!isMember(group, req.user.id)) {
        return res.status(403).json({ message: 'Not a member' });
      }

      const {
        name,
        description,
        studyGoalType,
        studyGoalText,
        maxMembers,
      } = req.body;

      const isCreator = refId(group.createdBy) === String(req.user.id);
      const wantsRoomEdit =
        name !== undefined ||
        description !== undefined ||
        studyGoalText !== undefined ||
        studyGoalType !== undefined ||
        maxMembers !== undefined;
      if (wantsRoomEdit && !isCreator) {
        return res.status(403).json({ message: 'Only the room creator can edit room details' });
      }

      if (name !== undefined) group.name = String(name).trim() || group.name;
      if (description !== undefined) group.description = String(description);
      if (studyGoalText !== undefined) group.studyGoalText = String(studyGoalText).trim();
      if (studyGoalType !== undefined) {
        if (!STUDY_GOAL_TYPES.includes(studyGoalType)) {
          return res.status(400).json({ message: 'Invalid study goal type' });
        }
        group.studyGoalType = studyGoalType;
      }

      if (
        group.studyGoalType === 'custom' &&
        !String(group.studyGoalText || '').trim()
      ) {
        return res.status(400).json({ message: 'Custom goal requires goal details text.' });
      }

      if (maxMembers !== undefined) {
        if (refId(group.createdBy) !== String(req.user.id)) {
          return res.status(403).json({ message: 'Only the creator can change member cap' });
        }
        const cap = Math.min(16, Math.max(2, parseInt(maxMembers, 10) || group.maxMembers));
        if (cap < group.members.length) {
          return res.status(400).json({
            message: `Member cap cannot be below current room size (${group.members.length})`,
          });
        }
        group.maxMembers = cap;
      }

      await group.save();
      const populated = await StudyGroup.findById(group._id)
        .populate('members', memberSelect)
        .populate('createdBy', memberSelect);
      res.json(populated);
    } catch (e) {
      console.error('patch study group', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/:groupId/invites', authenticateToken, async (req, res) => {
    try {
      const { buddyUserId } = req.body;
      if (!buddyUserId) {
        return res.status(400).json({ message: 'buddyUserId is required' });
      }

      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Study room not found' });
      if (!isMember(group, req.user.id)) {
        return res.status(403).json({ message: 'Not a member' });
      }
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({ message: 'Room is full' });
      }
      if (group.members.some((m) => refId(m) === String(buddyUserId))) {
        return res.status(400).json({ message: 'User is already in this room' });
      }

      const inviter = await User.findById(req.user.id);
      if (!isBuddyOf(inviter, buddyUserId)) {
        return res.status(403).json({ message: 'You can only invite buddies' });
      }

      const invite = new StudyGroupInvite({
        group: group._id,
        inviter: req.user.id,
        invitee: buddyUserId,
        status: 'pending',
      });
      await invite.save();

      const inviterDoc = await User.findById(req.user.id).select('name username');
      await notifyUser({
        recipientId: buddyUserId,
        scope: 'study_rooms',
        type: 'study_room_invite',
        title: 'Study room invitation',
        body: `${inviterDoc?.name || 'A buddy'} invited you to "${group.name}".`,
        link: '/study-rooms',
        meta: { groupId: group._id.toString(), inviteId: invite._id.toString() },
      });

      const populated = await StudyGroupInvite.findById(invite._id)
        .populate('group')
        .populate('inviter', memberSelect)
        .populate('invitee', memberSelect);
      res.status(201).json(populated);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(400).json({ message: 'Invite already pending for this user' });
      }
      console.error('invite study', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/invites/:inviteId/accept', authenticateToken, async (req, res) => {
    try {
      const invite = await StudyGroupInvite.findById(req.params.inviteId);
      if (!invite || invite.status !== 'pending') {
        return res.status(404).json({ message: 'Invite not found' });
      }
      if (invite.invitee.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not your invite' });
      }

      const group = await StudyGroup.findById(invite.group);
      if (!group) return res.status(404).json({ message: 'Room no longer exists' });
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({ message: 'Room is now full' });
      }

      group.members.push(req.user.id);
      await group.save();
      invite.status = 'accepted';
      await invite.save();

      await addProgressForNewMember(group._id, req.user.id);

      const populated = await StudyGroup.findById(group._id)
        .populate('members', memberSelect)
        .populate('createdBy', memberSelect);
      res.json(populated);
    } catch (e) {
      console.error('accept invite', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/invites/:inviteId/decline', authenticateToken, async (req, res) => {
    try {
      const invite = await StudyGroupInvite.findById(req.params.inviteId);
      if (!invite || invite.status !== 'pending') {
        return res.status(404).json({ message: 'Invite not found' });
      }
      if (invite.invitee.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not your invite' });
      }
      invite.status = 'declined';
      await invite.save();

      const [grp, inviteeUser] = await Promise.all([
        StudyGroup.findById(invite.group).select('name'),
        User.findById(invite.invitee).select('name username'),
      ]);
      await notifyUser({
        recipientId: invite.inviter,
        scope: 'study_rooms',
        type: 'study_room_invite_declined',
        title: 'Invitation declined',
        body: `${inviteeUser?.name || 'Someone'} declined to join "${grp?.name || 'your study room'}".`,
        link: `/study-rooms/${invite.group}`,
        meta: { groupId: invite.group.toString() },
      });

      res.json({ message: 'Declined' });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/:groupId/leave', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (refId(group.createdBy) === String(req.user.id)) {
        return res.status(400).json({
          message: 'Transfer ownership or delete the room instead of leaving',
        });
      }
      group.members = group.members.filter((m) => refId(m) !== String(req.user.id));
      await group.save();
      res.json({ message: 'Left study room' });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/study-groups/:groupId', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (refId(group.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Only the creator can delete the room' });
      }
      await StudyRoomTask.deleteMany({ group: group._id });
      await StudyRoomNote.deleteMany({ group: group._id });
      await StudyRoomChallenge.deleteMany({ group: group._id });
      await StudyGroupInvite.deleteMany({ group: group._id });
      await StudyGroup.deleteOne({ _id: group._id });
      res.json({ message: 'Study room deleted' });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Member progress (alphabetical by name — no competitive ranking)
  app.get('/api/study-groups/:groupId/progress', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId).populate(
        'members',
        memberSelect
      );
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) {
        return res.status(403).json({ message: 'Not a member' });
      }

      const tasks = await StudyRoomTask.find({ group: group._id });

      const rows = group.members.map((m) => {
        let applicable = 0;
        let completed = 0;
        let inProgress = 0;
        for (const t of tasks) {
          const mine = t.progress.find((p) => refId(p.user) === refId(m));
          if (!mine) continue;
          applicable += 1;
          if (mine.status === 'completed') completed += 1;
          else if (mine.status !== 'not completed') inProgress += 1;
        }
        const ratio = applicable ? Math.round((completed / applicable) * 100) : null;
        let encouragement = 'Every step counts.';
        if (ratio === null || applicable === 0) encouragement = 'Ready when you are.';
        else if (ratio >= 80) encouragement = 'Great consistency in this room.';
        else if (ratio >= 40) encouragement = 'Steady progress — keep going.';
        else encouragement = 'Building momentum together.';

        return {
          user: {
            _id: m._id,
            name: m.name,
            username: m.username,
            avatar: m.avatar,
          },
          applicableTasks: applicable,
          completedTasks: completed,
          inProgressHints: inProgress,
          completionRatio: ratio,
          encouragement,
        };
      });

      rows.sort((a, b) => a.user.name.localeCompare(b.user.name, undefined, { sensitivity: 'base' }));
      res.json({ members: rows });
    } catch (e) {
      console.error('progress', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Tasks
  app.get('/api/study-groups/:groupId/tasks', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const tasks = await StudyRoomTask.find({ group: group._id })
        .populate('assignedBy', memberSelect)
        .populate('assignedTo', memberSelect)
        .populate('progress.user', memberSelect)
        .sort({ createdAt: -1 });
      res.json(tasks);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/:groupId/tasks', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const { title, link = '', scope, assignedTo, dueDate } = req.body;
      if (!title || !scope) {
        return res.status(400).json({ message: 'title and scope are required' });
      }
      if (!['individual', 'group'].includes(scope)) {
        return res.status(400).json({ message: 'Invalid scope' });
      }

      const memberSet = new Set(group.members.map((m) => refId(m)));
      let progress = [];

      if (scope === 'individual') {
        if (!assignedTo || !memberSet.has(assignedTo.toString())) {
          return res.status(400).json({ message: 'assignedTo must be a room member' });
        }
        progress = [
          {
            user: assignedTo,
            status: 'not completed',
            personalNotes: '',
            xpAwarded: false,
            completionCount: 0,
            updatedAt: new Date(),
          },
        ];
      } else {
        progress = group.members.map((uid) => ({
          user: uid && uid._id != null ? uid._id : uid,
          status: 'not completed',
          personalNotes: '',
          xpAwarded: false,
          completionCount: 0,
          updatedAt: new Date(),
        }));
      }

      const task = new StudyRoomTask({
        group: group._id,
        title: String(title).trim(),
        link: String(link || ''),
        scope,
        assignedTo: scope === 'individual' ? assignedTo : null,
        assignedBy: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        progress,
      });
      await task.save();

      const byName = (await User.findById(req.user.id).select('name'))?.name || 'A member';
      for (const m of group.members) {
        const mid = refId(m);
        if (mid === String(req.user.id)) continue;
        await notifyUser({
          recipientId: mid,
          scope: 'study_rooms',
          type: 'study_room_task',
          title: 'New room task',
          body: `${byName} added a task in "${group.name}": ${task.title}`,
          link: `/study-rooms/${group._id}`,
          meta: { groupId: group._id.toString(), taskId: task._id.toString() },
        });
      }

      const populated = await StudyRoomTask.findById(task._id)
        .populate('assignedBy', memberSelect)
        .populate('assignedTo', memberSelect)
        .populate('progress.user', memberSelect);
      res.status(201).json(populated);
    } catch (e) {
      console.error('create room task', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/study-groups/:groupId/tasks/:taskId', authenticateToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { status, personalNotes } = req.body;
      const task = await StudyRoomTask.findOne({
        _id: req.params.taskId,
        group: req.params.groupId,
      }).session(session);

      if (!task) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Task not found' });
      }

      const group = await StudyGroup.findById(task.group).session(session);
      if (!isMember(group, req.user.id)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ message: 'Not a member' });
      }

      const idx = task.progress.findIndex((p) => refId(p.user) === String(req.user.id));
      if (idx === -1) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ message: 'You are not assigned to this task' });
      }

      const prev = task.progress[idx].status;
      const entry = task.progress[idx];
      if (status && ROOM_TASK_STATUSES.includes(status)) {
        entry.status = status;
      }
      if (personalNotes !== undefined) {
        entry.personalNotes = String(personalNotes);
      }
      entry.updatedAt = new Date();

      const isNowCompleted = entry.status === 'completed';
      let xpEarned = 0;

      // Award XP only on first transition into "completed" for this row
      if (isNowCompleted && prev !== 'completed' && !entry.xpAwarded) {
        const user = await User.findById(req.user.id).session(session);
        user.xp += ROOM_TASK_XP;
        if (user.stats) {
          user.stats.studyRoomTaskCompletions =
            (user.stats.studyRoomTaskCompletions || 0) + 1;
        }
        await rewardConsistencyStreak(user);
        await user.save({ session });
        entry.xpAwarded = true;
        entry.firstCompletedAt = new Date();
        entry.completionCount = (entry.completionCount || 0) + 1;
        xpEarned = ROOM_TASK_XP;
      } else if (isNowCompleted && entry.xpAwarded) {
        entry.completionCount = (entry.completionCount || 0) + 1;
      }

      await task.save({ session });
      await session.commitTransaction();
      session.endSession();

      const populated = await StudyRoomTask.findById(task._id)
        .populate('assignedBy', memberSelect)
        .populate('assignedTo', memberSelect)
        .populate('progress.user', memberSelect);

      res.json({
        ...populated.toObject(),
        xpEarned,
      });
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      console.error('patch room task', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/study-groups/:groupId/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
      const task = await StudyRoomTask.findOne({
        _id: req.params.taskId,
        group: req.params.groupId,
      });
      if (!task) return res.status(404).json({ message: 'Not found' });
      if (refId(task.assignedBy) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Only the task author can delete it' });
      }
      await StudyRoomTask.deleteOne({ _id: task._id });
      res.json({ message: 'Deleted' });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Notes & resources
  app.get('/api/study-groups/:groupId/notes', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const notes = await StudyRoomNote.find({ group: group._id })
        .populate('createdBy', memberSelect)
        .sort({ updatedAt: -1 });
      res.json(notes);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/:groupId/notes', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const { title, content = '', contentHtml = '', resourceUrl = '', attachments } = req.body;
      if (!title) return res.status(400).json({ message: 'title is required' });

      const safeHtml = contentHtml ? sanitizeRich(String(contentHtml)) : '';
      const plain =
        safeHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800) ||
        String(content);

      const note = new StudyRoomNote({
        group: group._id,
        title: String(title).trim(),
        content: plain,
        contentHtml: safeHtml,
        resourceUrl: String(resourceUrl || ''),
        attachments: Array.isArray(attachments)
          ? attachments
              .filter((a) => a && a.url)
              .slice(0, 8)
              .map((a) => ({
                url: String(a.url).slice(0, 2048),
                originalName: String(a.originalName || '').slice(0, 200),
              }))
          : [],
        createdBy: req.user.id,
      });
      await note.save();

      const author = await User.findById(req.user.id).select('name');
      for (const m of group.members) {
        const mid = refId(m);
        if (mid === String(req.user.id)) continue;
        await notifyUser({
          recipientId: mid,
          scope: 'study_rooms',
          type: 'study_room_note',
          title: 'New study room note',
          body: `${author?.name || 'A member'} posted in "${group.name}": ${note.title}`,
          link: `/study-rooms/${group._id}`,
          meta: { groupId: group._id.toString() },
        });
      }

      const populated = await StudyRoomNote.findById(note._id).populate(
        'createdBy',
        memberSelect
      );
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/study-groups/:groupId/notes/:noteId', authenticateToken, async (req, res) => {
    try {
      const note = await StudyRoomNote.findOne({
        _id: req.params.noteId,
        group: req.params.groupId,
      });
      if (!note) return res.status(404).json({ message: 'Not found' });
      if (refId(note.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Only author can edit' });
      }
      const { title, content, contentHtml, resourceUrl, attachments } = req.body;
      if (title !== undefined) note.title = String(title).trim();
      if (contentHtml !== undefined) {
        const safeHtml = sanitizeRich(String(contentHtml));
        note.contentHtml = safeHtml;
        note.content = safeHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800);
      } else if (content !== undefined) {
        note.content = String(content);
      }
      if (resourceUrl !== undefined) note.resourceUrl = String(resourceUrl);
      if (attachments !== undefined) {
        note.attachments = Array.isArray(attachments)
          ? attachments
              .filter((a) => a && a.url)
              .slice(0, 8)
              .map((a) => ({
                url: String(a.url).slice(0, 2048),
                originalName: String(a.originalName || '').slice(0, 200),
              }))
          : [];
      }
      note.updatedAt = new Date();
      await note.save();
      const populated = await StudyRoomNote.findById(note._id).populate(
        'createdBy',
        memberSelect
      );
      res.json(populated);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.delete('/api/study-groups/:groupId/notes/:noteId', authenticateToken, async (req, res) => {
    try {
      const note = await StudyRoomNote.findOne({
        _id: req.params.noteId,
        group: req.params.groupId,
      });
      if (!note) return res.status(404).json({ message: 'Not found' });
      if (refId(note.createdBy) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Only author can delete' });
      }
      await StudyRoomNote.deleteOne({ _id: note._id });
      res.json({ message: 'Deleted' });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Challenges (time-bound, consistency XP — not ranked)
  app.get('/api/study-groups/:groupId/challenges', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const list = await StudyRoomChallenge.find({ group: group._id })
        .populate('createdBy', memberSelect)
        .populate('participations.user', memberSelect)
        .sort({ endsAt: -1 });
      res.json(list);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/study-groups/:groupId/challenges', authenticateToken, async (req, res) => {
    try {
      const group = await StudyGroup.findById(req.params.groupId);
      if (!group) return res.status(404).json({ message: 'Not found' });
      if (!isMember(group, req.user.id)) return res.status(403).json({ message: 'Not a member' });

      const { title, description = '', cadence, startsAt, endsAt, xpReward = 5 } = req.body;
      if (!title || !cadence || !startsAt || !endsAt) {
        return res.status(400).json({ message: 'title, cadence, startsAt, endsAt required' });
      }
      if (!['daily', 'weekly', 'sprint'].includes(cadence)) {
        return res.status(400).json({ message: 'Invalid cadence' });
      }
      const start = new Date(startsAt);
      const end = new Date(endsAt);
      if (end <= start) {
        return res.status(400).json({ message: 'endsAt must be after startsAt' });
      }

      const participations = group.members.map((uid) => ({
        user: uid._id != null ? uid._id : uid,
        completedAt: null,
        xpGranted: false,
      }));

      const ch = new StudyRoomChallenge({
        group: group._id,
        title: String(title).trim(),
        description: String(description),
        cadence,
        startsAt: start,
        endsAt: end,
        xpReward: Math.min(50, Math.max(0, parseInt(xpReward, 10) || 5)),
        createdBy: req.user.id,
        participations,
      });
      await ch.save();

      const creator = await User.findById(req.user.id).select('name');
      for (const m of group.members) {
        const mid = refId(m);
        if (mid === String(req.user.id)) continue;
        await notifyUser({
          recipientId: mid,
          scope: 'study_rooms',
          type: 'study_room_challenge',
          title: 'New room challenge',
          body: `${creator?.name || 'A member'} added "${ch.title}" in "${group.name}".`,
          link: `/study-rooms/${group._id}`,
          meta: { groupId: group._id.toString() },
        });
      }

      const populated = await StudyRoomChallenge.findById(ch._id)
        .populate('createdBy', memberSelect)
        .populate('participations.user', memberSelect);
      res.status(201).json(populated);
    } catch (e) {
      console.error('create challenge', e);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post(
    '/api/study-groups/:groupId/challenges/:challengeId/complete',
    authenticateToken,
    async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const ch = await StudyRoomChallenge.findOne({
          _id: req.params.challengeId,
          group: req.params.groupId,
        }).session(session);
        if (!ch) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: 'Not found' });
        }

        const group = await StudyGroup.findById(ch.group).session(session);
        if (!isMember(group, req.user.id)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(403).json({ message: 'Not a member' });
        }

        const now = new Date();
        if (now < ch.startsAt || now > ch.endsAt) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Challenge is not active right now' });
        }

        const part = ch.participations.find((p) => refId(p.user) === String(req.user.id));
        if (!part) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Not part of this challenge' });
        }
        if (part.completedAt) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Already completed this challenge window' });
        }

        const user = await User.findById(req.user.id).session(session);
        if (!part.xpGranted && ch.xpReward > 0) {
          user.xp += ch.xpReward;
          part.xpGranted = true;
        }
        part.completedAt = now;
        await rewardConsistencyStreak(user);
        await user.save({ session });
        await ch.save({ session });
        await session.commitTransaction();
        session.endSession();

        const populated = await StudyRoomChallenge.findById(ch._id)
          .populate('createdBy', memberSelect)
          .populate('participations.user', memberSelect);
        res.json({ challenge: populated, xpEarned: ch.xpReward });
      } catch (e) {
        await session.abortTransaction();
        session.endSession();
        console.error('complete challenge', e);
        res.status(500).json({ message: 'Server error' });
      }
    }
  );
}
