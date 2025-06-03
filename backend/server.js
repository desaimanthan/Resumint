require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const coverLetterRoutes = require('./routes/cover-letter');
const companiesRoutes = require('./routes/companies');
const aiRoutes = require('./routes/ai');
const publishedRoutes = require('./routes/published');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration - Fixed frontend port
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app',
        /^https:\/\/.*\.vercel\.app$/,  // Allow any Vercel app
        'https://resumint.site',  // Allow main custom domain
        /^https:\/\/.*\.resumint\.site$/  // Allow any subdomain of resumint.site
      ]
    : [
        'http://localhost:8080',  // Fixed frontend port
        /^http:\/\/.*\.localhost:8080$/  // Allow any subdomain of localhost:8080
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/published', publishedRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
// restart
