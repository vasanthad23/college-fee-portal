const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { checkAndSendReminders } = require('./services/reminderService');

dotenv.config();

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...configuredOrigins
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isVercelDeployment = /^https:\/\/.*\.vercel\.app$/i.test(origin);
    if (allowedOrigins.has(origin) || isVercelDeployment) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

cron.schedule('0 9 * * *', async () => {
  try {
    await checkAndSendReminders();
  } catch (error) {
    console.error('Reminder scheduler failed:', error);
  }
});

console.log('Smart fee reminder scheduler started');

// Routes
app.get('/', (req, res) => {
  res.send('College Fee Management System API is running');
});

const authRoutes = require('./routes/authRoutes');
const semesterRoutes = require('./routes/semesterRoutes');
const feeStructureRoutes = require('./routes/feeStructureRoutes');
const installmentPlanRoutes = require('./routes/installmentPlanRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/installment-plans', installmentPlanRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reminders', reminderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
