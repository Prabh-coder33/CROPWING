// server.js - Main Express Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workspace-ai')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== MODELS ====================

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Senior Developer' },
  avatar: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  level: { type: Number, default: 5 },
  xp: { type: Number, default: 1250 },
  productivityScore: { type: Number, default: 94 },
  learningPathProgress: { type: Number, default: 82 },
  skills: {
    technical: { type: Number, default: 85 },
    communication: { type: Number, default: 62 },
    leadership: { type: Number, default: 70 },
    design: { type: Number, default: 55 }
  },
  streak: { type: Number, default: 12 },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Course Model
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Technical', 'Soft Skills', 'Leadership'] },
  duration: { type: String, required: true },
  rating: { type: Number, default: 4.5 },
  thumbnail: { type: String },
  gradient: { type: String, default: 'from-indigo-500 to-blue-600' },
  icon: { type: String, default: 'brain-circuit' },
  isLocked: { type: Boolean, default: false },
  prerequisite: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  enrolledUsers: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

// Idea Model
const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Process Improvement', 'Technical Solution', 'Team Culture'] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'implemented', 'rejected'] }
}, { timestamps: true });

const Idea = mongoose.model('Idea', ideaSchema);

// Achievement Model
const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'yellow' },
  earnedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Achievement = mongoose.model('Achievement', achievementSchema);

// Chat Message Model
const chatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  intent: { type: String }
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// ==================== MIDDLEWARE ====================

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        level: user.level,
        xp: user.xp
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get Current User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, role, skills } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, role, skills },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Dashboard Stats
app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const achievements = await Achievement.find({ userId: req.user.id }).sort({ earnedAt: -1 }).limit(3);
    const enrolledCourses = await Course.find({ 'enrolledUsers.userId': req.user.id });

    res.json({
      productivityScore: user.productivityScore,
      learningPathProgress: user.learningPathProgress,
      totalIdeas: await Idea.countDocuments({ author: req.user.id }),
      achievements,
      enrolledCourses: enrolledCourses.length,
      streak: user.streak
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COURSE ROUTES ====================

// Get All Courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const courses = await Course.find(filter)
      .populate('prerequisite', 'title')
      .sort({ createdAt: -1 });

    const coursesWithProgress = courses.map(course => {
      const enrollment = course.enrolledUsers.find(
        e => e.userId.toString() === req.user.id
      );
      return {
        ...course.toObject(),
        userProgress: enrollment ? enrollment.progress : 0,
        isEnrolled: !!enrollment
      };
    });

    res.json(coursesWithProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Course
app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('prerequisite');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll in Course
app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const alreadyEnrolled = course.enrolledUsers.some(
      e => e.userId.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    course.enrolledUsers.push({ userId: req.user.id, progress: 0 });
    await course.save();

    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Course Progress
app.put('/api/courses/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const enrollment = course.enrolledUsers.find(
      e => e.userId.toString() === req.user.id
    );

    if (!enrollment) {
      return res.status(400).json({ error: 'Not enrolled in this course' });
    }

    enrollment.progress = progress;
    await course.save();

    // Award achievement if completed
    if (progress === 100) {
      const user = await User.findById(req.user.id);
      user.xp += 150;
      await user.save();

      const achievement = new Achievement({
        userId: req.user.id,
        name: 'Course Completed',
        description: `Completed ${course.title}`,
        icon: 'graduation-cap',
        color: 'blue'
      });
      await achievement.save();
    }

    res.json({ message: 'Progress updated', progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== IDEA ROUTES ====================

// Get All Ideas
app.get('/api/ideas', authenticateToken, async (req, res) => {
  try {
    const { category, sort = 'trending' } = req.query;
    const filter = category ? { category } : {};

    let sortOption = {};
    if (sort === 'trending') {
      sortOption = { 'votes.length': -1 };
    } else if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    }

    const ideas = await Idea.find(filter)
      .populate('author', 'name avatar role')
      .sort(sortOption);

    const ideasWithVotes = ideas.map(idea => ({
      ...idea.toObject(),
      voteCount: idea.votes.length,
      hasVoted: idea.votes.some(v => v.toString() === req.user.id),
      commentCount: idea.comments.length
    }));

    res.json(ideasWithVotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create New Idea
app.post('/api/ideas', authenticateToken, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    const idea = new Idea({
      title,
      description,
      category,
      author: req.user.id
    });

    await idea.save();
    await idea.populate('author', 'name avatar role');

    res.status(201).json({ message: 'Idea created', idea });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote on Idea
app.post('/api/ideas/:id/vote', authenticateToken, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const voteIndex = idea.votes.indexOf(req.user.id);
    
    if (voteIndex > -1) {
      idea.votes.splice(voteIndex, 1);
    } else {
      idea.votes.push(req.user.id);
    }

    await idea.save();

    res.json({ 
      message: voteIndex > -1 ? 'Vote removed' : 'Vote added',
      voteCount: idea.votes.length,
      hasVoted: voteIndex === -1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Comment
app.post('/api/ideas/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    idea.comments.push({
      userId: req.user.id,
      text
    });

    await idea.save();
    await idea.populate('comments.userId', 'name avatar');

    res.json({ message: 'Comment added', comments: idea.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ACHIEVEMENT ROUTES ====================

// Get User Achievements
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user.id })
      .sort({ earnedAt: -1 });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHAT ROUTES ====================

// AI Chat
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();
    let response = '';
    let intent = 'general';

    // Intent Detection & Response Generation
    if (lowerMsg.includes('training') || lowerMsg.includes('course') || lowerMsg.includes('learn')) {
      intent = 'training';
      const topCourse = await Course.findOne({ category: 'Technical' }).sort({ rating: -1 });
      response = `I found a highly rated course for you: <b>'${topCourse.title}'</b>. It matches your technical profile.`;
    } else if (lowerMsg.includes('idea') || lowerMsg.includes('suggestion')) {
      intent = 'idea';
      response = `That's great! Innovation drives us forward. You can submit your idea directly to the Team Hub.`;
    } else if (lowerMsg.includes('policy') || lowerMsg.includes('remote') || lowerMsg.includes('hr')) {
      intent = 'policy';
      response = `<b>Remote Work Policy (Section 4.2):</b><br>Employees are permitted to work remotely up to 3 days a week with manager approval. Core hours are 10 AM - 3 PM.`;
    } else if (lowerMsg.includes('bug') || lowerMsg.includes('issue') || lowerMsg.includes('help')) {
      intent = 'support';
      const ticketId = 'IT-' + Math.floor(Math.random() * 10000);
      response = `I'm sorry you're facing an issue. I've logged ticket <b>#${ticketId}</b> for you. Support usually responds within 2 hours.`;
    } else {
      response = "I can help you with HR policies, technical documentation, or finding training. What do you need?";
    }

    const chatMessage = new ChatMessage({
      userId: req.user.id,
      message,
      response,
      intent
    });
    await chatMessage.save();

    res.json({ response, intent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Chat History
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SEED DATA (Development Only) ====================

app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Idea.deleteMany({});
    await Achievement.deleteMany({});

    // Create sample user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Alex Morgan',
      email: 'alex@nexus.com',
      password: hashedPassword,
      role: 'Senior Developer'
    });

    // Create sample courses
    const courses = await Course.insertMany([
      {
        title: 'AI Tools for Modern Developers',
        description: 'Master the integration of LLMs into your daily coding workflow.',
        category: 'Technical',
        duration: '2h 30m',
        rating: 4.8,
        gradient: 'from-indigo-500 to-blue-600',
        icon: 'brain-circuit'
      },
      {
        title: 'Collaborative Problem Solving',
        description: 'Strategies for overcoming resistance to change in large teams.',
        category: 'Soft Skills',
        duration: '45m',
        rating: 4.5,
        gradient: 'from-orange-400 to-pink-500',
        icon: 'users'
      },
      {
        title: 'Managing Remote Teams',
        description: 'Best practices for leading distributed teams effectively.',
        category: 'Leadership',
        duration: '1h 15m',
        rating: 4.7,
        isLocked: true,
        gradient: 'from-green-400 to-teal-500',
        icon: 'users-2'
      }
    ]);

    // Create sample ideas
    await Idea.insertMany([
      {
        title: 'Proposal: "Fail Fast" Fridays',
        description: 'Host a weekly 30-minute session where we share what didn\'t work with the new AI system.',
        category: 'Process Improvement',
        author: user._id,
        votes: []
      },
      {
        title: 'Legacy System Bridge',
        description: 'API wrapper that allows the new AI bot to query the old SQL database.',
        category: 'Technical Solution',
        author: user._id,
        votes: []
      }
    ]);

    // Create sample achievements
    await Achievement.insertMany([
      {
        userId: user._id,
        name: 'Early Bird',
        description: 'Logged in before 9 AM for 5 days',
        icon: 'award',
        color: 'yellow'
      },
      {
        userId: user._id,
        name: 'Code Master',
        description: 'Completed React Basics',
        icon: 'code-2',
        color: 'blue'
      }
    ]);

    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;