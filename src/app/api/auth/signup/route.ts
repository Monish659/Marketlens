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

function writeUsers(users: any[]) {
  fs.writeFileSync(usersFile, JSON.stringify({ users }, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const users = readUsers();
    
    // Check if user exists
    if (users.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Create user
    const newUser = {
      id: Math.random().toString(36).substring(7),
      email,
      name: name || email.split('@')[0],
      password: hashPassword(password)
    };

    users.push(newUser);
    writeUsers(users);

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token: Buffer.from(JSON.stringify({ id: newUser.id, email: newUser.email })).toString('base64')
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
