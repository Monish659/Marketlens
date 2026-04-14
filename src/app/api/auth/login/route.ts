import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

const usersFile = path.join(process.cwd(), 'users.json');

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function readUsers() {
  try {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data).users || [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const users = readUsers();
    const user = users.find((u: any) => u.email === email);

    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      token: Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64')
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
