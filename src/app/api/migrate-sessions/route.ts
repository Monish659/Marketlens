import { NextRequest, NextResponse } from 'next/server';
import { migrateProjectsToSessions, rollbackSessionMigration } from '@/scripts/migrate-to-sessions';

// POST /api/migrate-sessions - Run migration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'migrate') {
      const result = await migrateProjectsToSessions();
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully',
        result
      });
    } else if (action === 'rollback') {
      const result = await rollbackSessionMigration();
      return NextResponse.json({ 
        success: true, 
        message: 'Rollback completed successfully',
        result
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "migrate" or "rollback"' 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
