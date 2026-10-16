import {
  authenticateToken,
  requireRole
} from './middleware/auth.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);

// MongoDB models
const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  package: { type: String, default: 'Not specified' },
  skills: { type: [String], default: [] },
  deadline: { type: String, required: true },
  description: { type: String, default: '' }
}, { versionKey: false });

const applicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  jobId: { type: String, required: true },
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, default: 'Applied' },
  appliedAt: { type: String, default: () => new Date().toISOString() }
}, { versionKey: false });

applicationSchema.index({ jobId: 1, email: 1 }, { unique: true });

const Job = mongoose.model('Job', jobSchema);
const Application = mongoose.model('Application', applicationSchema);

const statuses = ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

// Initial sample data. Existing records won't be overwritten.
const seedJobs = [
  {
    id: 'job-1', company: 'HCLTech',
    title: 'Graduate Engineer Trainee', type: 'Full-time',
    location: 'Noida', package: 'Competitive',
    skills: ['JavaScript', 'SQL', 'OOP'],
    deadline: '2026-11-10',
    description: 'Entry-level engineering role for graduating students.'
  },
  {
    id: 'job-2', company: 'Accenture',
    title: 'Associate Software Engineer', type: 'Full-time',
    location: 'Gurugram', package: 'Competitive',
    skills: ['Problem solving', 'SQL', 'Programming'],
    deadline: '2026-11-18',
    description: 'Work with teams to build and maintain business software.'
  },
  {
    id: 'job-3', company: 'TechNova',
    title: 'Frontend Developer Intern', type: 'Internship',
    location: 'Remote', package: 'Paid internship',
    skills: ['React', 'CSS', 'REST APIs'],
    deadline: '2026-11-22',
    description: 'Build responsive user interfaces and integrate APIs.'
  },
  {
    id: 'job-4', company: 'DataSpring',
    title: 'Junior Data Analyst', type: 'Full-time',
    location: 'Noida', package: 'Competitive',
    skills: ['SQL', 'Excel', 'Python'],
    deadline: '2026-11-25',
    description: 'Help teams understand business data and create reports.'
  }
];

const seedApplications = [
  {
    id: 'app-1', jobId: 'job-1',
    studentName: 'Demo Student', email: 'student@example.com',
    status: 'Applied',
    appliedAt: new Date().toISOString()
  },
  {
    id: 'app-2', jobId: 'job-3',
    studentName: 'Demo Student', email: 'student@example.com',
    status: 'Assessment',
    appliedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

async function seedDatabase() {
  for (const job of seedJobs) {
    await Job.updateOne(
      { id: job.id },
      { $setOnInsert: job },
      { upsert: true }
    );
  }

  for (const application of seedApplications) {
    await Application.updateOne(
      { id: application.id },
      { $setOnInsert: application },
      { upsert: true }
    );
  }
}

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CareerConnect API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get and search jobs
app.get('/api/jobs', async (req, res, next) => {
  try {
    const q = String(req.query.search || '').trim();

    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { company: { $regex: q, $options: 'i' } },
            { location: { $regex: q, $options: 'i' } },
            { skills: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    res.json(await Job.find(filter).sort({ _id: 1 }).lean());
  } catch (error) {
    next(error);
  }
});

// Add a job
app.post(
  '/api/jobs',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
  try {
    const {
      company, title, type, location,
      package: salary, skills, deadline, description
    } = req.body || {};

    if (![company, title, type, location, deadline]
      .every(v => typeof v === 'string' && v.trim())) {
      return res.status(400).json({
        error: 'company, title, type, location and deadline are required.'
      });
    }

    const job = await Job.create({
      id: `job-${Date.now()}`,
      company: company.trim(),
      title: title.trim(),
      type: type.trim(),
      location: location.trim(),
      package: String(salary || 'Not specified'),
      skills: Array.isArray(skills) ? skills : [],
      deadline: deadline.trim(),
      description: String(description || '')
    });

    res.status(201).json(job.toObject());
  } catch (error) {
    next(error);
  }
});

 // Edit an existing job (admin only)
app.patch(
  '/api/jobs/:id',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const {
        company,
        title,
        type,
        location,
        package: salary,
        skills,
        deadline,
        description
      } = req.body || {};

      if (![company, title, type, location, deadline]
        .every(value => typeof value === 'string' && value.trim())) {
        return res.status(400).json({
          error: 'Company, title, type, location and deadline are required.'
        });
      }

      if (skills !== undefined && !Array.isArray(skills)) {
        return res.status(400).json({
          error: 'Skills must be a list.'
        });
      }

      const job = await Job.findOneAndUpdate(
        { id: req.params.id },
        {
          $set: {
            company: company.trim(),
            title: title.trim(),
            type: type.trim(),
            location: location.trim(),
            package: String(salary || 'Not specified').trim(),
            skills: Array.isArray(skills)
              ? skills.map(s => String(s).trim()).filter(Boolean)
              : [],
            deadline: deadline.trim(),
            description: String(description || '').trim()
          }
        },
        { new: true, runValidators: true }
      ).lean();

      if (!job) {
        return res.status(404).json({
          error: 'Job opportunity not found.'
        });
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

// Get applications, including their related jobs


app.get(
  '/api/applications',
  authenticateToken,
  async (req, res, next) => {
    try {
      const filter = req.user.role === 'admin'
        ? {}
        : { userId: req.user.id };

      const applications = await Application.find(filter)
        .sort({ _id: -1 })
        .lean();

      const jobs = await Job.find().lean();
      const jobsById = new Map(jobs.map(job => [job.id, job]));

      res.json(applications.map(application => ({
        ...application,
        job: jobsById.get(application.jobId) || null
      })));
    } catch (error) {
      next(error);
    }
  }
);



 // Apply for a job
app.post(
  '/api/applications',
  authenticateToken,
  requireRole('student'),
  async (req, res, next) => {
    try {
      const { jobId } = req.body || {};

      if (typeof jobId !== 'string' || !jobId.trim()) {
        return res.status(400).json({
          error: 'A valid job ID is required.'
        });
      }

      const job = await Job.findOne({ id: jobId }).lean();

      if (!job) {
        return res.status(404).json({ error: 'Job not found.' });
      }

      const existing = await Application.findOne({
        jobId,
        email: req.user.email
      });

      if (existing) {
        return res.status(409).json({
          error: 'You have already applied to this opportunity.'
        });
      }

      const application = await Application.create({
        id: `app-${Date.now()}`,
        userId: req.user.id,
        jobId,
        studentName: req.user.name,
        email: req.user.email,
        status: 'Applied',
        appliedAt: new Date().toISOString()
      });

      res.status(201).json({
        ...application.toObject(),
        job
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'You have already applied to this opportunity.'
        });
      }

      next(error);
    }
  }
);



// Update application status
app.patch(
  '/api/applications/:id',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
  try {
    const { status } = req.body || {};

    if (!statuses.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${statuses.join(', ')}`
      });
    }

    const application = await Application.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();

    if (!application) {
      return res.status(404).json({
        error: 'Application not found.'
      });
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

// Connect to MongoDB before accepting API requests
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the server .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected successfully');

    await seedDatabase();
    console.log('Sample jobs and applications are ready');

    app.listen(PORT, () => {
      console.log(`CareerConnect API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start CareerConnect:', error.message);
    process.exit(1);
  }
}

startServer();
