// migration.js - Run this ONCE to update existing tasks
// Place this file in your backend folder and run: node migration.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://karya:karya@karya.v1e4nug.mongodb.net/?appName=Karya', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected for Migration'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
  process.exit(1);
});

// Define schemas (same as in index.js)
const taskSchema = new mongoose.Schema({
  title: String,
  link: String,
  category: String,
  status: String,
  assignedBy: mongoose.Schema.Types.ObjectId,
  assignedTo: mongoose.Schema.Types.ObjectId,
  xpAwarded: { type: Boolean, default: false },
  firstCompletedAt: { type: Date, default: null },
  completionCount: { type: Number, default: 0 },
  createdAt: Date,
  notes: String
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  name: String,
  avatar: Number,
  bio: String,
  level: Number,
  xp: Number,
  levelTitle: String,
  streak: Number,
  lastActiveDate: Date,
  buddies: [mongoose.Schema.Types.ObjectId],
  stats: {
    tasksCompleted: { type: Number, default: 0 },
    tasksAssigned: { type: Number, default: 0 },
    notesCreated: { type: Number, default: 0 },
    activitiesPosted: { type: Number, default: 0 },
    totalTasksCompletedOnce: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    highestLevel: { type: Number, default: 1 }
  },
  customCategories: [String],
  createdAt: Date
});

const Task = mongoose.model('Task', taskSchema);
const User = mongoose.model('User', userSchema);

// Migration function
const migrateData = async () => {
  try {
    console.log('🚀 Starting migration...\n');

    // Step 1: Update all existing tasks
    console.log('📋 Step 1: Updating tasks...');
    
    const tasks = await Task.find({});
    console.log(`   Found ${tasks.length} tasks`);

    let tasksUpdated = 0;
    let completedTasksFound = 0;

    for (const task of tasks) {
      let needsUpdate = false;

      // Add xpAwarded field if missing
      if (task.xpAwarded === undefined) {
        // If task is completed, mark as XP already awarded
        // This prevents giving retroactive XP for old completed tasks
        task.xpAwarded = task.status === 'completed';
        needsUpdate = true;
        
        if (task.status === 'completed') {
          completedTasksFound++;
        }
      }

      // Add firstCompletedAt if task is completed
      if (!task.firstCompletedAt && task.status === 'completed') {
        task.firstCompletedAt = task.createdAt || new Date();
        needsUpdate = true;
      }

      // Add completionCount
      if (!task.completionCount) {
        task.completionCount = task.status === 'completed' ? 1 : 0;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await task.save();
        tasksUpdated++;
      }
    }

    console.log(`   ✅ Updated ${tasksUpdated} tasks`);
    console.log(`   📊 Found ${completedTasksFound} already completed tasks (marked as XP awarded)\n`);

    // Step 2: Update all users
    console.log('👥 Step 2: Updating users...');
    
    const users = await User.find({});
    console.log(`   Found ${users.length} users`);

    let usersUpdated = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Add levelTitle if missing
      if (!user.levelTitle) {
        const titles = {
          1: 'Initiate', 2: 'Adept', 3: 'Scholar', 4: 'Rune Bearer',
          5: 'Arcane Coder', 6: 'Shadow Architect', 7: 'Chrono Sage',
          8: 'Mythic Engineer', 9: 'Ethereal Overlord', 10: 'Celestial Ascendant'
        };
        const level = user.level || 1;
        user.levelTitle = level >= 10 ? titles[10] : titles[level] || titles[1];
        needsUpdate = true;
      }

      // Initialize new stats fields
      if (!user.stats) {
        user.stats = {
          tasksCompleted: 0,
          tasksAssigned: 0,
          notesCreated: 0,
          activitiesPosted: 0,
          totalTasksCompletedOnce: 0,
          totalXpEarned: user.xp || 0,
          highestLevel: user.level || 1
        };
        needsUpdate = true;
      } else {
        if (user.stats.totalTasksCompletedOnce === undefined) {
          // Count unique completed tasks
          const completedTasks = await Task.countDocuments({
            assignedTo: user._id,
            xpAwarded: true
          });
          user.stats.totalTasksCompletedOnce = completedTasks;
          needsUpdate = true;
        }

        if (!user.stats.totalXpEarned) {
          user.stats.totalXpEarned = user.xp || 0;
          needsUpdate = true;
        }

        if (!user.stats.highestLevel) {
          user.stats.highestLevel = user.level || 1;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await user.save();
        usersUpdated++;
      }
    }

    console.log(`   ✅ Updated ${usersUpdated} users\n`);

    // Step 3: Summary
    console.log('📊 Migration Summary:');
    console.log(`   Tasks processed: ${tasks.length}`);
    console.log(`   Tasks updated: ${tasksUpdated}`);
    console.log(`   Completed tasks found: ${completedTasksFound}`);
    console.log(`   Users processed: ${users.length}`);
    console.log(`   Users updated: ${usersUpdated}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  Important: All existing completed tasks have been marked as "XP already awarded"');
    console.log('   This prevents retroactive XP grants and maintains system integrity.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
console.log('\n' + '='.repeat(60));
console.log('  XP SYSTEM MIGRATION');
console.log('='.repeat(60) + '\n');
console.log('⚠️  WARNING: This will update all existing tasks and users');
console.log('   Make sure you have a database backup before proceeding!\n');

// Wait 3 seconds before starting
setTimeout(() => {
  migrateData();
}, 3000);

console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)\n');