import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  console.log('📁 [PERSONAS-LOCAL] Loading personas from local JSON file');
  
  try {
    // Read personas.json from project root
    const filePath = path.join(process.cwd(), 'personas.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const personas = JSON.parse(fileContent);
    
    console.log('✅ [PERSONAS-LOCAL] Loaded', personas.length, 'personas from local file');
    
    // Add email field for compatibility with existing code
    const personasWithEmail = personas.map((persona: any) => ({
      ...persona,
      email: `${persona.name.toLowerCase().replace(/\s+/g, '.')}@fake.com`
    }));
    
    console.log('🌍 [PERSONAS-LOCAL] Added email fields to', personasWithEmail.length, 'personas');
    
    return NextResponse.json({
      success: true,
      users: personasWithEmail,
      total: personasWithEmail.length
    });
    
  } catch (error) {
    console.error('💥 [PERSONAS-LOCAL] Error loading personas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load personas from local file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
