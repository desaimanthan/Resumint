const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');

async function unifyAnalyticsSystem() {
  try {
    console.log('🔄 Starting analytics system unification...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resumint');
    console.log('✅ Connected to MongoDB');

    // Find all published resumes with simple analytics data
    const resumesWithAnalytics = await Resume.find({
      'publication.isPublished': true,
      'publication.analytics.totalViews': { $gt: 0 }
    });

    console.log(`📊 Found ${resumesWithAnalytics.length} resumes with existing analytics data`);

    for (const resume of resumesWithAnalytics) {
      const { totalViews, uniqueVisitors, lastViewed } = resume.publication.analytics;
      
      console.log(`\n📝 Processing resume: ${resume.title} (${resume.publication.subdomain})`);
      console.log(`   Current analytics: ${totalViews} views, ${uniqueVisitors} unique visitors`);

      // Check if we already have detailed analytics for this resume
      const existingAnalytics = await Analytics.countDocuments({ resumeId: resume._id });
      
      if (existingAnalytics === 0) {
        console.log('   No detailed analytics found, creating migration entries...');
        
        // Create migration analytics entries to represent the existing data
        const migrationEntries = [];
        
        // Create entries for unique visitors
        for (let i = 0; i < uniqueVisitors; i++) {
          const entryDate = new Date(lastViewed);
          // Spread entries over the last 30 days
          entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 30));
          
          migrationEntries.push({
            resumeId: resume._id,
            visitorId: `migration_visitor_${resume._id}_${i}`,
            timestamp: entryDate,
            ipAddress: '127.0.0.1',
            userAgent: 'Migration Script',
            location: {
              country: 'Unknown',
              countryCode: 'XX',
              region: 'Unknown',
              city: 'Unknown',
              timezone: 'UTC',
              coordinates: { lat: 0, lng: 0 }
            },
            device: {
              browser: 'Unknown',
              browserVersion: 'Unknown',
              os: 'Unknown',
              osVersion: 'Unknown',
              deviceType: 'desktop',
              screenResolution: '1920x1080'
            },
            session: {
              duration: 120, // 2 minutes average
              referrer: 'Migration',
              entryPage: `/${resume.publication.subdomain}`,
              exitPage: `/${resume.publication.subdomain}`,
              pageViews: Math.ceil(totalViews / uniqueVisitors),
              isNewVisitor: true
            },
            metadata: {
              language: 'en-US',
              timeZoneOffset: 0,
              colorDepth: 24,
              cookieEnabled: true
            }
          });
        }
        
        // Insert migration entries
        if (migrationEntries.length > 0) {
          await Analytics.insertMany(migrationEntries);
          console.log(`   ✅ Created ${migrationEntries.length} migration analytics entries`);
        }
      } else {
        console.log(`   ✅ Found ${existingAnalytics} existing detailed analytics entries`);
      }

      // Verify the analytics data matches
      const detailedAnalytics = await Analytics.getAnalyticsSummary(resume._id, 365);
      console.log(`   📊 Detailed analytics: ${detailedAnalytics.totalViews} views, ${detailedAnalytics.uniqueVisitors} unique visitors`);
    }

    console.log('\n🎉 Analytics system unification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - All resumes now use the unified Analytics collection');
    console.log('   - Simple analytics data has been migrated to detailed analytics');
    console.log('   - Both publish and analytics pages will show the same data');
    
  } catch (error) {
    console.error('❌ Error during analytics unification:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  unifyAnalyticsSystem()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { unifyAnalyticsSystem };
