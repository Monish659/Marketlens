import { NextResponse } from 'next/server';
import bundledPersonas from '../../../../personas.json';

type PersonaRecord = {
  personaId?: number | string;
  name?: string;
  email?: string;
  [key: string]: any;
};

function normalizeBundledPersonas(input: PersonaRecord[]) {
  return input.map((persona, index) => {
    const data = persona.user_metadata || persona;
    const name = data.name || persona.name || `Persona ${index + 1}`;
    const safeEmail =
      data.email ||
      persona.email ||
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}@marketlens.persona`;

    const normalized = {
      ...data,
      personaId: data.personaId || index + 1,
      name,
      title: data.title || data.occupation || 'Professional',
      email: safeEmail,
    };

    return {
      ...normalized,
      user_metadata: normalized,
    };
  });
}

export async function GET() {
  console.log('📁 [PERSONAS-LOCAL] Loading bundled personas');
  
  try {
    const personas = Array.isArray(bundledPersonas) ? bundledPersonas : [];
    
    if (personas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No personas bundled in deployment',
        },
        { status: 500 }
      );
    }

    const personasWithEmail = normalizeBundledPersonas(personas as PersonaRecord[]);
    console.log('✅ [PERSONAS-LOCAL] Loaded', personasWithEmail.length, 'bundled personas');
    
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
        error: 'Failed to load bundled personas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
