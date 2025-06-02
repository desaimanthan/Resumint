require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Migration to remove proficiency field from skills
async function removeSkillProficiency() {
  try {
    console.log('🔄 Starting migration: Remove proficiency field from skills...');
    
    // Update all resume documents to remove proficiency field from skills array
    const result = await mongoose.connection.db.collection('resumes').updateMany(
      { 'skills.proficiency': { $exists: true } },
      { 
        $unset: { 
          'skills.$[].proficiency': '' 
        } 
      }
    );
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Documents modified: ${result.modifiedCount}`);
    console.log(`📊 Documents matched: ${result.matchedCount}`);
    
    // Verify the migration
    const sampleDoc = await mongoose.connection.db.collection('resumes').findOne(
      { 'skills.0': { $exists: true } },
      { skills: 1 }
    );
    
    if (sampleDoc && sampleDoc.skills && sampleDoc.skills.length > 0) {
      console.log('🔍 Sample skill after migration:', JSON.stringify(sampleDoc.skills[0], null, 2));
      
      if (sampleDoc.skills[0].proficiency) {
        console.log('⚠️  Warning: Proficiency field still exists in some documents');
      } else {
        console.log('✅ Proficiency field successfully removed');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  try {
    await connectDB();
    await removeSkillProficiency();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { removeSkillProficiency };
