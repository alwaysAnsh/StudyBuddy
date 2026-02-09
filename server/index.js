import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const app = express();

// ============================================
// CORS - Simple and Permissive for Development
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
    highestLevel: { type: Number, default: 1 } // Peak level achieved
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
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    default: '' 
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
  completedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

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

// Get all unique categories from all users
app.get('/api/users/all-categories', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'customCategories');
    const allCategories = new Set();
    
    users.forEach(user => {
      user.customCategories.forEach(cat => allCategories.add(cat));
    });
    
    res.json({ categories: Array.from(allCategories).sort() });
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

    // Update task
    if (status) task.status = status;
    if (notes !== undefined) task.notes = notes;

    // XP LOGIC - Award XP only once when task is marked completed for the first time
    const isNowCompleted = newStatus === 'completed';
    const wasNotCompleted = previousStatus !== 'completed';
    
    if (isNowCompleted && !task.xpAwarded) {
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
    
    // Return task with XP info
    const response = {
      ...updatedTask.toObject(),
      xpEarned: (!task.xpAwarded && isNowCompleted) ? 10 : 0,
      isFirstCompletion: !task.xpAwarded && isNowCompleted
    };

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
    const activities = await Activity.find()
      .populate('createdBy', 'username name')
      .populate('completedBy', 'username name')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('❌ Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { title, description, link, category } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const activity = new Activity({
      title,
      description,
      link: link || '',
      category: category || 'General',
      createdBy: req.user.id,
      completedBy: [req.user.id]
    });

    await activity.save();

    const user = await User.findById(req.user.id);
    user.xp += 7;
    user.stats.activitiesPosted += 1;
    await user.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'username name')
      .populate('completedBy', 'username name');
    
    console.log('✅ Activity created:', activity.title);
    res.status(201).json(populatedActivity);
  } catch (error) {
    console.error('❌ Create activity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/activities/:id/toggle-completion', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const userId = req.user.id;
    const hasCompleted = activity.completedBy.includes(userId);

    if (hasCompleted) {
      activity.completedBy = activity.completedBy.filter(id => id.toString() !== userId);
    } else {
      activity.completedBy.push(userId);
    }

    await activity.save();
    const updatedActivity = await Activity.findById(activity._id)
      .populate('createdBy', 'username name')
      .populate('completedBy', 'username name');
    
    console.log(`✅ Activity completion toggled: ${hasCompleted ? 'removed' : 'added'}`);
    res.json(updatedActivity);
  } catch (error) {
    console.error('❌ Toggle completion error:', error);
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
});