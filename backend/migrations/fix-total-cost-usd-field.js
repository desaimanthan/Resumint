const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixTotalCostUSDField() {
  try {
    console.log('Starting migration to fix totalCostUSD field...');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to check`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      
      // Initialize aiUsageStats if it doesn't exist
      if (!user.aiUsageStats) {
        user.aiUsageStats = {
          totalTokensUsed: 0,
          totalCostUSD: 0,
          pdfParsingTokens: 0,
          optimizationTokens: 0,
          resumesParsed: 0,
          lastResetDate: new Date(),
          monthlyUsage: []
        };
        needsUpdate = true;
      } else {
        // Check if totalCostUSD field exists and is a number
        if (typeof user.aiUsageStats.totalCostUSD !== 'number') {
          user.aiUsageStats.totalCostUSD = 0;
          needsUpdate = true;
        }
        
        // Ensure other required fields exist
        if (typeof user.aiUsageStats.totalTokensUsed !== 'number') {
          user.aiUsageStats.totalTokensUsed = 0;
          needsUpdate = true;
        }
        
        if (typeof user.aiUsageStats.pdfParsingTokens !== 'number') {
          user.aiUsageStats.pdfParsingTokens = 0;
          needsUpdate = true;
        }
        
        if (typeof user.aiUsageStats.optimizationTokens !== 'number') {
          user.aiUsageStats.optimizationTokens = 0;
          needsUpdate = true;
        }
        
        if (typeof user.aiUsageStats.resumesParsed !== 'number') {
          user.aiUsageStats.resumesParsed = 0;
          needsUpdate = true;
        }
        
        if (!user.aiUsageStats.lastResetDate) {
          user.aiUsageStats.lastResetDate = new Date();
          needsUpdate = true;
        }
        
        if (!Array.isArray(user.aiUsageStats.monthlyUsage)) {
          user.aiUsageStats.monthlyUsage = [];
          needsUpdate = true;
        }
      }
      
      // Initialize usageLimits if it doesn't exist
      if (!user.usageLimits) {
        user.usageLimits = {
          monthlyTokenLimit: 100000,
          monthlyCostLimit: 50.0,
          dailyTokenLimit: 10000,
          dailyCostLimit: 5.0,
          isLimitEnabled: true,
          alertThresholds: {
            tokenWarning: 0.8,
            costWarning: 0.8
          }
        };
        needsUpdate = true;
      }
      
      // Initialize billing if it doesn't exist
      if (!user.billing) {
        user.billing = {
          plan: 'free',
          subscriptionId: null,
          billingCycle: 'monthly',
          nextBillingDate: null,
          paymentMethod: {
            type: null,
            last4: null,
            brand: null
          },
          invoiceHistory: []
        };
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        updatedCount++;
        console.log(`Updated user ${user.email} (${user._id})`);
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} users.`);
    
    // Verify the fix by checking a few users
    const sampleUsers = await User.find({}).limit(3);
    console.log('\nVerification - Sample user aiUsageStats:');
    sampleUsers.forEach((user, index) => {
      console.log(`User ${index + 1} (${user.email}):`);
      console.log(`  totalCostUSD: ${user.aiUsageStats?.totalCostUSD} (type: ${typeof user.aiUsageStats?.totalCostUSD})`);
      console.log(`  totalTokensUsed: ${user.aiUsageStats?.totalTokensUsed}`);
      console.log(`  monthlyUsage length: ${user.aiUsageStats?.monthlyUsage?.length || 0}`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  fixTotalCostUSDField()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTotalCostUSDField };
