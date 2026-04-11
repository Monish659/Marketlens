import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import AnalysisSession from '@/models/AnalysisSession';

/**
 * Migration script to convert existing project phase2Data to AnalysisSession documents
 * This preserves existing analysis data while introducing the new session system
 */
export async function migrateProjectsToSessions() {
  console.log('🔄 [MIGRATION] Starting migration of projects to sessions...');
  
  try {
    await connectToDatabase();
    
    // Find all projects with phase2Data (simulation results)
    const projectsWithData = await Project.find({
      $or: [
        { phase2Data: { $exists: true, $ne: null } },
        { 'phase2Data.reactions': { $exists: true } },
        { 'phase2Data.metrics': { $exists: true } }
      ]
    });
    
    console.log(`📊 [MIGRATION] Found ${projectsWithData.length} projects with analysis data`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const project of projectsWithData) {
      try {
        // Check if sessions already exist for this project
        const existingSessions = await AnalysisSession.countDocuments({ 
          projectId: project._id 
        });
        
        if (existingSessions > 0) {
          console.log(`⏭️  [MIGRATION] Skipping project ${project.name} - already has ${existingSessions} sessions`);
          skippedCount++;
          continue;
        }
        
        // Extract data from phase2Data
        const phase2Data = project.phase2Data;
        if (!phase2Data) continue;
        
        // Create session from existing data
        const sessionName = `Migrated Analysis - ${new Date().toLocaleDateString()}`;
        const prompt = phase2Data.originalPrompt || phase2Data.prompt || 'Legacy analysis session';
        
        const analysisState = {
          niche: phase2Data.niche || '',
          nicheExtracted: Boolean(phase2Data.selectedUsers?.length > 0),
          selectedUsers: phase2Data.selectedUsers || [],
          opinions: phase2Data.opinions || [],
          metrics: phase2Data.metrics || {
            score: 0,
            totalResponses: 0,
            fullAttention: 0,
            partialAttention: 0,
            ignored: 0,
            viralCoefficient: 0,
            avgSentiment: 0
          },
          globeDots: phase2Data.globeDots || [],
          reactions: phase2Data.reactions || [],
          insights: phase2Data.insights || null,
          nicheInfo: phase2Data.nicheInfo || null
        };
        
        const uiState = {
          viewMode: phase2Data.viewMode || 'global',
          simulationType: phase2Data.simulationType || 'project-idea',
          currentSociety: phase2Data.currentSociety || 'Startup Investors',
          processedPersonas: phase2Data.processedPersonas || 0,
          currentProcessingStep: phase2Data.currentProcessingStep || ''
        };
        
        // Create the session
        const session = new AnalysisSession({
          projectId: project._id,
          userId: project.userId,
          sessionName,
          prompt,
          analysisState,
          uiState,
          createdAt: project.updatedAt || project.createdAt,
          lastAccessedAt: project.updatedAt || project.createdAt
        });
        
        await session.save();
        
        console.log(`✅ [MIGRATION] Migrated project "${project.name}" to session "${sessionName}"`);
        migratedCount++;
        
        // Optional: Clear phase2Data after successful migration
        // Uncomment the lines below if you want to clean up old data
        /*
        await Project.updateOne(
          { _id: project._id },
          { $unset: { phase2Data: 1 } }
        );
        */
        
      } catch (error) {
        console.error(`❌ [MIGRATION] Failed to migrate project ${project.name}:`, error);
      }
    }
    
    console.log(`🎉 [MIGRATION] Migration completed!`);
    console.log(`   - Migrated: ${migratedCount} projects`);
    console.log(`   - Skipped: ${skippedCount} projects`);
    console.log(`   - Total sessions created: ${migratedCount}`);
    
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount,
      total: projectsWithData.length
    };
    
  } catch (error) {
    console.error('💥 [MIGRATION] Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback migration - restore phase2Data from sessions
 * Use this if you need to rollback the migration
 */
export async function rollbackSessionMigration() {
  console.log('🔄 [ROLLBACK] Starting rollback of session migration...');
  
  try {
    await connectToDatabase();
    
    // Find all sessions
    const sessions = await AnalysisSession.find({});
    
    console.log(`📊 [ROLLBACK] Found ${sessions.length} sessions to rollback`);
    
    let rolledBackCount = 0;
    
    for (const session of sessions) {
      try {
        // Restore phase2Data to project
        const phase2Data = {
          originalPrompt: session.prompt,
          niche: session.analysisState.niche,
          selectedUsers: session.analysisState.selectedUsers,
          opinions: session.analysisState.opinions,
          metrics: session.analysisState.metrics,
          globeDots: session.analysisState.globeDots,
          reactions: session.analysisState.reactions,
          insights: session.analysisState.insights,
          nicheInfo: session.analysisState.nicheInfo,
          viewMode: session.uiState.viewMode,
          simulationType: session.uiState.simulationType,
          currentSociety: session.uiState.currentSociety,
          processedPersonas: session.uiState.processedPersonas,
          currentProcessingStep: session.uiState.currentProcessingStep
        };
        
        await Project.updateOne(
          { _id: session.projectId },
          { $set: { phase2Data } }
        );
        
        // Delete the session
        await AnalysisSession.deleteOne({ _id: session._id });
        
        rolledBackCount++;
        
      } catch (error) {
        console.error(`❌ [ROLLBACK] Failed to rollback session ${session._id}:`, error);
      }
    }
    
    console.log(`🎉 [ROLLBACK] Rollback completed! Restored ${rolledBackCount} projects`);
    
    return {
      success: true,
      rolledBack: rolledBackCount,
      total: sessions.length
    };
    
  } catch (error) {
    console.error('💥 [ROLLBACK] Rollback failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    migrateProjectsToSessions()
      .then(result => {
        console.log('Migration result:', result);
        process.exit(0);
      })
      .catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'rollback') {
    rollbackSessionMigration()
      .then(result => {
        console.log('Rollback result:', result);
        process.exit(0);
      })
      .catch(error => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: npx ts-node src/scripts/migrate-to-sessions.ts [migrate|rollback]');
    process.exit(1);
  }
}
