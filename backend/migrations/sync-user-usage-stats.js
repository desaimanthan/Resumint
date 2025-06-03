const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const AIUsageLog = require('../models/AIUsageLog');

async function syncUserUsageStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to sync`);

    for (const user of users) {
      console.log(`\nSyncing user: ${user.email}`);

      // Get all successful AI usage logs for this user
      const logs = await AIUsageLog.find({
        userId: user._id,
        'metadata.success': true
      });

      console.log(`Found ${logs.length} successful AI usage logs`);

      if (logs.length === 0) {
        console.log('No usage logs found, skipping...');
        continue;
      }

      // Calculate totals
      let totalTokensUsed = 0;
      let totalCostUSD = 0;
      let pdfParsingTokens = 0;
      let optimizationTokens = 0;
      let resumesParsed = 0;
      const monthlyUsage = {};

      for (const log of logs) {
        totalTokensUsed += log.totalTokens;
        totalCostUSD += log.cost;

        if (log.operation === 'pdf_parsing') {
          pdfParsingTokens += log.totalTokens;
          resumesParsed += 1;
        } else if (log.operation === 'optimization' || log.operation === 'summary_generation') {
          optimizationTokens += log.totalTokens;
        }

        // Group by month
        const month = log.timestamp.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyUsage[month]) {
          monthlyUsage[month] = { month, tokens: 0, cost: 0, operations: 0 };
        }
        monthlyUsage[month].tokens += log.totalTokens;
        monthlyUsage[month].cost += log.cost;
        monthlyUsage[month].operations += 1;
      }

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
      }

      // Update user stats
      user.aiUsageStats.totalTokensUsed = totalTokensUsed;
      user.aiUsageStats.totalCostUSD = totalCostUSD;
      user.aiUsageStats.pdfParsingTokens = pdfParsingTokens;
      user.aiUsageStats.optimizationTokens = optimizationTokens;
      user.aiUsageStats.resumesParsed = resumesParsed;
      user.aiUsageStats.monthlyUsage = Object.values(monthlyUsage);

      await user.save();

      console.log(`Updated user stats:`);
      console.log(`- Total tokens: ${totalTokensUsed}`);
      console.log(`- Total cost: $${totalCostUSD.toFixed(4)}`);
      console.log(`- PDF parsing tokens: ${pdfParsingTokens}`);
      console.log(`- Optimization tokens: ${optimizationTokens}`);
      console.log(`- Resumes parsed: ${resumesParsed}`);
      console.log(`- Monthly usage entries: ${Object.keys(monthlyUsage).length}`);
    }

    console.log('\n✅ User usage stats sync completed successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error syncing user usage stats:', error);
    process.exit(1);
  }
}

// Run the migration
syncUserUsageStats();
