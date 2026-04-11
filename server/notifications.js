import mongoose from 'mongoose';

export const NOTIFICATION_SCOPES = [
  'buddies',
  'study_rooms',
  'my_tasks',
  'assigned_by_me',
  'notes',
  'activity',
];

const userNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  scope: {
    type: String,
    enum: NOTIFICATION_SCOPES,
    required: true,
    index: true,
  },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false, index: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

userNotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const UserNotification = mongoose.model('UserNotification', userNotificationSchema);

export async function notifyUser({
  recipientId,
  scope,
  type,
  title,
  body = '',
  link = '',
  meta = {},
}) {
  try {
    if (!recipientId || String(recipientId) === 'undefined') return;
    if (!NOTIFICATION_SCOPES.includes(scope)) return;
    await UserNotification.create({
      recipient: recipientId,
      scope,
      type,
      title,
      body,
      link,
      meta,
    });
  } catch (e) {
    console.error('notifyUser', e);
  }
}

export function attachNotificationRoutes(app, { authenticateToken }) {
  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const list = await UserNotification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .limit(120)
        .lean();
      res.json(list);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/notifications/counts', authenticateToken, async (req, res) => {
    try {
      const uid = req.user.id;
      const out = {};
      for (const s of NOTIFICATION_SCOPES) {
        out[s] = await UserNotification.countDocuments({
          recipient: uid,
          scope: s,
          read: false,
        });
      }
      out.tabTotal = NOTIFICATION_SCOPES.reduce((a, s) => a + (out[s] || 0), 0);
      out.total = await UserNotification.countDocuments({
        recipient: uid,
        read: false,
      });
      res.json(out);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/notifications/mark-scope-read', authenticateToken, async (req, res) => {
    try {
      const { scope } = req.body || {};
      if (scope === 'all') {
        await UserNotification.updateMany(
          { recipient: req.user.id, read: false },
          { $set: { read: true } }
        );
        return res.json({ ok: true });
      }
      if (!NOTIFICATION_SCOPES.includes(scope)) {
        return res.status(400).json({ message: 'Invalid scope' });
      }
      await UserNotification.updateMany(
        { recipient: req.user.id, scope, read: false },
        { $set: { read: true } }
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const n = await UserNotification.findOne({
        _id: req.params.id,
        recipient: req.user.id,
      });
      if (!n) return res.status(404).json({ message: 'Not found' });
      n.read = true;
      await n.save();
      res.json(n);
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });
}
