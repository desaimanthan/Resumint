const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const UAParser = require('ua-parser-js');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const { uploadToS3, deleteFromS3, listS3Files } = require('../config/s3');
const tokenMonitor = require('../utils/token-monitor');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Rate limiting specifically for refresh token endpoint
const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 refresh requests per minute
  message: {
    success: false,
    message: 'Too many token refresh attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter and one number'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', authLimiter, signupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        accessToken
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Record login history
    try {
      const userAgent = req.get('User-Agent') || '';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                       (req.connection.socket ? req.connection.socket.remoteAddress : null) || 'unknown';

      const loginHistoryEntry = new LoginHistory({
        userId: user._id,
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceInfo: {
          browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
          os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
          device: result.device.type || 'desktop'
        }
      });

      await loginHistoryEntry.save();
    } catch (historyError) {
      console.error('Error saving login history:', historyError);
      // Don't fail login if history saving fails
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshTokenLimiter, async (req, res) => {
  try {
    // Log refresh attempt for monitoring
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const attemptCount = tokenMonitor.logRefreshAttempt(clientIP, userAgent);
    
    // Additional protection: if too many attempts from same IP, add delay
    if (attemptCount > 8) {
      console.warn(`🚨 Excessive refresh attempts from ${clientIP}: ${attemptCount}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }

    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/auth/upload-avatar
// @desc    Upload profile picture
// @access  Private
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id;
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `user-${userId}/${fileName}`;

    console.log('Uploading profile picture via S3...');
    console.log('File path:', filePath);
    console.log('File size:', file.size);
    console.log('Content type:', file.mimetype);

    // Delete existing files for this user first
    try {
      const existingFiles = await listS3Files('profile-pictures', `user-${userId}/`);
      if (existingFiles.success && existingFiles.files.length > 0) {
        console.log('Deleting existing profile pictures:', existingFiles.files.length);
        for (const existingFile of existingFiles.files) {
          await deleteFromS3('profile-pictures', existingFile.Key);
        }
      }
    } catch (deleteError) {
      console.log('No existing files to delete or delete failed:', deleteError.message);
      // Continue with upload even if delete fails
    }

    // Upload new file to S3
    const uploadResult = await uploadToS3(
      'profile-pictures',
      filePath,
      file.buffer,
      file.mimetype
    );

    if (!uploadResult.success) {
      console.error('S3 upload failed:', uploadResult);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to storage'
      });
    }

    console.log('S3 upload successful:', uploadResult.url);

    // Update user's profile picture in database
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: uploadResult.url,
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter and one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/login-history
// @desc    Get user login history
// @access  Private
router.get('/login-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const loginHistory = await LoginHistory.find({ userId })
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await LoginHistory.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        loginHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/auth/remove-avatar
// @desc    Remove profile picture
// @access  Private
router.delete('/remove-avatar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture to remove'
      });
    }

    // Delete profile picture from S3
    try {
      const userPrefix = `user-${userId}/`;
      const existingFiles = await listS3Files('profile-pictures', userPrefix);
      
      if (existingFiles.success && existingFiles.files.length > 0) {
        console.log('Deleting profile pictures:', existingFiles.files.length);
        for (const file of existingFiles.files) {
          await deleteFromS3('profile-pictures', file.Key);
        }
      }
    } catch (storageError) {
      console.error('Error deleting profile picture from S3:', storageError);
      // Continue with database update even if S3 deletion fails
    }

    // Remove profile picture URL from database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $unset: { profilePicture: 1 } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete profile picture from S3 if exists
    if (user.profilePicture) {
      try {
        const userPrefix = `user-${userId}/`;
        const existingFiles = await listS3Files('profile-pictures', userPrefix);
        
        if (existingFiles.success && existingFiles.files.length > 0) {
          console.log('Deleting user profile pictures during account deletion:', existingFiles.files.length);
          for (const file of existingFiles.files) {
            await deleteFromS3('profile-pictures', file.Key);
          }
        }
      } catch (storageError) {
        console.error('Error deleting profile picture:', storageError);
        // Continue with account deletion even if file deletion fails
      }
    }

    // Delete login history
    await LoginHistory.deleteMany({ userId });

    // Delete user from database
    await User.findByIdAndDelete(userId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/token-monitor-stats
// @desc    Get token refresh monitoring stats (admin only)
// @access  Private
router.get('/token-monitor-stats', authenticateToken, (req, res) => {
  try {
    // Simple admin check - you can enhance this based on your user roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const stats = tokenMonitor.getStats();
    const recentActivity = tokenMonitor.analyzeRecentActivity(10); // Last 10 minutes

    res.json({
      success: true,
      data: {
        currentStats: stats,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Token monitor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
