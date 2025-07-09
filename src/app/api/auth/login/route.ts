/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from '@/lib/db/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Find the user by email, and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 }); // Unauthorized
    }

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    // If passwords match, create a JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || '',
      { expiresIn: MAX_AGE }
    );

    // Serialize the cookie to be sent in the response header
    const serializedCookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: MAX_AGE,
      path: '/',
    });

    return new Response(JSON.stringify({ message: 'Logged in successfully.' }), {
      status: 200,
      headers: { 'Set-Cookie': serializedCookie },
    });

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'An error occurred during login.' }, { status: 500 });
  }
}