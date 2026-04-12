import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { attachStudyRoomRoutes } from './studyRooms.js';
import { notifyUser, attachNotificationRoutes } from './notifications.js';
import { isCloudinaryConfigured, uploadImageBuffer } from './lib/cloudinaryUpload.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const imageUploadFileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    new Error(
      'Only JPEG, PNG, WebP, or GIF are allowed. iPhone HEIC/HEIF is not shown in browsers—export as JPEG in Photos first.'
    )
  );
};

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname || '').slice(0, 12).toLowerCase();
    if (!ext || ext === '.') {
      const fromMime = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
      }[file.mimetype];
      ext = fromMime || '.jpg';
    }
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadDisk = multer({
  storage: uploadStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageUploadFileFilter,
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageUploadFileFilter,
});

const app = express();

// ============================================
// CORS - Simple and Permissive for Development.     https://studdy-buddy-rosy.vercel.app , http://localhost:5173
// ============================================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://studdy-buddy-rosy.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect('mongodb+srv://karya:karya@karya.v1e4nug.mongodb.net/?appName=Karya', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// ============================================
// MODELS
// ============================================

// Buddy Request Schema
// const buddyRequestSchema = new mongoose.Schema({
//   sender: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   receiver: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   status: { 
//     type: String, 
//     enum: ['pending', 'accepted', 'rejected'],
//     default: 'pending'
//   },
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// });

// // Compound index to prevent duplicate requests
// buddyRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// const BuddyRequest = mongoose.model('BuddyRequest', buddyRequestSchema);


const buddyRequestSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Only ONE pending request allowed between sender & receiver
buddyRequestSchema.index(
  { sender: 1, receiver: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

const BuddyRequest = mongoose.model('BuddyRequest', buddyRequestSchema);


// User Schema - UPDATED with Level Title
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 20 
  },
  bio: { 
    type: String, 
    default: '' 
  },
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true
  },
  level: { 
    type: Number, 
    default: 1 
  },
  xp: { 
    type: Number, 
    default: 0 
  },
  // LEVEL TITLE
  levelTitle: {
    type: String,
    default: 'Initiate'
  },
  streak: { 
    type: Number, 
    default: 0 
  },
  lastActiveDate: { 
    type: Date, 
    default: Date.now 
  },
  buddies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  stats: {
    tasksCompleted: { type: Number, default: 0 },
    tasksAssigned: { type: Number, default: 0 },
    notesCreated: { type: Number, default: 0 },
    activitiesPosted: { type: Number, default: 0 },
    // NEW STATS
    totalTasksCompletedOnce: { type: Number, default: 0 }, // Unique completions
    totalXpEarned: { type: Number, default: 0 }, // Lifetime XP
    highestLevel: { type: Number, default: 1 }, // Peak level achieved
    studyRoomTaskCompletions: { type: Number, default: 0 }
  },
  customCategories: [{ type: String }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Level calculation helper
const getLevelFromXP = (xp) => {
  return Math.floor(xp / 100) + 1;
};

// Level title mapping
const getLevelTitle = (level) => {
  const titles = {
    1: 'Initiate',
    2: 'Adept',
    3: 'Scholar',
    4: 'Rune Bearer',
    5: 'Arcane Coder',
    6: 'Shadow Architect',
    7: 'Chrono Sage',
    8: 'Mythic Engineer',
    9: 'Ethereal Overlord',
    10: 'Celestial Ascendant'
  };
  
  if (level >= 10) return titles[10];
  return titles[level] || titles[1];
};

userSchema.pre('save', function(next) {
  // Calculate level from XP
  this.level = getLevelFromXP(this.xp);
  
  // Set level title
  this.levelTitle = getLevelTitle(this.level);
  
  // Track highest level achieved
  if (this.level > this.stats.highestLevel) {
    this.stats.highestLevel = this.level;
  }
  
  // Sync total XP earned stat
  this.stats.totalXpEarned = this.xp;
  
  next();
});

const User = mongoose.model('User', userSchema);


// Task Schema - UPDATED with XP tracking
const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true
  },
  status: { 
    type: String, 
    default: 'not completed',
    enum: ['completed', 'mark as read', 'not completed', 'need revision']
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // XP TRACKING - CRITICAL
  xpAwarded: {
    type: Boolean,
    default: false
  },
  firstCompletedAt: {
    type: Date,
    default: null
  },
  completionCount: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String, 
    default: '' 
  }
});

const Task = mongoose.model('Task', taskSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    default: 'General'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Note = mongoose.model('Note', noteSchema);

// Activity Schema
const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
  },
  hashtags: {
    type: [String],
    default: [],
  },
  imageUrl: {
    type: String,
    default: '',
  },
  /** Short id for public share URL (e.g. /p/:shareCode) */
  shareCode: {
    type: String,
    default: null,
    sparse: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** Legacy "I did this too" — merged into supportedBy in API responses */
  completedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  supportedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

function normalizeActivityResponse(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  const s = o.supportedBy || [];
  const c = o.completedBy || [];
  const byId = new Map();
  [...s, ...c].forEach((u) => {
    if (u && u._id) byId.set(String(u._id), u);
  });
  const { completedBy: _drop, ...rest } = o;
  return {
    ...rest,
    supportedBy: [...byId.values()],
  };
}

async function generateUniqueActivityShareCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let code = '';
    for (let i = 0; i < 9; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // eslint-disable-next-line no-await-in-loop
    const exists = await Activity.exists({ shareCode: code });
    if (!exists) return code;
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeHashtagInput(tags) {
  if (!Array.isArray(tags)) return [];
  const out = new Set();
  for (const raw of tags) {
    const t = String(raw || '')
      .trim()
      .replace(/^#+/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (t.length >= 2 && t.length <= 40) out.add(t);
  }
  return [...out].slice(0, 20);
}

function escapeRegexForActivitySearch(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parse `tags` query (comma / whitespace) into normalized search tokens */
function parseActivityTagsQueryParam(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, '').trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))
    .filter((t) => t.length > 0)
    .slice(0, 10);
}

const Activity = mongoose.model('Activity', activitySchema);

// ============================================
// AUTH MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied - No token provided' });
  }

  jwt.verify(token, 'karya', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// INITIALIZE USERS
// ============================================
// const initializeUsers = async () => {
//   try {
//     const count = await User.countDocuments();
//     if (count === 0) {
//       const hashedPassword1 = await bcrypt.hash('example@12', 10);
//       const hashedPassword2 = await bcrypt.hash('example@12', 10);

//       await User.create([
//         {
//           username: 'Jaggu',
//           email: 'user1@example.com',
//           password: hashedPassword1,
//           name: 'Tara',
//           securityQuestion: "What city were you born in?",
//           securityAnswer: "Gwalior",
//         },
//         {
//           username: 'Veda',
//           email: 'user2@example.com',
//           password: hashedPassword2,
//           name: 'Veda',
//           securityQuestion: "What city were you born in?",
//           securityAnswer: "Gwalior",
//         }
//       ]);
//       console.log('✅ Users initialized: user1 and user2 with password: example@12');
//     }
//   } catch (error) {
//     console.log('❌ Error initializing users:', error);
//   }
// };

// initializeUsers();

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({ message: 'Task Assignment API is running!' });
});

// Check username availability
app.get('/api/auth/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Register/Signup
// app.post('/api/auth/signup', async (req, res) => {
//   try {
//     const { username, email, password, name, avatar } = req.body;
    
//     console.log('📥 Signup request:', { username, email, name });

//     if (!username || !email || !password || !name) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const existingUsername = await User.findOne({ username: username.toLowerCase() });
//     if (existingUsername) {
//       return res.status(400).json({ message: 'Username already taken' });
//     }

//     const existingEmail = await User.findOne({ email: email.toLowerCase() });
//     if (existingEmail) {
//       return res.status(400).json({ message: 'Email already registered' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new User({
//       username: username.toLowerCase(),
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       name,
//       avatar: avatar || 1
//     });

//     await user.save();

//     const token = jwt.sign(
//       { id: user._id, username: user.username },
//       process.env.JWT_SECRET || 'karya',
//       { expiresIn: '30d' }
//     );

//     console.log('✅ User created:', username);

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         name: user.name,
//         email: user.email,
//         avatar: user.avatar,
//         level: user.level,
//         xp: user.xp,
//         streak: user.streak,
//         buddies: user.buddies
//       }
//     });
//   } catch (error) {
//     console.error('❌ Signup error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// UPDATE SIGNUP ENDPOINT (replace existing signup route)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, name, avatar, securityQuestion, securityAnswer } = req.body;
    
    console.log('📥 Signup request:', { username, email, name });

    // Validation
    if (!username || !email || !password || !name || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password and security answer
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecurityAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      avatar: avatar || 1,
      securityQuestion,
      securityAnswer: hashedSecurityAnswer
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'karya',
      { expiresIn: '30d' }
    );

    console.log('✅ User created:', username);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        buddies: user.buddies
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('📥 Login request received:', req.body.username);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = new Date(user.lastActiveDate).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      user.streak += 1;
    } else if (daysDiff > 1) {
      user.streak = 1;
    }

    user.lastActiveDate = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username },
      'karya',
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful for:', username);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        bio: user.bio,
        stats: user.stats,
        customCategories: user.customCategories,
        buddies: user.buddies
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = new Date(user.lastActiveDate).setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      user.streak = 0;
      user.lastActiveDate = new Date();
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// BUDDY ROUTES
// ============================================

// Search users (excluding self and already buddies)
app.get('/api/users/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const currentUser = await User.findById(req.user.id);
    
    const users = await User.find({
      _id: { $ne: req.user.id },
      username: { $regex: query.toLowerCase(), $options: 'i' }
    })
    .select('username name avatar level streak stats')
    .limit(10);
    
    // Add buddy status to each user
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isBuddy: currentUser.buddies.some(buddyId => buddyId.toString() === user._id.toString())
    }));
    
    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send buddy request
// app.post('/api/buddies/request/:userId', authenticateToken, async (req, res) => {
//   try {
//     const receiverId = req.params.userId;
//     console.log("receiverId: ", receiverId);  //2f
    
//     const senderId = req.user.id;

//     console.log("senderId: ", senderId);   //2bf

//     if (senderId === receiverId) {
//       return res.status(400).json({ message: 'Cannot send buddy request to yourself' });
//     }

//     // Check if already buddies
//     const sender = await User.findById(senderId);
//     console.log("3: ", sender)
//     if (sender.buddies.includes(receiverId)) {
//       return res.status(400).json({ message: 'Already buddies' });
//     }

//     // Check if request already exists
//     const existingRequest = await BuddyRequest.findOne({
//       $or: [
//         { sender: senderId, receiver: receiverId },
//         { sender: receiverId, receiver: senderId }
//       ],
//       status: 'pending'
//     });
// // console.log("existingRequest: ", existingRequest);
//     if (existingRequest) {
      
//       return res.status(400).json({ message: 'Buddy request already exists' });
//   }

//     const buddyRequest = new BuddyRequest({
//       sender: senderId,
//       receiver: receiverId
//     });

//     await buddyRequest.save();
//     const populatedRequest = await BuddyRequest.findById(buddyRequest._id)
//       .populate('sender', 'username name avatar')
//       .populate('receiver', 'username name avatar');

//     console.log('✅ Buddy request sent');
//     res.status(201).json(populatedRequest);
//   } catch (error) {
//     console.error('❌ Send buddy request error:', error);
//     if (error.code === 11000) {
//       console.log("error here")
//       return res.status(400).json({ message: 'Buddy request already exists' });
//     }
//     res.status(500).json({ message: 'Server error' });
//   }
// });

app.post('/api/buddies/request/:userId', authenticateToken, async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user.id;

    // 1. Prevent self request
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send buddy request to yourself' });
    }

    // 2. Check if already buddies
    const sender = await User.findById(senderId);
    if (sender.buddies.some(id => id.toString() === receiverId)) {
      return res.status(400).json({ message: 'Already buddies' });
    }

    // 3. Check pending request in either direction
    const existingPendingRequest = await BuddyRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ],
      status: 'pending'
    });

    if (existingPendingRequest) {
      return res.status(400).json({ message: 'Buddy request already exists' });
    }

    // 4. Create new request
    const buddyRequest = new BuddyRequest({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    });

    await buddyRequest.save();

    await notifyUser({
      recipientId: receiverId,
      scope: 'buddies',
      type: 'buddy_request',
      title: 'New buddy request',
      body: `${sender.name} (@${sender.username}) sent you a buddy request.`,
      link: '/buddies',
    });

    const populatedRequest = await BuddyRequest.findById(buddyRequest._id)
      .populate('sender', 'username name avatar')
      .populate('receiver', 'username name avatar');

    return res.status(201).json(populatedRequest);

  } catch (error) {
    console.error('❌ Send buddy request error:', error);

    // Duplicate pending request safety (race condition)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Buddy request already exists' });
    }

    return res.status(500).json({ message: 'Server error' });
  }
});


// Get pending buddy requests (received)
app.get('/api/buddies/requests/received', authenticateToken, async (req, res) => {
  try {
    const requests = await BuddyRequest.find({
      receiver: req.user.id,
      status: 'pending'
    })
    .populate('sender', 'username name avatar level')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending buddy requests (sent)
app.get('/api/buddies/requests/sent', authenticateToken, async (req, res) => {
  try {
    const requests = await BuddyRequest.find({
      sender: req.user.id,
      status: 'pending'
    })
    .populate('receiver', 'username name avatar level')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept buddy request
app.patch('/api/buddies/requests/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const request = await BuddyRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Add each other as buddies
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { buddies: request.receiver }
    });
    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { buddies: request.sender }
    });

    const receiverUser = await User.findById(request.receiver).select('name username');
    await notifyUser({
      recipientId: request.sender,
      scope: 'buddies',
      type: 'buddy_accepted',
      title: 'Buddy request accepted',
      body: `${receiverUser?.name || 'Someone'} (@${receiverUser?.username || 'user'}) accepted your buddy request.`,
      link: '/buddies',
    });

    console.log('✅ Buddy request accepted');
    res.json({ message: 'Buddy request accepted' });
  } catch (error) {
    console.error('❌ Accept buddy request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject buddy request
app.patch('/api/buddies/requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const request = await BuddyRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // request.status = 'rejected';
    // await request.save();

    const updatedRequest = await BuddyRequest.findOneAndUpdate(
  {
    _id: req.params.requestId,
    receiver: req.user.id,
    status: 'pending'
  },
  { status: 'rejected' },
  { new: true }
);

if (!updatedRequest) {
  return res.status(400).json({ message: 'Request not found or already handled' });
}

    const receiverUser = await User.findById(req.user.id).select('name username');
    await notifyUser({
      recipientId: updatedRequest.sender,
      scope: 'buddies',
      type: 'buddy_declined',
      title: 'Buddy request declined',
      body: `${receiverUser?.name || 'Someone'} declined your buddy request.`,
      link: '/buddies',
    });

    console.log('✅ Buddy request rejected');
    res.json({ message: 'Buddy request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// app.patch('/api/buddies/requests/:requestId/reject', authenticateToken, async (req, res) => {
//   try {
//     const request = await BuddyRequest.findById(req.params.requestId);

//     if (!request) {
//       return res.status(404).json({ message: 'Request not found' });
//     }

//     if (request.receiver.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     await BuddyRequest.findByIdAndDelete(req.params.requestId);


//     console.log('✅ Buddy request rejected');
//     res.json({ message: 'Buddy request rejected' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Cancel buddy request (sender cancels)
app.delete('/api/buddies/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const request = await BuddyRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await BuddyRequest.findByIdAndDelete(req.params.requestId);

    console.log('✅ Buddy request cancelled');
    res.json({ message: 'Buddy request cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all buddies
app.get('/api/buddies', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('buddies', 'username name avatar level streak stats');
    
    res.json(user.buddies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove buddy
app.delete('/api/buddies/:buddyId', authenticateToken, async (req, res) => {
  try {
    const { buddyId } = req.params;
    const userId = req.user.id;

    // Remove from both users' buddy lists
    await User.findByIdAndUpdate(userId, {
      $pull: { buddies: buddyId }
    });
    await User.findByIdAndUpdate(buddyId, {
      $pull: { buddies: userId }
    });

    console.log('✅ Buddy removed');
    res.json({ message: 'Buddy removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by username
app.get('/api/users/profile/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Current user's custom categories only (defaults live on the client)
app.get('/api/users/all-categories', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('customCategories');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const categories = [...(user.customCategories || [])].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
    );
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add custom category
app.post('/api/users/categories', authenticateToken, async (req, res) => {
  try {
    const { category } = req.body;
    const user = await User.findById(req.user.id);

    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (user.customCategories.includes(category)) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    user.customCategories.push(category);
    await user.save();

    res.json({ customCategories: user.customCategories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete custom category
app.delete('/api/users/categories/:category', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { category } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    user.customCategories = user.customCategories.filter(
      cat => cat !== category
    );
    await user.save({ session });

    await Task.deleteMany(
      {
        category,
        $or: [{ assignedBy: userId }, { assignedTo: userId }]
      },
      { session }
    );

    await Note.deleteMany(
      {
        category,
        createdBy: userId
      },
      { session }
    );

    await Activity.deleteMany(
      {
        category,
        createdBy: userId
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Category and all related data deleted successfully',
      customCategories: user.customCategories
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (REMOVED - replaced with buddies only)
// This endpoint is no longer used

// ============================================
// TASK ROUTES (Modified for buddy system)
// ============================================

// Create task (can only assign to buddies)
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, link, category, assignedTo, notes } = req.body;
    
    // Check if assignedTo is a buddy
    const user = await User.findById(req.user.id);
    if (!user.buddies.includes(assignedTo)) {
      return res.status(403).json({ message: 'You can only assign tasks to your buddies' });
    }

    const task = new Task({
      title,
      link,
      category,
      assignedBy: req.user.id,
      assignedTo,
      notes
    });

    await task.save();

    user.xp += 5;
    user.stats.tasksAssigned += 1;
    await user.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'username name')
      .populate('assignedTo', 'username name');

    await notifyUser({
      recipientId: assignedTo,
      scope: 'my_tasks',
      type: 'task_assigned',
      title: 'New task assigned to you',
      body: `${user.name} assigned you: "${title}"`,
      link: '/dashboard',
      meta: { taskId: task._id.toString() },
    });
    
    console.log('✅ Task created:', task.title);
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks assigned to current user
app.get('/api/tasks/my-tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('assignedBy', 'username name')
      .populate('assignedTo', 'username name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks assigned by current user
app.get('/api/tasks/assigned-by-me', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedBy: req.user.id })
      .populate('assignedBy', 'username name')
      .populate('assignedTo', 'username name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task status
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, notes } = req.body;
    const task = await Task.findById(req.params.id).session(session);

    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only the assigned user can update the task
    if (task.assignedTo.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized' });
    }

    const previousStatus = task.status;
    const newStatus = status || task.status;

    const isNowCompleted = newStatus === 'completed';
    const willAwardFirstCompletionXp =
      isNowCompleted && previousStatus !== 'completed' && !task.xpAwarded;

    // Update task
    if (status) task.status = status;
    if (notes !== undefined) task.notes = notes;

    // XP LOGIC - Award XP only once when task is marked completed for the first time
    if (willAwardFirstCompletionXp) {
      // First time completing this task - Award XP
      const user = await User.findById(req.user.id).session(session);
      
      // Award 10 XP
      user.xp += 10;
      
      // Update stats
      user.stats.tasksCompleted += 1;
      user.stats.totalTasksCompletedOnce += 1;
      
      // Mark XP as awarded for this task
      task.xpAwarded = true;
      task.firstCompletedAt = new Date();
      task.completionCount = 1;
      
      await user.save({ session });
      
      console.log(`✅ XP Awarded: User ${user.username} earned 10 XP for task "${task.title}"`);
    } else if (isNowCompleted && task.xpAwarded) {
      // Task was completed before, just increment completion count
      task.completionCount += 1;
      console.log(`🔄 Task re-completed (no XP): "${task.title}" (count: ${task.completionCount})`);
    }

    await task.save({ session });
    await session.commitTransaction();
    session.endSession();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'username name')
      .populate('assignedTo', 'username name');
    
    // Return task with XP info (use willAwardFirstCompletionXp; task.xpAwarded is already true after save)
    const response = {
      ...updatedTask.toObject(),
      xpEarned: willAwardFirstCompletionXp ? 10 : 0,
      isFirstCompletion: willAwardFirstCompletionXp
    };

    const assignerId = task.assignedBy.toString();
    if (assignerId !== req.user.id) {
      const assignee = await User.findById(req.user.id).select('name username');
      await notifyUser({
        recipientId: assignerId,
        scope: 'assigned_by_me',
        type: 'task_updated',
        title: 'Task progress updated',
        body: `${assignee?.name || 'Buddy'} updated "${task.title}" → ${updatedTask.status}`,
        link: '/dashboard',
        meta: { taskId: task._id.toString() },
      });
    }

    res.json(response);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.assignedBy.toString() !== req.user.id && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// NOTES ROUTES
// ============================================

// CONTINUATION OF NOTES AND ACTIVITIES ROUTES

app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('createdBy', 'username name')
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('❌ Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = new Note({
      title,
      content,
      category: category || 'General',
      createdBy: req.user.id
    });

    await note.save();

    const user = await User.findById(req.user.id);
    user.xp += 3;
    user.stats.notesCreated += 1;
    await user.save();

    const populatedNote = await Note.findById(note._id)
      .populate('createdBy', 'username name');
    
    const withBuddies = await User.findById(req.user.id).populate('buddies', '_id name');
    for (const b of withBuddies.buddies || []) {
      await notifyUser({
        recipientId: b._id,
        scope: 'notes',
        type: 'shared_note',
        title: 'New shared note',
        body: `${user.name} posted: ${title}`,
        link: '/dashboard',
      });
    }

    console.log('✅ Note created:', note.title);
    res.status(201).json(populatedNote);
  } catch (error) {
    console.error('❌ Create note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this note' });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (category) note.category = category;
    note.updatedAt = Date.now();

    await note.save();
    const updatedNote = await Note.findById(note._id)
      .populate('createdBy', 'username name');
    
    console.log('✅ Note updated:', note.title);
    res.json(updatedNote);
  } catch (error) {
    console.error('❌ Update note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await Note.findByIdAndDelete(req.params.id);
    console.log('✅ Note deleted');
    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('❌ Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ACTIVITY ROUTES
// ============================================

app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 15, 1), 40);
    const skip = Math.max(parseInt(String(req.query.skip), 10) || 0, 0);
    const tagTerms = parseActivityTagsQueryParam(req.query.tags);

    const filter = {};
    if (tagTerms.length > 0) {
      filter.$and = tagTerms.map((term) => ({
        hashtags: { $regex: escapeRegexForActivitySearch(term), $options: 'i' },
      }));
    }

    const activities = await Activity.find(filter)
      .populate('createdBy', 'username name avatar')
      .populate('completedBy', 'username name avatar')
      .populate('supportedBy', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1);

    const hasMore = activities.length > limit;
    const slice = hasMore ? activities.slice(0, limit) : activities;
    res.json({
      items: slice.map((a) => normalizeActivityResponse(a)),
      hasMore,
    });
  } catch (error) {
    console.error('❌ Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/public/activities/:code', async (req, res) => {
  try {
    const { code } = req.params;
    let activity;
    if (code.length === 24 && /^[a-f0-9]{24}$/i.test(code)) {
      activity = await Activity.findById(code);
    } else {
      activity = await Activity.findOne({ shareCode: code });
    }
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    const populated = await Activity.findById(activity._id)
      .populate('createdBy', 'username name avatar')
      .populate('completedBy', 'username name avatar')
      .populate('supportedBy', 'username name avatar');
    res.json(normalizeActivityResponse(populated));
  } catch (error) {
    console.error('❌ Public activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { title, description, link, category, hashtags, imageUrl } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const fromBody = Array.isArray(hashtags)
      ? hashtags
      : typeof hashtags === 'string'
        ? hashtags.split(/[\s,]+/)
        : [];
    const fromText = [];
    const tagRe = /#([a-zA-Z0-9_]{2,40})/g;
    let tm;
    const scan = `${title} ${description}`;
    while ((tm = tagRe.exec(scan)) !== null) {
      fromText.push(tm[1]);
    }
    const tagList = normalizeHashtagInput([...fromBody, ...fromText]);

    const shareCode = await generateUniqueActivityShareCode();

    const activity = new Activity({
      title,
      description,
      link: link || '',
      category: category || 'General',
      hashtags: tagList,
      imageUrl: imageUrl ? String(imageUrl).slice(0, 2048) : '',
      shareCode,
      createdBy: req.user.id,
      supportedBy: [],
      completedBy: [],
    });

    await activity.save();

    const user = await User.findById(req.user.id);
    user.xp += 7;
    user.stats.activitiesPosted += 1;
    await user.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'username name avatar')
      .populate('completedBy', 'username name avatar')
      .populate('supportedBy', 'username name avatar');
    
    const withBuddies = await User.findById(req.user.id).populate('buddies', '_id name');
    for (const b of withBuddies.buddies || []) {
      await notifyUser({
        recipientId: b._id,
        scope: 'activity',
        type: 'activity_posted',
        title: 'New activity',
        body: `${user.name} shared an activity: ${title}`,
        link: '/dashboard',
      });
    }

    console.log('✅ Activity created:', activity.title);
    res.status(201).json(normalizeActivityResponse(populatedActivity));
  } catch (error) {
    console.error('❌ Create activity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/activities/:id/support', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const userId = req.user.id;
    const arr = activity.supportedBy || [];
    const has = arr.some((id) => id.toString() === userId);

    if (has) {
      activity.supportedBy = arr.filter((id) => id.toString() !== userId);
    } else {
      activity.supportedBy = [...arr, userId];
    }

    await activity.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'username name avatar')
      .populate('completedBy', 'username name avatar')
      .populate('supportedBy', 'username name avatar');

    if (!has && activity.createdBy.toString() !== userId) {
      const actor = await User.findById(userId).select('name username');
      await notifyUser({
        recipientId: activity.createdBy,
        scope: 'activity',
        type: 'activity_supported',
        title: 'Someone supported your activity',
        body: `${actor?.name || 'A buddy'} sent support on "${activity.title}"`,
        link: '/dashboard',
      });
    }

    res.json(normalizeActivityResponse(updatedActivity));
  } catch (error) {
    console.error('❌ Toggle support error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/activities/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this activity' });
    }

    await Activity.findByIdAndDelete(req.params.id);
    console.log('✅ Activity deleted');
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('❌ Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user XP and level stats
app.get('/api/users/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Calculate progress to next level
    const currentLevelXP = (user.level - 1) * 100;
    const nextLevelXP = user.level * 100;
    const xpInCurrentLevel = user.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - user.xp;
    const progressPercentage = (xpInCurrentLevel / 100) * 100;
    
    // Get task completion stats
    const tasksAssignedToUser = await Task.countDocuments({ assignedTo: req.user.id });
    const tasksCompletedByUser = await Task.countDocuments({ 
      assignedTo: req.user.id, 
      xpAwarded: true 
    });
    const tasksInProgress = tasksAssignedToUser - tasksCompletedByUser;
    
    res.json({
      username: user.username,
      name: user.name,
      level: user.level,
      levelTitle: user.levelTitle,
      xp: user.xp,
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercentage,
      stats: {
        ...user.stats,
        tasksAssignedToUser,
        tasksCompletedByUser,
        tasksInProgress
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get XP history (optional - for gamification dashboard)
app.get('/api/users/xp-history', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id,
      xpAwarded: true
    })
    .select('title category firstCompletedAt completionCount')
    .sort({ firstCompletedAt: -1 })
    .limit(50);
    
    const xpHistory = tasks.map(task => ({
      taskTitle: task.title,
      category: task.category,
      xpEarned: 10,
      completedAt: task.firstCompletedAt,
      timesCompleted: task.completionCount
    }));
    
    res.json(xpHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('username name avatar level levelTitle xp stats.totalTasksCompletedOnce')
      .sort({ xp: -1, level: -1 })
      .limit(10);
    
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ******************************************************************************************************
// **********************************FORGOT PASSWORD **********************************
// ******************************************************************************************************

// Update user profile (name and avatar)
app.patch('/api/users/update-profile', authenticateToken, async (req, res) => {
  try {
    console.log("update called")
    const { name, avatar } = req.body;
    const user = await User.findById(req.user.id);
    console.log("user to be updated: ", user);
    

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name && name.trim()) {
      console.log("name provided")
      user.name = name.trim();
    }

    // Update avatar if provided and valid
    if (avatar && avatar >= 1 && avatar <= 20) {
      user.avatar = avatar;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password -securityAnswer');
    
    console.log('✅ Profile updated for:', user.username);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify security question answer
app.post('/api/auth/verify-security', async (req, res) => {
  try {
    const { username, securityAnswer } = req.body;

    if (!username || !securityAnswer) {
      return res.status(400).json({ message: 'Username and security answer are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare security answer
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect security answer' });
    }

    // Generate temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET || 'karya',
      { expiresIn: '15m' }
    );

    console.log('✅ Security question verified for:', username);

    res.json({
      message: 'Security question verified',
      resetToken,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    console.error('❌ Security verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get security question for a user
app.get('/api/auth/security-question/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('securityQuestion username');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    console.error('❌ Get security question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password using reset token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'karya');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();

    console.log('✅ Password reset for:', user.username);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (when user is logged in)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();

    console.log('✅ Password changed for:', user.username);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// File uploads — Cloudinary when CLOUDINARY_* env vars are set; otherwise local disk + /uploads
app.post('/api/uploads', authenticateToken, (req, res) => {
  const useCloudinary = isCloudinaryConfigured();
  const parser = useCloudinary ? uploadMemory.single('file') : uploadDisk.single('file');

  parser(req, res, async (err) => {
    if (err) {
      const message =
        err.message ||
        (err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 8 MB).' : 'Upload failed');
      return res.status(400).json({ message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (useCloudinary) {
      try {
        const buffer = req.file.buffer;
        if (!buffer?.length) {
          return res.status(400).json({ message: 'Empty file' });
        }
        const result = await uploadImageBuffer(buffer, { folder: 'karya' });
        const url = result.secure_url || result.url;
        if (!url) {
          return res.status(500).json({ message: 'Upload succeeded but no URL returned' });
        }
        return res.json({
          url,
          originalName: req.file.originalname,
          publicId: result.public_id,
        });
      } catch (e) {
        console.error('Cloudinary upload error:', e);
        const code = e?.http_code ?? e?.error?.http_code;
        const message =
          code === 401
            ? 'Cloudinary rejected credentials. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
            : e?.message || 'Cloudinary upload failed';
        return res.status(500).json({ message });
      }
    }

    res.json({
      url: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
    });
  });
});
app.use('/uploads', express.static(uploadDir));

// In-app notifications
attachNotificationRoutes(app, { authenticateToken });

// Study rooms (buddy-only groups, structured tasks, no chat)
attachStudyRoomRoutes(app, { authenticateToken, User });

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  if (isCloudinaryConfigured()) {
    console.log('☁️  Image uploads: Cloudinary (folder karya/)');
  } else {
    console.log('📁 Image uploads: local disk (set CLOUDINARY_* to use Cloudinary)');
  }
});